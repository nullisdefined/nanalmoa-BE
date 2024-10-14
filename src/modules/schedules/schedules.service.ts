import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { ScheduleInstance } from '@/entities/schedule-instance.entity';
import { Category } from '@/entities/category.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ResponseScheduleDto } from './dto/response-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';
import { VoiceScheduleResponseDto } from './dto/voice-schedule-upload.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { VoiceTranscriptionService } from './voice-transcription.service';
import { OCRTranscriptionService } from './OCR-transcription.service';
import { UsersService } from '../users/users.service';
import OpenAI from 'openai';

@Injectable()
export class SchedulesService {
  private openai: OpenAI;
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(ScheduleInstance)
    private scheduleInstanceRepository: Repository<ScheduleInstance>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly voiceTranscriptionService: VoiceTranscriptionService,
    private readonly ocrTranscriptionService: OCRTranscriptionService,
    private readonly usersService: UsersService,
  ) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  // 일정 조회 관련 메서드

  /**
   * 사용자의 모든 일정을 조회합니다.
   */
  async findAllByUserUuid(userUuid: string): Promise<ResponseScheduleDto[]> {
    const currentDate = new Date();
    const pastDate = new Date(currentDate);
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    const futureDate = new Date(currentDate);
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const schedules = await this.schedulesRepository.find({
      where: { userUuid },
      relations: ['category', 'instances'],
    });

    const expandedSchedules = schedules.flatMap((schedule) =>
      this.expandSchedule(schedule, pastDate, futureDate),
    );

    return expandedSchedules.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );
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

    const allSchedules = [...regularSchedules, ...expandedRecurringSchedules];
    allSchedules.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return allSchedules.map((schedule) => this.convertToResponseDto(schedule));
  }

  /**
   * 월별 일정을 조회합니다.
   */
  async findByMonth(
    userUuid: string,
    monthQuery: MonthQueryDto,
  ): Promise<ResponseScheduleDto[]> {
    await this.validateUser(userUuid);
    const startDate = new Date(
      Date.UTC(monthQuery.year, monthQuery.month - 1, 1),
    );
    const endDate = new Date(
      Date.UTC(monthQuery.year, monthQuery.month, 0, 23, 59, 59, 999),
    );
    return this.getSchedulesInRange(userUuid, startDate, endDate);
  }

  /**
   * 주별 일정을 조회합니다.
   */
  async findByWeek(
    userUuid: string,
    weekQuery: WeekQueryDto,
  ): Promise<ResponseScheduleDto[]> {
    await this.validateUser(userUuid);
    const date = new Date(weekQuery.date);
    date.setUTCHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 월요일부터 시작하도록 조정
    const startDate = new Date(date.setDate(diff));
    const endDate = new Date(date.setDate(diff + 6));
    endDate.setUTCHours(23, 59, 59, 999);
    return this.getSchedulesInRange(userUuid, startDate, endDate);
  }

  /**
   * 일별 일정을 조회합니다.
   */
  async findByDate(
    userUuid: string,
    dateQuery: WeekQueryDto,
  ): Promise<ResponseScheduleDto[]> {
    await this.validateUser(userUuid);
    const startOfDay = new Date(dateQuery.date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateQuery.date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    return this.getSchedulesInRange(userUuid, startOfDay, endOfDay);
  }

  /**
   * 특정 일정을 ID로 조회합니다.
   */
  async findOne(id: number): Promise<ResponseScheduleDto> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId: id },
      relations: ['category', 'instances'],
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

    if (createScheduleDto.isRecurring && !createScheduleDto.repeatEndDate) {
      throw new BadRequestException(
        '반복 일정은 반드시 종료일(repeatEndDate)을 지정해야 합니다.',
      );
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

    if (savedSchedule.isRecurring) {
      await this.createScheduleInstances(savedSchedule);
    }

    return this.convertToResponseDto(savedSchedule);
  }

  /**
   * 기존 일정을 수정합니다.
   */
  async updateSchedule(
    userUuid: string,
    scheduleId: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId, userUuid },
      relations: ['category', 'instances'],
    });

    if (!schedule) {
      throw new NotFoundException(
        `해당 ID : ${scheduleId}를 가진 일정을 찾을 수 없습니다.`,
      );
    }

    // 카테고리 업데이트
    if (updateScheduleDto.categoryId) {
      schedule.category = await this.getCategoryById(
        updateScheduleDto.categoryId,
      );
    }

    // 기본 필드 업데이트
    Object.assign(schedule, updateScheduleDto);

    // 반복 일정 처리
    if (
      updateScheduleDto.repeatType !== 'none' ||
      updateScheduleDto.repeatEndDate
    ) {
      await this.updateScheduleInstances(schedule);
    }

    const updatedSchedule = await this.schedulesRepository.save(schedule);
    return this.convertToResponseDto(updatedSchedule);
  }

  /**
   * 일정을 삭제합니다.
   */
  async deleteSchedule(
    userUuid: string,
    scheduleId: number,
    instanceDate: string,
    deleteFuture: boolean = false,
  ): Promise<void> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId, userUuid },
      relations: ['instances'],
    });

    if (!schedule) {
      throw new NotFoundException(
        `ID가 ${scheduleId}인 일정을 찾을 수 없습니다.`,
      );
    }
    const targetDate = new Date(instanceDate);

    if (schedule.isRecurring) {
      if (deleteFuture) {
        // 해당 일정 포함 이후 모두 삭제
        await this.scheduleInstanceRepository.delete({
          schedule: { scheduleId: schedule.scheduleId },
          instanceStartDate: MoreThanOrEqual(targetDate),
        });

        // 원본 일정의 종료일 수정
        schedule.repeatEndDate = new Date(targetDate);
        schedule.repeatEndDate.setDate(schedule.repeatEndDate.getDate() - 1);
        await this.schedulesRepository.save(schedule);
      } else {
        // 특정 일정만 삭제 (예외 처리)
        const instance = await this.scheduleInstanceRepository.findOne({
          where: {
            schedule: { scheduleId: schedule.scheduleId },
            instanceStartDate: targetDate,
          },
        });

        if (instance) {
          instance.isException = true;
          await this.scheduleInstanceRepository.save(instance);
        } else {
          // 존재하지 않는 인스턴스라면 새로 생성하고 예외로 표시
          const newException = this.scheduleInstanceRepository.create({
            schedule: schedule,
            instanceStartDate: targetDate,
            instanceEndDate: new Date(
              targetDate.getTime() +
                (schedule.endDate.getTime() - schedule.startDate.getTime()),
            ),
            isException: true,
          });
          await this.scheduleInstanceRepository.save(newException);
        }
      }
    } else {
      // 반복되지 않는 일정 삭제
      await this.schedulesRepository.remove(schedule);
    }
  }

  private createNewScheduleFromDate(
    originalSchedule: Schedule,
    startFromDate: Date,
  ): Schedule {
    const newSchedule = new Schedule();
    Object.assign(newSchedule, originalSchedule);
    newSchedule.scheduleId = undefined; // 새로운 ID 할당을 위해

    // 반복 유형에 따라 새 시작 날짜 설정
    switch (originalSchedule.repeatType) {
      case 'daily':
        newSchedule.startDate = new Date(startFromDate);
        newSchedule.startDate.setDate(newSchedule.startDate.getDate() + 1);
        break;
      case 'weekly':
        newSchedule.startDate = this.adjustStartDateForWeekly(
          originalSchedule,
          startFromDate,
        );
        break;
      case 'monthly':
        newSchedule.startDate = this.adjustStartDateForMonthly(
          originalSchedule,
          startFromDate,
        );
        break;
      case 'yearly':
        newSchedule.startDate = this.adjustStartDateForYearly(
          originalSchedule,
          startFromDate,
        );
        break;
      default:
        throw new BadRequestException(
          `Invalid repeat type: ${originalSchedule.repeatType}`,
        );
    }

    // 종료 날짜 조정
    const duration =
      originalSchedule.endDate.getTime() - originalSchedule.startDate.getTime();
    newSchedule.endDate = new Date(newSchedule.startDate.getTime() + duration);

    return newSchedule;
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

  private expandSchedule(
    schedule: Schedule,
    startDate: Date,
    endDate: Date,
  ): ResponseScheduleDto[] {
    if (!schedule.isRecurring) {
      return [this.convertToResponseDto(schedule)];
    }

    if (schedule.instances && schedule.instances.length > 0) {
      return schedule.instances
        .filter(
          (instance) =>
            instance.instanceStartDate >= startDate &&
            instance.instanceStartDate <= endDate,
        )
        .map((instance) => this.convertToResponseDto(schedule, [instance]));
    }

    const expandedInstances = this.generateRecurringInstances(
      schedule,
      startDate,
      endDate,
    );
    return expandedInstances.map((instance) =>
      this.convertToResponseDto(schedule, [instance]),
    );
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

      let currentDate = new Date(
        Math.max(schedule.startDate.getTime(), startDate.getTime()),
      );
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

  private generateRecurringInstances(
    schedule: Schedule,
    startDate: Date,
    endDate: Date,
  ): ScheduleInstance[] {
    const instances: ScheduleInstance[] = [];
    let currentDate = new Date(
      Math.max(schedule.startDate.getTime(), startDate.getTime()),
    );

    while (currentDate <= endDate) {
      if (this.isOccurrenceDate(schedule, currentDate)) {
        const instanceEndDate = new Date(
          currentDate.getTime() +
            (schedule.endDate.getTime() - schedule.startDate.getTime()),
        );
        instances.push({
          schedule,
          instanceStartDate: new Date(currentDate),
          instanceEndDate,
          isException: false,
        } as ScheduleInstance);
      }
      currentDate = this.getNextOccurrenceDate(schedule, currentDate);
    }

    return instances;
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
        nextDate.setDate(nextDate.getDate() + 7 * interval);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
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

  private async createScheduleInstances(
    schedule: Schedule,
  ): Promise<ScheduleInstance[]> {
    if (!schedule.isRecurring || !schedule.repeatEndDate) {
      throw new Error(
        '반복 일정만 인스턴스를 생성할 수 있으며, 종료일이 필요합니다.',
      );
    }

    const instances: ScheduleInstance[] = [];
    let currentDate = new Date(schedule.startDate);

    while (currentDate <= schedule.repeatEndDate) {
      if (this.isOccurrenceDate(schedule, currentDate)) {
        const instanceEndDate = new Date(
          currentDate.getTime() +
            (schedule.endDate.getTime() - schedule.startDate.getTime()),
        );
        const instance = this.scheduleInstanceRepository.create({
          schedule,
          instanceStartDate: new Date(currentDate),
          instanceEndDate,
        });
        instances.push(await this.scheduleInstanceRepository.save(instance));
      }
      currentDate = this.getNextOccurrenceDate(schedule, currentDate);
    }

    return instances;
  }

  private async updateScheduleInstances(schedule: Schedule): Promise<void> {
    await this.scheduleInstanceRepository.delete({
      schedule: { scheduleId: schedule.scheduleId },
    });
    if (schedule.repeatType !== 'none') {
      await this.createScheduleInstances(schedule);
    }
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

  private convertToResponseDto(
    schedule: Schedule,
    instances?: ScheduleInstance[],
  ): ResponseScheduleDto {
    const instance = instances && instances.length > 0 ? instances[0] : null;
    return {
      scheduleId: schedule.scheduleId,
      userUuid: schedule.userUuid,
      category: schedule.category,
      title: schedule.title || '',
      place: schedule.place || '',
      memo: schedule.memo || '',
      startDate: instance ? instance.instanceStartDate : schedule.startDate,
      endDate: instance ? instance.instanceEndDate : schedule.endDate,
      isAllDay: schedule.isAllDay,
      isRecurring: schedule.isRecurring,
      repeatType: schedule.repeatType,
      repeatEndDate: schedule.repeatEndDate,
      recurringInterval: schedule.recurringInterval,
      recurringDaysOfWeek: schedule.recurringDaysOfWeek,
      recurringDayOfMonth: schedule.recurringDayOfMonth,
      recurringMonthOfYear: schedule.recurringMonthOfYear,
      isException: instance ? instance.isException : false,
    };
  }

  private adjustStartDateForWeekly(
    schedule: Schedule,
    startFromDate: Date,
  ): Date {
    const adjustedDate = new Date(startFromDate);
    adjustedDate.setDate(adjustedDate.getDate() + 1); // 다음 날부터 시작
    const daysOfWeek = schedule.recurringDaysOfWeek;

    while (!daysOfWeek.includes(adjustedDate.getDay())) {
      adjustedDate.setDate(adjustedDate.getDate() + 1);
    }

    return adjustedDate;
  }

  private adjustStartDateForMonthly(
    schedule: Schedule,
    startFromDate: Date,
  ): Date {
    const adjustedDate = new Date(startFromDate);
    adjustedDate.setMonth(adjustedDate.getMonth() + 1); // 다음 달로 이동
    adjustedDate.setDate(schedule.recurringDayOfMonth); // 원래 일정의 날짜로 설정

    // 만약 해당 월에 그 날짜가 없다면 (예: 31일이 없는 달), 해당 월의 마지막 날로 설정
    if (adjustedDate.getMonth() > startFromDate.getMonth() + 1) {
      adjustedDate.setDate(0);
    }

    return adjustedDate;
  }

  private adjustStartDateForYearly(
    schedule: Schedule,
    startFromDate: Date,
  ): Date {
    const adjustedDate = new Date(startFromDate);
    adjustedDate.setFullYear(adjustedDate.getFullYear() + 1); // 다음 해로 이동
    adjustedDate.setMonth(schedule.recurringMonthOfYear - 1); // 원래 일정의 월로 설정 (0-based index)
    adjustedDate.setDate(schedule.recurringDayOfMonth); // 원래 일정의 날짜로 설정

    return adjustedDate;
  }

  // GPT 관련 메서드

  /**
   * GPT 응답을 파싱합니다.
   */
  private parseGptResponse(response: string): any[] {
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
