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
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
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
    return new ResponseScheduleDto(savedSchedule, category);
  }

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
      throw new NotFoundException(`Schedule with id ${id} not found`);
    }

    if (updateScheduleDto.categoryId) {
      schedule.category = await this.getCategoryById(
        updateScheduleDto.categoryId,
      );
    }

    Object.assign(schedule, updateScheduleDto);

    const savedSchedule = await this.schedulesRepository.save(schedule);
    return new ResponseScheduleDto(savedSchedule, schedule.category);
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

  async findAllByUserUuid(userUuid: string): Promise<ResponseScheduleDto[]> {
    await this.validateUser(userUuid);

    const schedules = await this.schedulesRepository.find({
      where: { user: { userUuid } },
      order: { startDate: 'ASC' },
      relations: ['category', 'user'],
    });
    return schedules.map(
      (schedule) => new ResponseScheduleDto(schedule, schedule.category),
    );
  }

  async findByDateRange(
    dateRange: DateRangeDto,
  ): Promise<ResponseScheduleDto[]> {
    await this.validateUser(dateRange.userUuid);

    if (dateRange.startDate > dateRange.endDate) {
      throw new BadRequestException(
        '시작 날짜는 종료 날짜보다 늦게 설정할 수 없습니다.',
      );
    }

    // 새로운 메서드를 사용하여 일정 조회
    const schedules = await this.findSchedulesBetweenDates(
      dateRange.userUuid,
      dateRange.startDate,
      dateRange.endDate,
    );

    return schedules.map(
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
    userUuid: string, // userUuid 파라미터 추가
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
      userUuid, // userUuid 전달
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
    userUuid: string, // userUuid를 파라미터로 받음
  ): Promise<VoiceScheduleResponseDto[]> {
    const allCategories = await this.categoryRepository.find();

    const categoryMap = allCategories.reduce((acc, category) => {
      acc[category.categoryName] = category;
      return acc;
    }, {});

    return gptEvents.map((event) => {
      const dto = new VoiceScheduleResponseDto();
      dto.userUuid = userUuid; // 전달받은 userUuid 사용
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
