import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import axios from 'axios';
import FormData from 'form-data';
import OpenAI from 'openai';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UsersRoutineService } from '../users/users-routine.service';
import { UserRoutineResponseDto } from '../users/dto/response-user-routine.dto';

@Injectable()
export class OCRTranscriptionService {
  private client: ImageAnnotatorClient;
  private readonly logger = new Logger(OCRTranscriptionService.name);

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => SchedulesService))
    private scheduleService: SchedulesService,
    private usersRoutineService: UsersRoutineService,
  ) {
    this.client = new ImageAnnotatorClient(this.getCredentials());
  }
  private getCredentials() {
    return {
      projectId: this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID'),
      credentials: {
        private_key: this.configService.get<string>('GOOGLE_CLOUD_PRIVATE_KEY'),
        client_email: this.configService.get<string>(
          'GOOGLE_CLOUD_CLIENT_EMAIL',
        ),
      },
    };
  }

  async detectTextByCloudVisionOCR(imageBuffer: Buffer): Promise<string> {
    try {
      const [result] = await this.client.textDetection(imageBuffer);
      const detections = result.textAnnotations;

      if (!detections || detections.length === 0) {
        this.logger.warn('이미지에서 텍스트가 감지되지 않았습니다.');
        return '';
      }

      return detections[0].description || '';
    } catch (error) {
      this.logger.error(`OCR 처리 중 오류 발생: ${error.message}`, error.stack);
      if (error.code) {
        this.logger.error(`오류 코드: ${error.code}`);
      }
      if (error.details) {
        this.logger.error(`오류 세부 정보: ${error.details}`);
      }
      throw new Error(`OCR 처리 중 오류 발생: ${error.message}`);
    }
  }

  async extractTextFromNaverOCR(
    imageFile: Express.Multer.File,
  ): Promise<string> {
    try {
      console.log('Naver Clova OCR 호출 중...');

      const formData = new FormData();
      formData.append(
        'message',
        JSON.stringify({
          version: 'V2',
          requestId: '1234',
          timestamp: Date.now(),
          lang: 'ko',
          images: [
            {
              format: imageFile.mimetype.split('/')[1],
              name: 'demo_image',
            },
          ],
          enableTableDetection: false,
        }),
      );
      formData.append('file', imageFile.buffer, {
        filename: imageFile.originalname,
        contentType: imageFile.mimetype,
      });

      const response = await axios.post(
        `https://8gqvbgtnnm.apigw.ntruss.com/custom/v1/34860/2e652dcb90b77cb93bf55721d77d33d2bae7a6912d8bc0e3a210c7004e3c3875/general`,
        formData,
        {
          headers: {
            'X-OCR-SECRET': this.configService.get<string>('CLOVA_OCR_SECRET'),
            ...formData.getHeaders(),
          },
        },
      );

      const extractedText = response.data.images[0].fields.map(
        (field) => field.inferText,
      );
      return extractedText.join(' ');
    } catch (error) {
      console.error('Naver Clova OCR 호출 오류:', error);
      throw new Error('Naver Clova OCR 호출 실패');
    }
  }

  /**
   * OCR 결과를 OpenAI GPT 모델에 넘겨서 처리합니다.
   */
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
    console.log(this.scheduleService.parseGptResponse(gptResponseContent));
    return this.scheduleService.parseGptResponse(gptResponseContent);
  }

  private async extractMedicationInfo(
    ocrResult: string,
  ): Promise<MedicationInfo> {
    const gptProcessedResult = await this.processWithGptOCR(ocrResult);
    return this.parseMedicationInfo(gptProcessedResult);
  }

  private parseMedicationInfo(gptResult: any[]): MedicationInfo {
    // 모든 약물 정보를 고려하여 최대값을 찾습니다.
    const maxTimesPerDay = Math.max(
      ...gptResult.map((item) => item.times || 1),
    );
    const maxDurationDays = Math.max(
      ...gptResult.map((item) => item.days || 1),
    );

    // 모든 약물 정보를 하나의 문자열로 결합합니다.
    const allTablets = gptResult
      .map((item) => `${item.tablets} ${item.intent}`)
      .join(', ');
    const allInstructions = gptResult
      .map(
        (item) =>
          `${item.intent}: ${item.tablets}정 ${item.times}회 ${item.days}일`,
      )
      .join('. ');

    const medicationInfo: MedicationInfo = {
      intent: '복약',
      tablets: allTablets,
      timesPerDay: maxTimesPerDay,
      durationDays: maxDurationDays,
      specificTimes: [],
      additionalInstructions: allInstructions,
    };

    // 최대 일수와 1일 복용횟수 검증 및 조정
    medicationInfo.durationDays = Math.min(
      Math.max(medicationInfo.durationDays, 1),
      365,
    ); // 1일 ~ 365일
    medicationInfo.timesPerDay = Math.min(
      Math.max(medicationInfo.timesPerDay, 1),
      24,
    ); // 1회 ~ 24회

    return medicationInfo;
  }
  async processMedicationImage(
    imageFile: Express.Multer.File,
    userUuid: string,
  ): Promise<CreateScheduleDto[]> {
    try {
      const ocrResult = await this.extractTextFromNaverOCR(imageFile);
      const medicationInfo = await this.extractMedicationInfo(ocrResult);

      console.log('최대 일수:', medicationInfo.durationDays);
      console.log('1일 최대 복용 횟수:', medicationInfo.timesPerDay);

      const userRoutine =
        await this.usersRoutineService.getUserRoutine(userUuid);
      return this.createSchedulesFromMedicationInfo(
        medicationInfo,
        userRoutine,
      );
    } catch (error) {
      this.logger.error(
        `약 이미지 처리 중 오류 발생: ${error.message}`,
        error.stack,
      );
      throw new Error(`약 이미지 처리 중 오류 발생: ${error.message}`);
    }
  }

  private createSchedulesFromMedicationInfo(
    medicationInfo: MedicationInfo,
    userRoutine: UserRoutineResponseDto,
  ): CreateScheduleDto[] {
    const schedules: CreateScheduleDto[] = [];
    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + medicationInfo.durationDays * 24 * 60 * 60 * 1000,
    );

    const routineTimes = [
      userRoutine.wakeUpTime,
      userRoutine.breakfastTime,
      userRoutine.lunchTime,
      userRoutine.dinnerTime,
      userRoutine.bedTime,
    ];

    let medicationTimes: string[];
    if (medicationInfo.specificTimes.length > 0) {
      medicationTimes = medicationInfo.specificTimes;
    } else {
      medicationTimes = this.calculateMedicationTimes(
        routineTimes,
        medicationInfo.timesPerDay,
      );
    }

    medicationTimes.forEach((time) => {
      const [hours, minutes] = time.split(':').map(Number);

      const schedule = new CreateScheduleDto();
      schedule.startDate = new Date(startDate);
      schedule.startDate.setHours(hours, minutes, 0, 0);
      schedule.endDate = new Date(schedule.startDate);
      schedule.endDate.setMinutes(schedule.endDate.getMinutes() + 30);

      schedule.title = `복약`; // title을 복약으로 설정
      schedule.memo = '';
      schedule.isAllDay = false;
      schedule.categoryId = 6; // 약 복용 카테고리 ID
      schedule.isRecurring = true;
      schedule.repeatType = 'daily';
      schedule.repeatEndDate = new Date(endDate);
      schedule.recurringInterval = 1;

      schedules.push(schedule);
    });

    return schedules;
  }

  private calculateMedicationTimes(
    routineTimes: string[],
    timesPerDay: number,
  ): string[] {
    const times: string[] = [];
    switch (timesPerDay) {
      case 1:
        times.push(routineTimes[2]); // 점심 시간
        break;
      case 2:
        times.push(routineTimes[1], routineTimes[3]); // 아침, 저녁 시간
        break;
      case 3:
        times.push(routineTimes[1], routineTimes[2], routineTimes[3]); // 아침, 점심, 저녁 시간
        break;
      default:
        // 4회 이상인 경우, 기상 시간과 취침 시간 사이를 균등하게 분배
        const wakeUpTime = this.parseTime(routineTimes[0]);
        const bedTime = this.parseTime(routineTimes[4]);
        const interval = (bedTime - wakeUpTime) / (timesPerDay + 1);
        for (let i = 1; i <= timesPerDay; i++) {
          const medicationTime = new Date(wakeUpTime + interval * i);
          times.push(this.formatTime(medicationTime));
        }
    }
    return times;
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 * 60 * 1000 + minutes * 60 * 1000;
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}

interface MedicationInfo {
  intent: string;
  tablets: string;
  timesPerDay: number;
  durationDays: number;
  specificTimes: string[];
  additionalInstructions: string;
}
