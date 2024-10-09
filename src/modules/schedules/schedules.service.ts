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
import { Between, LessThanOrEqual, Not, Repository } from 'typeorm';
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
    @InjectRepository(ScheduleInstance)
    private scheduleInstanceRepository: Repository<ScheduleInstance>,
  ) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
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

  // 일정 생성
  async create(
    createScheduleDto: CreateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    const categoryId = createScheduleDto.categoryId ?? 7;
    const category = await this.getCategoryById(categoryId);

    if (createScheduleDto.isAllDay) {
      this.adjustDateForAllDay(
        createScheduleDto.startDate,
        createScheduleDto.endDate,
      );
    }

    const newSchedule = this.schedulesRepository.create({
      ...createScheduleDto,
      category: category, // Category 객체 할당합니다.
    });

    const savedSchedule = await this.schedulesRepository.save(newSchedule);

    let instances: ScheduleInstance[] = [];
    if (savedSchedule.repeatType !== 'none') {
      await this.createScheduleInstances(savedSchedule);
    }

    return new ResponseScheduleDto(savedSchedule, category, instances);
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

      await this.scheduleInstanceRepository.save({
        schedule,
        instanceStartDate: new Date(currentDate),
        instanceEndDate: instanceEndDate,
      });

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

    // 업데이트할 필드만 병합
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
        `해당 id : ${id}를 가진 스케쥴을 찾을 수 없습니다. `,
      );
    }
    return new ResponseScheduleDto(schedule, schedule.category);
  }

  async findAllByUserId(userId: number): Promise<ResponseScheduleDto[]> {
    // 일반 일정 조회
    const regularSchedules = await this.schedulesRepository.find({
      where: { userId: userId, repeatType: 'none' },
      relations: ['category'],
      order: { startDate: 'ASC' },
    });

    // 반복 일정 조회
    const repeatingSchedules = await this.schedulesRepository.find({
      where: { userId: userId, repeatType: Not('none') },
      relations: ['category'],
    });

    // 현재 날짜로부터 1년 후까지의 반복 일정 인스턴스 조회
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const instances = await this.scheduleInstanceRepository.find({
      where: {
        schedule: { userId: userId },
        instanceStartDate: Between(startDate, endDate),
      },
      relations: ['schedule', 'schedule.category'],
    });

    // 반복 일정 인스턴스를 Schedule 형태로 변환
    const convertedInstances = instances.map((instance) => ({
      ...instance.schedule,
      startDate: instance.instanceStartDate,
      endDate: instance.instanceEndDate,
    }));

    // 모든 일정을 합치고 날짜순으로 정렬
    const allSchedules = [...regularSchedules, ...convertedInstances];
    allSchedules.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // ResponseScheduleDto 형식으로 변환하여 반환
    return allSchedules.map(
      (schedule) => new ResponseScheduleDto(schedule, schedule.category),
    );
  }

  // 날짜 범위로 일정 조회
  async findByDateRange(
    dateRange: DateRangeDto,
  ): Promise<ResponseScheduleDto[]> {
    if (dateRange.startDate > dateRange.endDate) {
      throw new BadRequestException(
        '시작 날짜는 종료 날짜보다 늦을 수 없습니다.',
      );
    }

    const [regularSchedules, repeatingSchedules] = await Promise.all([
      this.schedulesRepository.find({
        where: {
          userId: dateRange.userId,
          startDate: Between(dateRange.startDate, dateRange.endDate),
          repeatType: 'none',
        },
        relations: ['category'],
        order: { startDate: 'ASC' },
      }),
      this.schedulesRepository.find({
        where: {
          userId: dateRange.userId,
          startDate: LessThanOrEqual(dateRange.endDate),
          repeatType: Not('none'),
        },
        relations: ['category'],
      }),
    ]);

    const instances = await this.scheduleInstanceRepository.find({
      where: {
        schedule: { userId: dateRange.userId },
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
    console.log('findByMonth 호출 형식 :', monthQuery);

    const startDate = new Date(monthQuery.year, monthQuery.month - 1, 1);
    const endDate = new Date(monthQuery.year, monthQuery.month, 0);

    console.log('Date range:', { startDate, endDate });

    const schedules = await this.schedulesRepository.find({
      where: {
        userId: monthQuery.userId,
        startDate: Between(startDate, endDate),
      },
      relations: ['category'],

      order: { startDate: 'ASC' },
    });

    console.log('Schedules found:', schedules.length);

    const dtos = await Promise.all(
      schedules.map(async (schedule) => {
        return new ResponseScheduleDto(schedule, schedule.category);
      }),
    );

    return dtos;
  }

  async findByWeek(weekQuery: WeekQueryDto): Promise<ResponseScheduleDto[]> {
    console.log('findByWeek called with:', weekQuery);

    const date = new Date(weekQuery.date);
    date.setUTCHours(0, 0, 0, 0); // UTC 시간으로 설정
    const day = date.getDay();
    const diff = date.getDate() - day; // 일요일을 기준으로 주의 시작일 계산

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

    console.log('Date range:', { startDate, endDate });

    const schedules = await this.schedulesRepository.find({
      where: {
        userId: weekQuery.userId,
        startDate: Between(startDate, endDate),
      },
      relations: ['category'],
      order: { startDate: 'ASC' },
    });

    console.log('Schedules found:', schedules.length);

    const dtos = await Promise.all(
      schedules.map(async (schedule) => {
        return new ResponseScheduleDto(schedule, schedule.category);
      }),
    );

    return dtos;
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
  ): Promise<CreateScheduleDto[]> {
    const openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    const formattedDate = this.formatDateToYYYYMMDDHHMMSS(
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
      max_tokens: 1000, // 필요한 토큰 수 설정
      temperature: 0,
    });

    const gptResponseContent = gptResponse.choices[0].message.content;
    return this.parseGptResponse(gptResponseContent);
  }

  // 날짜를 YYYY-MM-DD HH:mm:ss 형식으로 변환하는 함수
  private async formatDateToYYYYMMDDHHMMSS(date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    // console.log(
    //   `date지렁 : ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
    // );
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  private async convertGptResponseToCreateDto(
    gptEvents: any[],
  ): Promise<VoiceScheduleResponseDto[]> {
    // 모든 카테고리를 한 번에 조회
    const allCategories = await this.categoryRepository.find();

    // 카테고리 이름을 키로, 카테고리 객체를 값으로 하는 맵 생성
    const categoryMap = allCategories.reduce((acc, category) => {
      acc[category.categoryName] = category;
      return acc;
    }, {});

    return Promise.all(
      gptEvents.map(async (event) => {
        const dto = new VoiceScheduleResponseDto();
        dto.userId = 1; // 임시 사용자 ID
        dto.startDate = new Date(event.startDate);
        dto.endDate = new Date(event.endDate);
        dto.title = event.intent;
        dto.place = event.place || '';
        dto.isAllDay = event.isAllDay;

        // 카테고리 매핑
        const category = categoryMap[event.category] || categoryMap['기타'];
        dto.category = category; // 전체 카테고리 객체 설정
        return dto;
      }),
    );
  }
  async transcribeRTZRAndFetchResultWithGpt(
    file: Express.Multer.File,
    currentDateTime: string,
  ) {
    const transcribe =
      await this.voiceTranscriptionService.RTZRTranscribeResult(file);
    const result = await this.processWithGpt(transcribe, currentDateTime);
    return result;
  }

  async transcribeWhisperAndFetchResultWithGpt(
    file: Express.Multer.File,
    currentDateTime: string,
  ) {
    const transcribe =
      await this.voiceTranscriptionService.whisperTranscribeResult(file);
    const result = await this.processWithGpt(transcribe, currentDateTime);
    return result;
  }
}
