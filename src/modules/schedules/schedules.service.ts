import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { Category } from '@/entities/category.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ResponseScheduleDto } from './dto/response-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';
import { VoiceScheduleResponseDto } from './dto/voice-schedule-upload.dto';
import { ConfigService } from '@nestjs/config';
import { VoiceTranscriptionService } from './voice-transcription.service';
import { UsersService } from '../users/users.service';
import OpenAI from 'openai';
import { GroupService } from '../group/group.service';
import { GroupSchedule } from '@/entities/group-schedule.entity';

@Injectable()
export class SchedulesService {
  private openai: OpenAI;
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly configService: ConfigService,
    private readonly voiceTranscriptionService: VoiceTranscriptionService,
    private readonly usersService: UsersService,
    @InjectRepository(GroupSchedule)
    private groupScheduleRepository: Repository<GroupSchedule>,
    private groupService: GroupService,
  ) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  // 일정 조회 관련 메서드

  /**
   * 사용자의 모든 일정을 조회합니다.
   */
  async findAllByUserUuid(userUuid: string): Promise<ResponseScheduleDto[]> {
    const startDate = new Date(Date.UTC(2000, 0, 1));
    const endDate = new Date(Date.UTC(2100, 11, 31, 23, 59, 59, 999));
    return this.getSchedulesInRange(userUuid, startDate, endDate);
  }

  /**
   * 특정 기간 내의 일정을 조회합니다.
   */
  async getSchedulesInRange(
    userUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ResponseScheduleDto[]> {
    const [regularSchedules, recurringSchedules] = await Promise.all([
      this.findRegularSchedulesInRange(userUuid, startDate, endDate),
      this.findRecurringSchedules(userUuid),
    ]);

    const expandedRecurringSchedules = this.expandRecurringSchedules(
      recurringSchedules,
      startDate,
      endDate,
    );

    const sharedGroupSchedules = await this.findSharedGroupSchedules(
      userUuid,
      startDate,
      endDate,
    );

    const allSchedules = [
      ...regularSchedules,
      ...expandedRecurringSchedules,
      ...sharedGroupSchedules,
    ];
    allSchedules.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const convertedSchedules = await Promise.all(
      allSchedules.map((schedule) => this.convertToResponseDto(schedule)),
    );

    return convertedSchedules;
  }

  // 공유된 일정을 파악하는 함수.
  private async findSharedGroupSchedules(
    userUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Schedule[]> {
    return this.schedulesRepository
      .createQueryBuilder('schedule')
      .innerJoin('schedule.groupSchedules', 'groupSchedule')
      .where('groupSchedule.userUuid = :userUuid', { userUuid })
      .andWhere('schedule.startDate <= :endDate', { endDate })
      .andWhere('schedule.endDate >= :startDate', { startDate })
      .getMany();
  }

  private async findSharedGroupSchedulesByScheduleId(
    userUuid: string,
    scheduleId: number,
  ): Promise<Schedule> {
    return this.schedulesRepository
      .createQueryBuilder('schedule')
      .innerJoin('schedule.groupSchedules', 'groupSchedule')
      .where('groupSchedule.userUuid = :userUuid', { userUuid })
      .andWhere('schedule.scheduleId = :scheduleId', { scheduleId })
      .getOne();
  }

  /**
   * 월별 일정을 조회합니다.
   */
  async findByMonth(
    userUuid: string,
    year: number,
    month: number,
  ): Promise<ResponseScheduleDto[]> {
    await this.validateUser(userUuid);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return this.getSchedulesInRange(userUuid, startDate, endDate);
  }

  /**
   * 주별 일정을 조회합니다.
   */
  async findByWeek(
    userUuid: string,
    date: string,
  ): Promise<ResponseScheduleDto[]> {
    await this.validateUser(userUuid);
    const inputDate = new Date(date);
    inputDate.setUTCHours(0, 0, 0, 0);
    const dayOfWeek = inputDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일부터 시작하도록 조정
    const weekStartDate = new Date(inputDate);
    weekStartDate.setDate(inputDate.getDate() + daysToMonday);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setUTCHours(23, 59, 59, 999);
    return this.getSchedulesInRange(userUuid, weekStartDate, weekEndDate);
  }

  /**
   * 일별 일정을 조회합니다.
   */
  async findByDate(dateQuery: WeekQueryDto): Promise<ResponseScheduleDto[]> {
    await this.validateUser(dateQuery.userUuid);
    const startOfDay = new Date(dateQuery.date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateQuery.date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    return this.getSchedulesInRange(dateQuery.userUuid, startOfDay, endOfDay);
  }

  /**
   * 연도별 일정을 조회합니다.
   */
  async findByYear(
    userUuid: string,
    year: number,
  ): Promise<ResponseScheduleDto[]> {
    await this.validateUser(userUuid);
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    return this.getSchedulesInRange(userUuid, startDate, endDate);
  }

  /**
   * 특정 일정을 ID로 조회합니다.
   */
  async findOne(id: number): Promise<ResponseScheduleDto> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId: id },
      relations: ['category'],
    });
    if (!schedule) {
      throw new NotFoundException(
        `해당 id : ${id}를 가진 일정을 찾을 수 없습니다.`,
      );
    }
    return this.convertToResponseDto(schedule);
  }

  // 일정 생성 및 수정 관련 메서드

  /**
   * 새로운 일정을 생성합니다.
   */
  async createSchedule(
    userUuid: string,
    createScheduleDto: CreateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    const category = await this.getCategoryById(
      createScheduleDto.categoryId ?? 7,
    );

    const startDate = new Date(createScheduleDto.startDate);
    const endDate = new Date(createScheduleDto.endDate);

    // 종료일이 시작일보다 이전인 경우 에러
    if (endDate <= startDate) {
      throw new BadRequestException('종료일은 시작일보다 이후여야 합니다.');
    }

    // 반복 일정에 대한 유효성 검사
    if (createScheduleDto.repeatType !== 'none') {
      if (!createScheduleDto.repeatEndDate) {
        throw new BadRequestException(
          '반복 일정은 반드시 종료일(repeatEndDate)을 지정해야 합니다.',
        );
      }

      const repeatEndDate = new Date(createScheduleDto.repeatEndDate);

      // repeatEndDate가 endDate보다 이전인 경우 에러
      if (repeatEndDate <= endDate) {
        throw new BadRequestException(
          '반복 일정의 종료일은 일정의 종료일보다 이후여야 합니다.',
        );
      }

      // 반복 옵션 예외 검사
      this.validateRecurringOptions(createScheduleDto);
    }

    const newSchedule = this.schedulesRepository.create({
      ...createScheduleDto,
      userUuid,
      category,
      isRecurring: createScheduleDto.repeatType !== 'none',
    });

    if (newSchedule.isAllDay) {
      [newSchedule.startDate, newSchedule.endDate] = this.adjustDateForAllDay(
        newSchedule.startDate,
        newSchedule.endDate,
      );
    }

    const savedSchedule = await this.schedulesRepository.save(newSchedule);
    if (createScheduleDto.groupInfo && createScheduleDto.groupInfo.length > 0) {
      await this.groupService.linkScheduleToGroupsAndUsers(
        savedSchedule,
        createScheduleDto.groupInfo,
      );
    }

    return this.convertToResponseDto(savedSchedule);
  }

  /**
   * 반복 일정 옵션 유효성을 검사합니다.
   */
  private validateRecurringOptions(createScheduleDto: CreateScheduleDto) {
    const {
      repeatType,
      recurringDaysOfWeek,
      recurringDayOfMonth,
      recurringMonthOfYear,
    } = createScheduleDto;

    switch (repeatType) {
      case 'weekly':
        if (recurringMonthOfYear !== null) {
          throw new BadRequestException(
            '주간 반복에서는 recurringMonthOfYear를 설정할 수 없습니다.',
          );
        }
        if (!recurringDaysOfWeek || recurringDaysOfWeek.length === 0) {
          throw new BadRequestException(
            '주간 반복에서는 recurringDaysOfWeek를 반드시 설정해야 합니다.',
          );
        }
        break;
      case 'monthly':
        if (recurringMonthOfYear !== null) {
          throw new BadRequestException(
            '월간 반복에서는 recurringMonthOfYear를 설정할 수 없습니다.',
          );
        }
        if (recurringDayOfMonth === null) {
          throw new BadRequestException(
            '월간 반복에서는 recurringDayOfMonth를 반드시 설정해야 합니다.',
          );
        }
        break;
      case 'yearly':
        if (recurringMonthOfYear === null) {
          throw new BadRequestException(
            '연간 반복에서는 recurringMonthOfYear를 반드시 설정해야 합니다.',
          );
        }
        if (recurringDayOfMonth === null) {
          throw new BadRequestException(
            '연간 반복에서는 recurringDayOfMonth를 반드시 설정해야 합니다.',
          );
        }
        break;
    }
  }

  /**
   * 기존 일정을 수정합니다.
   */
  async updateSchedule(
    userUuid: string,
    scheduleId: number,
    updateScheduleDto: UpdateScheduleDto,
    instanceDate: Date,
    updateType: 'single' | 'future' = 'single',
  ): Promise<ResponseScheduleDto> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId, userUuid },
      relations: ['category'],
    });

    if (!schedule) {
      throw new NotFoundException(
        `해당 ID : ${scheduleId}를 가진 일정을 찾을 수 없습니다.`,
      );
    }

    if (schedule.isRecurring && instanceDate) {
      const isValidDate = this.isOccurrenceDate(schedule, instanceDate);
      if (!isValidDate) {
        throw new BadRequestException(
          `지정된 날짜 ${instanceDate}는 이 반복 일정의 유효한 날짜가 아닙니다.`,
        );
      }
    }

    if (schedule.isRecurring) {
      // 반복 일정 수정
      if (updateType === 'single') {
        return this.updateSingleInstance(
          schedule,
          updateScheduleDto,
          instanceDate,
        );
      } else {
        return this.updateFutureInstances(
          schedule,
          updateScheduleDto,
          instanceDate,
        );
      }
    } else {
      // 일반 일정 수정
      Object.assign(schedule, updateScheduleDto);
      if (updateScheduleDto.categoryId) {
        schedule.category = await this.getCategoryById(
          updateScheduleDto.categoryId,
        );
      }
      const updatedSchedule = await this.schedulesRepository.save(schedule);
      return this.convertToResponseDto(updatedSchedule);
    }
  }

  /**
   * 특정 날짜의 반복 일정을 수정합니다.
   */
  private async updateSingleInstance(
    schedule: Schedule,
    updateScheduleDto: UpdateScheduleDto,
    instanceDate: Date,
  ): Promise<ResponseScheduleDto> {
    const originalEndDate = schedule.repeatEndDate;

    // 원본 일정의 반복 종료일 수정
    schedule.repeatEndDate = new Date(instanceDate);
    schedule.repeatEndDate.setUTCDate(schedule.repeatEndDate.getUTCDate() - 1);
    schedule.repeatEndDate.setUTCHours(23, 59, 59, 999);
    await this.schedulesRepository.save(schedule);

    // 특정 일정 수정
    const updatedInstance = new Schedule();
    Object.assign(updatedInstance, schedule, updateScheduleDto);
    updatedInstance.scheduleId = undefined;
    updatedInstance.startDate = new Date(instanceDate);
    updatedInstance.startDate.setUTCHours(
      schedule.startDate.getUTCHours(),
      schedule.startDate.getUTCMinutes(),
    );
    updatedInstance.endDate = new Date(instanceDate);
    updatedInstance.endDate.setUTCHours(
      schedule.endDate.getUTCHours(),
      schedule.endDate.getUTCMinutes(),
    );

    // 시간 변동사항이 있는 경우에만 시간 업데이트
    if (updateScheduleDto.startDate) {
      updatedInstance.startDate.setUTCHours(
        updateScheduleDto.startDate.getUTCHours(),
      );
      updatedInstance.startDate.setUTCMinutes(
        updateScheduleDto.startDate.getUTCMinutes(),
      );
    }
    if (updateScheduleDto.endDate) {
      updatedInstance.endDate.setUTCHours(
        updateScheduleDto.endDate.getUTCHours(),
      );
      updatedInstance.endDate.setUTCMinutes(
        updateScheduleDto.endDate.getUTCMinutes(),
      );
    }
    updatedInstance.isRecurring = false;
    updatedInstance.repeatType = 'none';
    updatedInstance.repeatEndDate = null;
    updatedInstance.recurringInterval = null;
    updatedInstance.recurringDaysOfWeek = null;
    updatedInstance.recurringDayOfMonth = null;
    updatedInstance.recurringMonthOfYear = null;

    const savedInstance = await this.schedulesRepository.save(updatedInstance);

    // 나머지 일정 생성
    const newSchedule = new Schedule();
    Object.assign(newSchedule, schedule);
    newSchedule.scheduleId = undefined;
    newSchedule.repeatEndDate = originalEndDate;

    // 반복 유형에 따라 다음 시작일 계산
    const nextStartDate = this.getNextOccurrenceDate(schedule, instanceDate);
    newSchedule.startDate = new Date(nextStartDate);
    newSchedule.startDate.setUTCHours(
      schedule.startDate.getUTCHours(),
      schedule.startDate.getUTCMinutes(),
    );

    // 종료일 계산
    const duration = schedule.endDate.getTime() - schedule.startDate.getTime();
    newSchedule.endDate = new Date(newSchedule.startDate.getTime() + duration);
    newSchedule.endDate.setHours(
      schedule.endDate.getUTCHours(),
      schedule.endDate.getUTCMinutes(),
    );

    await this.schedulesRepository.save(newSchedule);

    return this.convertToResponseDto(savedInstance);
  }

  /**
   * 특정 날짜 이후의 반복 일정을 수정합니다.
   */
  private async updateFutureInstances(
    schedule: Schedule,
    updateScheduleDto: UpdateScheduleDto,
    instanceDate: Date,
  ): Promise<ResponseScheduleDto> {
    const originalEndDate = schedule.repeatEndDate;

    // 새로운 일정 생성
    const newSchedule = new Schedule();
    Object.assign(newSchedule, schedule, updateScheduleDto);
    newSchedule.scheduleId = undefined;

    // startDate 업데이트
    newSchedule.startDate = new Date(instanceDate);
    if (updateScheduleDto.startDate) {
      newSchedule.startDate.setUTCHours(
        updateScheduleDto.startDate.getUTCHours(),
        updateScheduleDto.startDate.getUTCMinutes(),
        0,
        0,
      );
    } else {
      newSchedule.startDate.setUTCHours(
        schedule.startDate.getUTCHours(),
        schedule.startDate.getUTCMinutes(),
        0,
        0,
      );
    }

    if (updateScheduleDto.endDate) {
      newSchedule.endDate = new Date(updateScheduleDto.endDate);
    } else {
      const duration =
        schedule.endDate.getTime() - schedule.startDate.getTime();
      newSchedule.endDate = new Date(
        newSchedule.startDate.getTime() + duration,
      );
    }

    newSchedule.repeatEndDate = new Date(originalEndDate);

    if (updateScheduleDto.categoryId) {
      newSchedule.category = await this.getCategoryById(
        updateScheduleDto.categoryId,
      );
    }

    if (instanceDate.getTime() === schedule.startDate.getTime()) {
      await this.schedulesRepository.remove(schedule);
    } else {
      schedule.repeatEndDate = new Date(instanceDate);
      schedule.repeatEndDate.setUTCDate(
        schedule.repeatEndDate.getUTCDate() - 1,
      );
      schedule.repeatEndDate.setUTCHours(23, 59, 59, 999);
      await this.schedulesRepository.save(schedule);
    }

    const savedNewSchedule = await this.schedulesRepository.save(newSchedule);

    return this.convertToResponseDto(savedNewSchedule);
  }

  /**
   * 일정을 삭제합니다.
   */
  async deleteSchedule(
    userUuid: string,
    scheduleId: number,
    instanceDate: string,
    deleteType: 'single' | 'future' = 'single',
  ): Promise<void> {
    // 일단 해당 ID로 사용자가 생성한 일정인지 찾음
    let schedule = await this.schedulesRepository.findOne({
      where: { scheduleId, userUuid },
    });
    let isCreator = true;

    // 사용자가 생성한 일정이 아니라면 공유 받은 일정인지 찾음
    if (!schedule) {
      const sharedSchedules = await this.findSharedGroupSchedulesByScheduleId(
        userUuid,
        scheduleId,
      );
      schedule = sharedSchedules;
      isCreator = false;
    }

    if (!schedule) {
      throw new NotFoundException(
        `ID가 ${scheduleId}인 일정을 찾을 수 없습니다.`,
      );
    }
    const targetDate = new Date(instanceDate);

    if (schedule.isRecurring) {
      if (schedule.repeatEndDate && schedule.repeatEndDate < targetDate) {
        throw new BadRequestException(
          '삭제하려는 날짜가 반복 일정의 종료일보다 늦습니다.',
        );
      }

      if (isCreator) {
        if (deleteType === 'future') {
          await this.deleteFutureInstances(schedule, targetDate);
        } else {
          await this.deleteSingleInstance(schedule, targetDate);
        }
      } else {
        // 공유 받은 사용자라면 해당 날짜 이후의 그룹 일정에서만 제거
        await this.removeUserFromFutureGroupSchedules(userUuid, schedule);
      }
    } else {
      if (isCreator) {
        // 일정 생성자인 경우 일정과 관련된 모든 그룹 일정 삭제
        await this.groupScheduleRepository.delete({ schedule: { scheduleId } });
        await this.schedulesRepository.remove(schedule);
      } else {
        // 공유 받은 사용자인 경우 해당 사용자의 그룹 일정만 삭제
        await this.groupScheduleRepository.delete({
          schedule: { scheduleId },
          userUuid,
        });
      }
    }
  }

  private async removeUserFromFutureGroupSchedules(
    userUuid: string,
    schedule: Schedule,
  ): Promise<void> {
    await this.groupScheduleRepository.delete({
      schedule: { scheduleId: schedule.scheduleId },
      userUuid,
    });
  }

  /**
   * 특정 날짜 이후의 반복 일정을 삭제합니다.
   */
  private async deleteFutureInstances(
    schedule: Schedule,
    targetDate: Date,
  ): Promise<Date> {
    // 원본 일정의 종료일 수정
    const originalEndDate = schedule.repeatEndDate;
    schedule.repeatEndDate = new Date(targetDate);
    schedule.repeatEndDate.setUTCDate(schedule.repeatEndDate.getUTCDate() - 1);
    schedule.repeatEndDate.setUTCHours(23, 59, 59, 999);
    await this.schedulesRepository.save(schedule);

    return originalEndDate;
  }

  /**
   * 특정 날짜의 반복 일정 삭제
   */
  private async deleteSingleInstance(
    schedule: Schedule,
    targetDate: Date,
  ): Promise<void> {
    // deleteFutureInstances를 이용해 원본 일정 수정
    const originalEndDate = await this.deleteFutureInstances(
      schedule,
      targetDate,
    );

    const newSchedule = { ...schedule };
    newSchedule.scheduleId = undefined; // 새로운 ID 생성을 위해 undefined 설정
    newSchedule.startDate = this.getNextOccurrenceDate(schedule, targetDate);
    newSchedule.endDate = new Date(
      newSchedule.startDate.getTime() +
        (schedule.endDate.getTime() - schedule.startDate.getTime()),
    );
    newSchedule.repeatEndDate = originalEndDate;

    await this.schedulesRepository.save(newSchedule);
  }

  // 헬퍼 메서드

  private async findRecurringSchedules(userUuid: string): Promise<Schedule[]> {
    return this.schedulesRepository.find({
      where: { userUuid, isRecurring: true },
      relations: ['category'],
    });
  }

  private async findRegularSchedulesInRange(
    userUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Schedule[]> {
    return this.schedulesRepository.find({
      where: {
        userUuid,
        startDate: LessThanOrEqual(endDate),
        endDate: MoreThanOrEqual(startDate),
        isRecurring: false,
      },
      relations: ['category'],
    });
  }

  private expandRecurringSchedules(
    schedules: Schedule[],
    startDate: Date,
    endDate: Date,
  ): Schedule[] {
    const expandedSchedules: Schedule[] = [];

    for (const schedule of schedules) {
      if (schedule.repeatEndDate && schedule.repeatEndDate < startDate) {
        continue;
      }

      let currentDate = new Date(schedule.startDate);
      const scheduleEndDate = schedule.repeatEndDate || endDate;

      while (currentDate <= scheduleEndDate && currentDate <= endDate) {
        if (this.isOccurrenceDate(schedule, currentDate)) {
          const newSchedule = this.createOccurrence(schedule, currentDate);
          if (
            newSchedule.startDate <= endDate &&
            newSchedule.endDate >= startDate
          ) {
            expandedSchedules.push(newSchedule);
          }
        }
        currentDate = this.getNextOccurrenceDate(schedule, currentDate);
      }
    }

    return expandedSchedules;
  }

  private isOccurrenceDate(schedule: Schedule, date: Date): boolean {
    switch (schedule.repeatType) {
      case 'daily':
        return true;
      case 'weekly':
        return schedule.recurringDaysOfWeek.includes(date.getDay());
      case 'monthly':
        return date.getDate() === schedule.recurringDayOfMonth;
      case 'yearly':
        return (
          date.getMonth() === schedule.recurringMonthOfYear &&
          date.getDate() === schedule.recurringDayOfMonth
        );
      default:
        return false;
    }
  }

  private getNextOccurrenceDate(schedule: Schedule, currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    const interval = schedule.recurringInterval || 1;

    switch (schedule.repeatType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weekly':
        do {
          nextDate.setDate(nextDate.getDate() + 1);
        } while (!schedule.recurringDaysOfWeek.includes(nextDate.getDay()));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        nextDate.setDate(schedule.recurringDayOfMonth);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        nextDate.setMonth(schedule.recurringMonthOfYear);
        nextDate.setDate(schedule.recurringDayOfMonth);
        break;
    }

    return nextDate;
  }

  private createOccurrence(schedule: Schedule, startDate: Date): Schedule {
    const duration = schedule.endDate.getTime() - schedule.startDate.getTime();
    const endDate = new Date(startDate.getTime() + duration);

    return {
      ...schedule,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };
  }

  private adjustDateForAllDay(startDate: Date, endDate: Date): [Date, Date] {
    const adjustedStartDate = new Date(startDate);
    adjustedStartDate.setUTCHours(0, 0, 0, 0);

    const adjustedEndDate = new Date(endDate);
    adjustedEndDate.setUTCHours(23, 59, 59, 999);
    return [adjustedStartDate, adjustedEndDate];
  }

  private async getCategoryById(categoryId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { categoryId: categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `전달받은 카테고리 ID인 ${categoryId}는 존재하지 않는 카테고리입니다.`,
      );
    }

    return category;
  }

  private async validateUser(userUuid: string) {
    const userExists = await this.usersService.checkUserExists(userUuid);
    if (!userExists) {
      throw new NotFoundException(
        `해당 UUID : ${userUuid} 를 가진 사용자는 없습니다.`,
      );
    }
  }

  private async convertToResponseDto(
    schedule: Schedule,
  ): Promise<ResponseScheduleDto> {
    const groupSchedules = await this.groupScheduleRepository.find({
      where: { schedule: { scheduleId: schedule.scheduleId } },
      relations: ['group', 'user'],
    });

    const groupInfo = await Promise.all(
      groupSchedules.map(async (groupSchedule) => {
        const user = groupSchedule.user;
        return {
          groupId: groupSchedule.group.groupId,
          groupName: groupSchedule.group.groupName,
          users: [
            {
              userUuid: user.userUuid,
              name: user.name,
              email: user.email,
              phoneNumber: user.phoneNumber,
              profileImage: user.profileImage,
            },
          ],
        };
      }),
    );

    return new ResponseScheduleDto({
      scheduleId: schedule.scheduleId,
      userUuid: schedule.userUuid,
      category: schedule.category,
      title: schedule.title || '',
      place: schedule.place || '',
      memo: schedule.memo || '',
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      isAllDay: schedule.isAllDay,
      isRecurring: schedule.isRecurring,
      repeatType: schedule.repeatType,
      repeatEndDate: schedule.repeatEndDate,
      recurringInterval: schedule.recurringInterval,
      recurringDaysOfWeek: schedule.recurringDaysOfWeek,
      recurringDayOfMonth: schedule.recurringDayOfMonth,
      recurringMonthOfYear: schedule.recurringMonthOfYear,
      groupInfo: groupInfo.length > 0 ? groupInfo : undefined,
    });
  }

  // GPT 관련 메서드

  /**
   * GPT 응답을 파싱합니다.
   */
  parseGptResponse(response: string): any[] {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing GPT response:', error);
      throw new Error('Failed to parse GPT response');
    }
  }

  /**
   * 전사 데이터를 OpenAI GPT 모델에 넘겨서 처리합니다.
   */
  private async processWithGpt(
    transcriptionResult: any,
    currentDateTime: string,
    userUuid: string,
  ): Promise<CreateScheduleDto[]> {
    const formattedDate = await this.formatDateToYYYYMMDDHHMMSS(
      new Date(currentDateTime),
    );

    const gptResponse = await this.openai.chat.completions.create({
      model: this.configService.get<string>('OPENAI_FINETUNING_MODEL'),
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant that extracts startDate, endDate, category, intent, and place information from conversations. 카테고리[병원, 복약, 가족, 종교, 운동, 경조사, 기타]',
        },
        {
          role: 'user',
          content: `{Today : ${formattedDate}, conversations : ${transcriptionResult}}`,
        },
      ],
    });

    const gptResponseContent = gptResponse.choices[0].message.content;
    return this.convertGptResponseToCreateDto(
      this.parseGptResponse(gptResponseContent),
      userUuid,
    );
  }

  /**
   * OCR 결과를 OpenAI GPT 모델에 넘겨서 처리합니다.
   */
  async processWithGptOCR(OCRResult: string): Promise<any> {
    const gptResponse = await this.openai.chat.completions.create({
      model: this.configService.get<string>('OPENAI_FINETUNING_MODEL_OCR'),
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant that extracts intent, tablets, times, and days information from conversations.',
        },
        {
          role: 'user',
          content: `${OCRResult}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0,
    });

    const gptResponseContent = gptResponse.choices[0].message.content;
    return this.parseGptResponse(gptResponseContent);
  }

  /**
   * 날짜를 YYYY-MM-DD HH:mm:ss 형식으로 변환합니다.
   */
  private async formatDateToYYYYMMDDHHMMSS(date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * GPT 응답을 CreateScheduleDto로 변환합니다.
   */
  private async convertGptResponseToCreateDto(
    gptEvents: any[],
    userUuid: string,
  ): Promise<VoiceScheduleResponseDto[]> {
    const allCategories = await this.categoryRepository.find();

    const categoryMap = allCategories.reduce((acc, category) => {
      acc[category.categoryName] = category;
      return acc;
    }, {});

    return gptEvents.map((event) => {
      const dto = new VoiceScheduleResponseDto();
      dto.startDate = new Date(event.startDate);
      dto.endDate = new Date(event.endDate);
      dto.title = event.intent;
      dto.place = event.place || '';
      dto.isAllDay = event.isAllDay;
      dto.category = categoryMap[event.category] || categoryMap['기타'];
      return dto;
    });
  }

  /**
   * RTZR을 사용하여 음성을 전사하고 GPT로 처리합니다.
   */
  async transcribeRTZRAndFetchResultWithGpt(
    file: Express.Multer.File,
    currentDateTime: string,
    userUuid: string,
  ) {
    await this.validateUser(userUuid);
    const transcribe =
      await this.voiceTranscriptionService.RTZRTranscribeResult(file);
    return this.processWithGpt(transcribe, currentDateTime, userUuid);
  }

  /**
   * Whisper를 사용하여 음성을 전사하고 GPT로 처리합니다.
   */
  async transcribeWhisperAndFetchResultWithGpt(
    file: Express.Multer.File,
    currentDateTime: string,
    userUuid: string,
  ) {
    await this.validateUser(userUuid);
    const transcribe =
      await this.voiceTranscriptionService.whisperTranscribeResult(file);
    return this.processWithGpt(transcribe, currentDateTime, userUuid);
  }
}
