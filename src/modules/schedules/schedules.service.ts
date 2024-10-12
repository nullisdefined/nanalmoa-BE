import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from '../../entities/schedule.entity';
import {
  Between,
  Not,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { ResponseScheduleDto } from './dto/response-schedule.dto';
import { DateRangeDto } from './dto/data-range-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Category } from '@/entities/category.entity';
import { VoiceScheduleResponseDto } from './dto/voice-schedule-upload.dto';
import { VoiceTranscriptionService } from './voice-transcription.service';
import { OCRTranscriptionService } from './OCR-transcription.service';
import { UsersService } from '../users/users.service';
import { ScheduleInstance } from '@/entities/schedule-instance.entity';

@Injectable()
export class SchedulesService {
  private openai: OpenAI;
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly voiceTranscriptionService: VoiceTranscriptionService,
    private readonly ocrTranscriptionService: OCRTranscriptionService,
    private readonly usersService: UsersService,
    @InjectRepository(ScheduleInstance)
    private scheduleInstanceRepository: Repository<ScheduleInstance>,
  ) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  private async findSchedulesBetweenDates(
    userUuid: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Schedule[]> {
    return this.schedulesRepository.find({
      where: [
        // 시작일 또는 종료일이 조회 범위 내에 있는 경우
        {
          user: { userUuid },
          startDate: LessThanOrEqual(endDate),
          endDate: MoreThanOrEqual(startDate),
        },
      ],
      relations: ['category', 'user'],
      order: { startDate: 'ASC' },
    });
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

  // 일정 생성
  async create(
    createScheduleDto: CreateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    await this.validateUser(createScheduleDto.userUuid);

    const categoryId = createScheduleDto.categoryId ?? 7;
    const category = await this.getCategoryById(categoryId);

    if (createScheduleDto.isAllDay) {
      [createScheduleDto.startDate, createScheduleDto.endDate] =
        this.adjustDateForAllDay(
          createScheduleDto.startDate,
          createScheduleDto.endDate,
        );
    }

    const newSchedule = this.schedulesRepository.create({
      ...createScheduleDto,
      category: category,
    });

    const savedSchedule = await this.schedulesRepository.save(newSchedule);

    let instances: ScheduleInstance[] = [];
    if (savedSchedule.repeatType !== 'none') {
      instances = await this.createScheduleInstances(savedSchedule);
    }

    return new ResponseScheduleDto(savedSchedule, category, instances);
  }

  async createRecurringSchedule(
    createDto: CreateScheduleDto,
  ): Promise<Schedule> {
    const schedule = this.schedulesRepository.create({
      ...createDto,
      isRecurring: true,
    });
    return this.schedulesRepository.save(schedule);
  }

  async updateRecurringSchedule(
    scheduleId: number,
    updateDto: UpdateScheduleDto,
    updateFuture: boolean,
  ): Promise<Schedule> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId },
      relations: ['instances'],
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (updateFuture) {
      // 현재 일정부터 새로운 반복 패턴 생성
      const newSchedule = this.schedulesRepository.create({
        ...schedule,
        ...updateDto,
        scheduleId: undefined,
        instances: [],
      });
      await this.schedulesRepository.save(newSchedule);

      // 기존 일정의 반복 종료일 설정
      schedule.repeatEndDate = new Date(updateDto.startDate);
      schedule.repeatEndDate.setDate(schedule.repeatEndDate.getDate() - 1);
      await this.schedulesRepository.save(schedule);

      return newSchedule;
    } else {
      // 현재 일정만 예외로 처리
      const instance = this.scheduleInstanceRepository.create({
        schedule,
        instanceStartDate: updateDto.startDate,
        instanceEndDate: updateDto.endDate,
        isException: true,
        exceptionTitle: updateDto.title,
        exceptionPlace: updateDto.place,
        exceptionIsAllDay: updateDto.isAllDay,
        exceptionMemo: updateDto.memo,
      });
      await this.scheduleInstanceRepository.save(instance);
      return schedule;
    }
  }

  private expandRecurringSchedules(
    recurringSchedules: Schedule[],
    startDate: Date,
    endDate: Date,
  ): Schedule[] {
    const expandedSchedules: Schedule[] = [];

    for (const schedule of recurringSchedules) {
      let currentDate = new Date(
        Math.max(schedule.startDate.getTime(), startDate.getTime()),
      );
      const scheduleEndDate = schedule.repeatEndDate || endDate;

      while (currentDate <= scheduleEndDate && currentDate <= endDate) {
        if (this.isEventOccurring(schedule, currentDate)) {
          const instance = schedule.instances.find(
            (i) =>
              i.instanceStartDate.getTime() === currentDate.getTime() &&
              i.isException,
          );

          if (instance) {
            expandedSchedules.push({
              ...schedule,
              scheduleId: undefined,
              startDate: instance.instanceStartDate,
              endDate: instance.instanceEndDate,
              title: instance.exceptionTitle || schedule.title,
              place: instance.exceptionPlace || schedule.place,
              isAllDay: instance.exceptionIsAllDay ?? schedule.isAllDay,
              memo: instance.exceptionMemo || schedule.memo,
            });
          } else {
            expandedSchedules.push({
              ...schedule,
              scheduleId: undefined,
              startDate: new Date(currentDate),
              endDate: new Date(
                currentDate.getTime() +
                  (schedule.endDate.getTime() - schedule.startDate.getTime()),
              ),
            });
          }
        }

        currentDate = this.getNextOccurrence(schedule, currentDate);
      }
    }

    return expandedSchedules;
  }

  private isEventOccurring(schedule: Schedule, date: Date): boolean {
    switch (schedule.repeatType) {
      case 'daily':
        return true;
      case 'weekly':
        return schedule.recurringDaysOfWeek.includes(date.getDay());
      case 'monthly':
        return date.getDate() === schedule.recurringDayOfMonth;
      default:
        return false;
    }
  }

  private getNextOccurrence(schedule: Schedule, currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    switch (schedule.repeatType) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + schedule.recurringInterval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7 * schedule.recurringInterval);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + schedule.recurringInterval);
        break;
    }
    return nextDate;
  }

  async removeRecurring(id: number, deleteFuture: boolean): Promise<void> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId: id },
      relations: ['instances'],
    });

    if (!schedule) {
      throw new NotFoundException(`ID가 ${id}인 일정을 찾을 수 없습니다`);
    }

    if (!schedule.isRecurring) {
      throw new BadRequestException(`ID가 ${id}인 일정은 반복 일정이 아닙니다`);
    }

    if (deleteFuture) {
      // 현재 일정부터 모든 미래 일정 삭제
      await this.schedulesRepository.delete({
        scheduleId: id,
        startDate: MoreThanOrEqual(schedule.startDate),
      });
    } else {
      // 현재 일정만 삭제하고 예외로 처리
      await this.scheduleInstanceRepository.save({
        schedule: schedule,
        instanceStartDate: schedule.startDate,
        instanceEndDate: schedule.endDate,
        isException: true,
      });
    }
  }

  convertToResponseDto(
    schedule: Schedule,
    category: Category,
    instances?: ScheduleInstance[],
  ): ResponseScheduleDto {
    return new ResponseScheduleDto(schedule, category, instances);
  }

  // 반복 일정 인스턴스 생성
  private async createScheduleInstances(
    schedule: Schedule,
  ): Promise<ScheduleInstance[]> {
    const instances: ScheduleInstance[] = [];
    let currentDate = new Date(schedule.startDate);
    const endDate =
      schedule.repeatEndDate ||
      new Date(
        currentDate.getFullYear() + 1,
        currentDate.getMonth(),
        currentDate.getDate(),
      );

    while (currentDate <= endDate) {
      const instanceEndDate = new Date(
        currentDate.getTime() +
          (schedule.endDate.getTime() - schedule.startDate.getTime()),
      );

      const instance = await this.scheduleInstanceRepository.save({
        schedule,
        instanceStartDate: new Date(currentDate),
        instanceEndDate: instanceEndDate,
      });

      instances.push(instance);

      switch (schedule.repeatType) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }
    return instances;
  }

  // 일정 수정
  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    if (updateScheduleDto.userUuid) {
      await this.validateUser(updateScheduleDto.userUuid);
    }

    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId: id },
      relations: ['category'],
    });
    if (!schedule) {
      throw new NotFoundException(
        `해당 "${id}를 가진 일정을 찾을 수 없습니다." `,
      );
    }

    if (updateScheduleDto.categoryId) {
      schedule.category = await this.getCategoryById(
        updateScheduleDto.categoryId,
      );
    }

    Object.assign(schedule, updateScheduleDto);

    const updatedSchedule = await this.schedulesRepository.save(schedule);

    if (
      updateScheduleDto.repeatType !== 'none' ||
      updateScheduleDto.repeatEndDate
    ) {
      await this.updateScheduleInstances(updatedSchedule);
    }

    return new ResponseScheduleDto(updatedSchedule, schedule.category);
  }

  private async updateScheduleInstances(schedule: Schedule): Promise<void> {
    await this.scheduleInstanceRepository.delete({
      schedule: { scheduleId: schedule.scheduleId },
    });
    if (schedule.repeatType !== 'none') {
      await this.createScheduleInstances(schedule);
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.schedulesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `해당 "${id}를 가진 스케쥴을 찾을 수 없습니다." `,
      );
    }
  }

  async findOne(id: number): Promise<ResponseScheduleDto> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId: id },
      relations: ['category'],
    });
    if (!schedule) {
      throw new NotFoundException(
        `해당 id : ${id}를 가진 일정을 찾을 수 없습니다. `,
      );
    }
    return this.convertToResponseDto(schedule, schedule.category);
  }

  async findAllByUserUuid(userUuid: string): Promise<ResponseScheduleDto[]> {
    await this.validateUser(userUuid);

    const schedules = await this.schedulesRepository.find({
      where: { user: { userUuid } },
      order: { startDate: 'ASC' },
      relations: ['category', 'user'],
    });

    return schedules.map((schedule) =>
      this.convertToResponseDto(schedule, schedule.category),
    );
  }

  // async findAllByUserId(userId: number): Promise<ResponseScheduleDto[]> {
  //   // 일반 일정 조회
  //   const regularSchedules = await this.schedulesRepository.find({
  //     where: { userId: userId, repeatType: 'none' },
  //     relations: ['category'],
  //     order: { startDate: 'ASC' },
  //   });

  //   // 반복 일정 조회
  //   const repeatingSchedules = await this.schedulesRepository.find({
  //     where: { userId: userId, repeatType: Not('none') },
  //     relations: ['category'],
  //   });

  //   // 현재 날짜로부터 1년 후까지의 반복 일정 인스턴스 조회
  //   const startDate = new Date();
  //   const endDate = new Date();
  //   endDate.setFullYear(endDate.getFullYear() + 1);

  //   const instances = await this.scheduleInstanceRepository.find({
  //     where: {
  //       schedule: { userId: userId },
  //       instanceStartDate: Between(startDate, endDate),
  //     },
  //     relations: ['schedule', 'schedule.category'],
  //   });

  //   // 반복 일정 인스턴스를 Schedule 형태로 변환
  //   const convertedInstances = instances.map((instance) => ({
  //     ...instance.schedule,
  //     startDate: instance.instanceStartDate,
  //     endDate: instance.instanceEndDate,
  //   }));

  //   // 모든 일정을 합치고 날짜순으로 정렬
  //   const allSchedules = [...regularSchedules, ...convertedInstances];
  //   allSchedules.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  //   // ResponseScheduleDto 형식으로 변환하여 반환
  //   return allSchedules.map(
  //     (schedule) => new ResponseScheduleDto(schedule, schedule.category),
  //   );
  // }

  // 날짜 범위로 일정 조회
  async findByDateRange(
    dateRange: DateRangeDto,
  ): Promise<ResponseScheduleDto[]> {
    await this.validateUser(dateRange.userUuid);

    if (dateRange.startDate > dateRange.endDate) {
      throw new BadRequestException(
        '시작 날짜는 종료 날짜보다 늦게 설정할 수 없습니다.',
      );
    }

    const [regularSchedules, repeatingSchedules] = await Promise.all([
      this.schedulesRepository.find({
        where: {
          user: { userUuid: dateRange.userUuid },
          startDate: Between(dateRange.startDate, dateRange.endDate),
          repeatType: 'none',
        },
        relations: ['category'],
        order: { startDate: 'ASC' },
      }),
      this.schedulesRepository.find({
        where: {
          user: { userUuid: dateRange.userUuid },
          startDate: LessThanOrEqual(dateRange.endDate),
          repeatType: Not('none'),
        },
        relations: ['category'],
      }),
    ]);

    const instances = await this.scheduleInstanceRepository.find({
      where: {
        schedule: { user: { userUuid: dateRange.userUuid } },
        instanceStartDate: Between(dateRange.startDate, dateRange.endDate),
      },
      relations: ['schedule', 'schedule.category'],
    });

    const convertedInstances = instances.map((instance) => ({
      ...instance.schedule,
      startDate: instance.instanceStartDate,
      endDate: instance.instanceEndDate,
    }));

    const allSchedules = [...regularSchedules, ...convertedInstances];
    allSchedules.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return allSchedules.map(
      (schedule) => new ResponseScheduleDto(schedule, schedule.category),
    );
  }

  async findByMonth(monthQuery: MonthQueryDto): Promise<ResponseScheduleDto[]> {
    await this.validateUser(monthQuery.userUuid);

    // 해당 월의 시작일
    const startDate = new Date(
      Date.UTC(monthQuery.year, monthQuery.month - 1, 1),
    );
    // 다음 달의 시작일 (해당 월의 마지막 날 23:59:59.999)
    const endDate = new Date(Date.UTC(monthQuery.year, monthQuery.month, 1));
    endDate.setUTCMilliseconds(-1);

    const schedules = await this.findSchedulesBetweenDates(
      monthQuery.userUuid,
      startDate,
      endDate,
    );

    return schedules.map(
      (schedule) => new ResponseScheduleDto(schedule, schedule.category),
    );
  }
  async findByWeek(weekQuery: WeekQueryDto): Promise<ResponseScheduleDto[]> {
    await this.validateUser(weekQuery.userUuid);

    const date = new Date(weekQuery.date);
    date.setUTCHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = date.getDate() - day;

    const startDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff),
    );
    const endDate = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        diff + 6,
        23,
        59,
        59,
        999,
      ),
    );

    const schedules = await this.findSchedulesBetweenDates(
      weekQuery.userUuid,
      startDate,
      endDate,
    );

    return schedules.map(
      (schedule) => new ResponseScheduleDto(schedule, schedule.category),
    );
  }

  async findByDate(dateQuery: WeekQueryDto): Promise<ResponseScheduleDto[]> {
    await this.validateUser(dateQuery.userUuid);

    const startOfDay = new Date(dateQuery.date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dateQuery.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const schedules = await this.findSchedulesBetweenDates(
      dateQuery.userUuid,
      startOfDay,
      endOfDay,
    );

    return schedules.map(
      (schedule) => new ResponseScheduleDto(schedule, schedule.category),
    );
  }

  // 반복 일정 인스턴스 조회 또는 생성
  private async getOrCreateInstances(
    repeatingSchedules: Schedule[],
    startDate: Date,
    endDate: Date,
  ): Promise<ScheduleInstance[]> {
    const instances: ScheduleInstance[] = [];

    for (const schedule of repeatingSchedules) {
      let currentDate = new Date(
        Math.max(schedule.startDate.getTime(), startDate.getTime()),
      );
      const scheduleEndDate = schedule.repeatEndDate || endDate;

      while (currentDate <= scheduleEndDate && currentDate <= endDate) {
        const instanceEndDate = new Date(
          currentDate.getTime() +
            (schedule.endDate.getTime() - schedule.startDate.getTime()),
        );

        let instance = await this.scheduleInstanceRepository.findOne({
          where: {
            schedule: { scheduleId: schedule.scheduleId },
            instanceStartDate: currentDate,
          },
        });

        if (!instance) {
          instance = this.scheduleInstanceRepository.create({
            schedule,
            instanceStartDate: currentDate,
            instanceEndDate,
            isException: false,
          });
          await this.scheduleInstanceRepository.save(instance);
        }

        instances.push(instance);

        switch (schedule.repeatType) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }
    }

    return instances;
  }

  private parseGptResponse(response: string): any[] {
    try {
      // GPT 응답을 JSON으로 파싱
      return JSON.parse(response);
    } catch (error) {
      console.error('Error parsing GPT response:', error);
      throw new Error('Failed to parse GPT response');
    }
  }

  // 전사 데이터를 OpenAI GPT 모델에 넘겨서 처리
  private async processWithGpt(
    transcriptionResult: any,
    currentDateTime: string,
    userUuid: string,
  ): Promise<CreateScheduleDto[]> {
    const openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    const formattedDate = await this.formatDateToYYYYMMDDHHMMSS(
      new Date(currentDateTime),
    );

    const gptResponse = await openai.chat.completions.create({
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

  // 전사 데이터를 OpenAI GPT 모델에 넘겨서 처리
  async processWithGptOCR(OCRResult: string): Promise<any> {
    const openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY_OCR'),
    });

    const gptResponse = await openai.chat.completions.create({
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

  // 날짜를 YYYY-MM-DD HH:mm:ss 형식으로 변환하는 함수
  private async formatDateToYYYYMMDDHHMMSS(date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

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
      dto.userUuid = userUuid;
      dto.startDate = new Date(event.startDate);
      dto.endDate = new Date(event.endDate);
      dto.title = event.intent;
      dto.place = event.place || '';
      dto.isAllDay = event.isAllDay;

      dto.category = categoryMap[event.category] || categoryMap['기타'];
      return dto;
    });
  }

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
