import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { Between, Repository } from 'typeorm';
import { ResponseScheduleDto } from './dto/response-schedule.dto';
import { DateRangeDto } from './dto/data-range-schedule.dto';
import { MonthQueryDto } from './dto/month-query-schedule.dto';
import { WeekQueryDto } from './dto/week-query-schedule.dto';
import { plainToInstance } from 'class-transformer';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import FormData from 'form-data';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Category } from '@/entities/category.entity';

@Injectable()
export class SchedulesService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  async create(
    createScheduleDto: CreateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    // 기본값을 넣어주는 용도 (일반 자바스크립트 객체를 클래스의 인스턴스로 변환, 클래스에 정의된 데코레이터와 기본값들이 적용)
    const scheduleData = plainToInstance(CreateScheduleDto, createScheduleDto);

    const newSchedule = this.schedulesRepository.create(scheduleData);
    const savedSchedule = await this.schedulesRepository.save(newSchedule);
    const category = await this.categoryRepository.findOne({
      where: { categoryId: savedSchedule.categoryId },
    });

    return new ResponseScheduleDto(savedSchedule, category);
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ResponseScheduleDto> {
    const schedule = await this.schedulesRepository.findOne({
      where: { scheduleId: id },
    });
    if (!schedule) {
      throw new NotFoundException(
        `해당 "${id}를 가진 스케쥴을 찾을 수 없습니다." `,
      );
    }

    // 업데이트할 필드만 병합
    Object.assign(schedule, updateScheduleDto);

    const savedSchedule = await this.schedulesRepository.save(schedule);
    const category = await this.categoryRepository.findOne({
      where: { categoryId: savedSchedule.categoryId },
    });

    return new ResponseScheduleDto(savedSchedule, category);
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
    });
    if (!schedule) {
      throw new NotFoundException(
        `해당 id : ${id}를 가진 스케쥴을 찾을 수 없습니다. `,
      );
    }
    const category = await this.categoryRepository.findOne({
      where: { categoryId: schedule.categoryId },
    });

    return new ResponseScheduleDto(schedule, category);
  }

  async findAllByUserId(userId: number): Promise<ResponseScheduleDto[]> {
    const schedules = await this.schedulesRepository.find({
      where: { userId: userId },
      order: { startDate: 'ASC' }, // 시작 날짜 기준 오름차순 정렬
    });
    const dtos = await Promise.all(
      schedules.map(async (schedule) => {
        const category = await this.categoryRepository.findOne({
          where: { categoryId: schedule.categoryId },
        });
        return new ResponseScheduleDto(schedule, category);
      }),
    );

    return dtos;
  }

  async findByDateRange(
    dateRange: DateRangeDto,
  ): Promise<ResponseScheduleDto[]> {
    if (dateRange.startDate > dateRange.endDate) {
      throw new BadRequestException(
        '시작 날짜는 종료 날짜보다 늦을 수 없습니다.',
      );
    }
    const schedules = await this.schedulesRepository.find({
      where: {
        userId: dateRange.userId,
        startDate: Between(dateRange.startDate, dateRange.endDate),
      },
      order: { startDate: 'ASC' },
    });

    const dtos = await Promise.all(
      schedules.map(async (schedule) => {
        const category = await this.categoryRepository.findOne({
          where: { categoryId: schedule.categoryId },
        });
        return new ResponseScheduleDto(schedule, category);
      }),
    );

    return dtos;
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
      order: { startDate: 'ASC' },
    });

    console.log('Schedules found:', schedules.length);

    const dtos = await Promise.all(
      schedules.map(async (schedule) => {
        const category = await this.categoryRepository.findOne({
          where: { categoryId: schedule.categoryId },
        });
        return new ResponseScheduleDto(schedule, category);
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
      order: { startDate: 'ASC' },
    });

    console.log('Schedules found:', schedules.length);

    const dtos = await Promise.all(
      schedules.map(async (schedule) => {
        const category = await this.categoryRepository.findOne({
          where: { categoryId: schedule.categoryId },
        });
        return new ResponseScheduleDto(schedule, category);
      }),
    );

    return dtos;
  }

  // 음성 파일 전사 요청
  async transcribeAudio(file: Express.Multer.File): Promise<string> {
    const jwtToken = this.configService.get<string>('RETURN_ZERO_ACCESS_TOKEN');

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname, // 업로드된 파일의 원래 이름 사용
      contentType: file.mimetype, // 파일의 MIME 타입 자동 감지
    });
    formData.append(
      'config',
      JSON.stringify({
        use_diarization: true,
        //diarization: { spk_count: 2 },
        use_itn: true,
        use_disfluency_filter: false,
        use_profanity_filter: false,
        use_paragraph_splitter: true,
        paragraph_splitter: { max: 50 },
        keywords: ['내일', '모레', '글피', '내년', '올해', '오늘'],
      }),
    );

    const url = 'https://openapi.vito.ai/v1/transcribe';

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            ...formData.getHeaders(), // form data의 헤더 포함
          },
        }),
      );
      return response.data.id; // TRANSCRIBE_ID 반환
    } catch (error) {
      throw new Error(`STT 요청 실패: ${error.message}`);
    }
  }

  // 전사 결과 조회
  async getTranscriptionResult(transcribeId: string): Promise<any> {
    const jwtToken = this.configService.get<string>('RETURN_ZERO_ACCESS_TOKEN');

    const url = `https://openapi.vito.ai/v1/transcribe/${transcribeId}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error(`전사 결과 조회 실패: ${error.message}`);
    }
  }

  // 전사 결과가 완료될 때까지 폴링
  async pollTranscriptionResult(
    transcribeId: string,
    maxRetries: number = 10,
    interval: number = 20000,
  ): Promise<any> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await this.getTranscriptionResult(transcribeId);

      if (result.status === 'completed') {
        return result; // 상태가 완료되면 결과 반환
      }

      // 아직 완료되지 않았을 경우 일정 시간 기다림
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('전사 결과를 완료할 수 없습니다. 시간이 초과되었습니다.');
  }

  // 파일 업로드 후 전사 및 결과 조회
  async transcribeAndFetchResult(file: Express.Multer.File): Promise<any> {
    const transcribeId = await this.transcribeAudio(file);
    return await this.pollTranscriptionResult(transcribeId);
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

  async getJwtToken(): Promise<string> {
    const clientId = this.configService.get<string>('RETURN_ZERO_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'RETURN_ZERO_CLIENT_SECRET',
    );

    const url = 'https://openapi.vito.ai/v1/authenticate'; // RTZR 인증 URL

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          url,
          `client_id=${clientId}&client_secret=${clientSecret}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      return response.data.access_token; // JWT 토큰 반환
    } catch (error) {
      throw new Error(`JWT 토큰 발급 실패: ${error.message}`);
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

    const transcriptionText = transcriptionResult.results.utterances
      .map((u) => u.msg)
      .join(' ');
    const formattedDate = formatDateToYYYYMMDDHHMMSS(new Date(currentDateTime));

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
          content: `{Today : ${formattedDate}, conversations : ${transcriptionText}}`,
        },
      ],
    });

    const gptResponseContent = gptResponse.choices[0].message.content;
    console.log(dumi_data);
    return this.convertGptResponseToCreateDto(
      this.parseGptResponse(gptResponseContent),
    );
  }

  private async convertGptResponseToCreateDto(
    gptEvents: any[],
  ): Promise<CreateScheduleDto[]> {
    // 모든 카테고리를 한 번에 조회
    const allCategories = await this.categoryRepository.find();

    // 카테고리 이름을 키로, ID를 값으로 하는 맵 생성
    const categoryMap = allCategories.reduce((acc, category) => {
      acc[category.categoryName] = category.categoryId;
      return acc;
    }, {});

    return Promise.all(
      gptEvents.map(async (event) => {
        const dto = new CreateScheduleDto();
        dto.userId = 1; // 임시 사용자 ID
        dto.startDate = new Date(event.startDate);
        dto.endDate = new Date(event.endDate);
        dto.title = event.intent;
        dto.place = event.place || '';
        dto.isAllDay = event.isAllDay;

        // 카테고리 매핑
        dto.categoryId = categoryMap[event.category] || categoryMap['기타'];

        console.log(dto);
        return dto;
      }),
    );
  }
  async transcribeAndFetchResultWithGpt(
    file: Express.Multer.File,
    currentDateTime: string,
  ) {
    const transcribe = await this.transcribeAndFetchResult(file);
    const result = await this.processWithGpt(transcribe, currentDateTime);
    return result;
  }
}
// 날짜를 YYYY-MM-DD HH:mm:ss 형식으로 변환하는 함수
function formatDateToYYYYMMDDHHMMSS(date: Date): string {
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

const dumi_data = [
  {
    startDate: '2024-10-03 00:00:00',
    endDate: '2024-10-03 23:59:00',
    category: '경조사',
    place: '서울 롯데호텔',
    intent: '손주 결혼식 참석',
    isAllDay: true,
  },
  {
    startDate: '2024-10-05 09:30:00',
    endDate: '2024-10-05 10:30:00',
    category: '병원',
    place: '서울대학교병원',
    intent: '정기 검진',
    isAllDay: false,
  },
  {
    startDate: '2024-10-07 18:00:00',
    endDate: '2024-10-07 19:30:00',
    category: '운동',
    place: '동네 공원',
    intent: '저녁 산책',
    isAllDay: false,
  },
  {
    startDate: '2024-10-10 07:00:00',
    endDate: '2024-10-10 07:30:00',
    category: '복약',
    place: '',
    intent: '혈압약 복용',
    isAllDay: false,
  },
  {
    startDate: '2024-10-15 10:00:00',
    endDate: '2024-10-15 12:00:00',
    category: '가족',
    place: '할머니 댁',
    intent: '할머니 생신 축하',
    isAllDay: false,
  },
  {
    startDate: '2024-10-20 09:00:00',
    endDate: '2024-10-20 10:00:00',
    category: '종교',
    place: '동네 교회',
    intent: '주일 예배',
    isAllDay: false,
  },
  {
    startDate: '2024-10-25 00:00:00',
    endDate: '2024-10-25 23:59:00',
    category: '기타',
    place: '집',
    intent: '집안 대청소',
    isAllDay: true,
  },
];
