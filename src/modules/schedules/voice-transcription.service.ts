import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import FormData from 'form-data';
import OpenAI from 'openai';
import { Multer } from 'multer';
@Injectable()
export class VoiceTranscriptionService {
  private openai: OpenAI;
  private readonly logger = new Logger(VoiceTranscriptionService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  // RTZR 토큰 만료 검사 로직
  private isRTZRTokenExpiredOrCloseToExpiry(
    token: string,
    thresholdMinutes: number = 5,
  ): boolean {
    try {
      const decoded = jwt.decode(token) as { exp: number };
      if (!decoded || !decoded.exp) {
        return true; // 토큰이 유효하지 않거나 만료 시간이 없으면 만료된 것으로 간주
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;
      const thresholdSeconds = thresholdMinutes * 60;

      return timeUntilExpiry <= thresholdSeconds;
    } catch (error) {
      console.error('토큰 검증 중 오류 발생:', error);
      return true; // 오류 발생 시 만료된 것으로 간주
    }
  }

  // 토큰 재발급 로직
  async getRTZRJwtToken(): Promise<string> {
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

  // 토큰 유효성 검사 후 필요 시 재발급
  async ensureValidToken(): Promise<string> {
    // 만료되었거나 곧 만료될 예정이면 새로운 토큰 발급
    const currentToken = this.configService.get<string>(
      'RETURN_ZERO_ACCESS_TOKEN',
    );
    // 토큰 만료 시간 확인 로직 추가 필요
    if (this.isRTZRTokenExpiredOrCloseToExpiry(currentToken)) {
      const newToken = await this.getRTZRJwtToken();
      // 새 토큰을 환경 변수나 설정에 저장
      this.configService.set('RETURN_ZERO_ACCESS_TOKEN', newToken);
      return newToken;
    }
    return currentToken;
  }

  // RTZR 전사 요청
  async transcribeAudio(file: Express.Multer.File): Promise<string> {
    const jwtToken = await this.ensureValidToken();

    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    formData.append(
      'config',
      JSON.stringify({
        use_diarization: true,
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
            ...formData.getHeaders(),
          },
        }),
      );
      return response.data.id;
    } catch (error) {
      if (error.response?.status === 401) {
        // 토큰이 만료되었을 경우, 토큰을 갱신하고 다시 시도
        console.log('토큰이 만료되었습니다. 재발급 후 다시 시도 중...');
        await this.ensureValidToken(); // 강제로 새 토큰 발급
        return this.transcribeAudio(file); // 재귀적으로 다시 시도
      }
      throw new Error(`STT 요청 실패: ${error.message}`);
    }
  }

  // RTZR 전사 결과 조회
  async getRTZRTranscriptionResult(transcribeId: string): Promise<any> {
    const jwtToken = await this.ensureValidToken();

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
      if (error.response?.status === 401) {
        // 토큰이 만료되었을 경우, 토큰을 갱신하고 다시 시도
        console.log('토큰이 만료되었습니다. 재발급 후 다시 시도 중...');
        await this.ensureValidToken(); // 강제로 새 토큰 발급
        return this.getRTZRTranscriptionResult(transcribeId); // 재귀적으로 다시 시도
      }
      throw new Error(`전사 결과 조회 실패: ${error.message}`);
    }
  }

  // 전사 결과가 완료될 때까지 폴링
  async pollTranscriptionResult(
    transcribeId: string,
    maxRetries: number = 15,
    interval: number = 1000,
  ): Promise<any> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        let result = await this.getRTZRTranscriptionResult(transcribeId);
        if (result.status === 'completed') {
          result = result.results.utterances.map((u) => u.msg).join(' ');
          return result;
        }
      } catch (error) {
        console.error(`시도 ${attempt + 1} failed:`, error);
        if (attempt === maxRetries - 1) {
          throw error;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error('전사 결과를 완료할 수 없습니다. 시간이 초과되었습니다.');
  }

  async RTZRTranscribeResult(file: Express.Multer.File): Promise<string> {
    const start = Date.now();
    try {
      const transcribeId = await this.transcribeAudio(file);
      const result = await this.pollTranscriptionResult(transcribeId);
      const end = Date.now();
      this.logger.log(`RTZRTranscribeResult 실행 시간: ${end - start}ms`);
      console.log(`RTZR 전사 결과 : ${result}`);
      return result;
    } catch (error) {
      this.logger.error('RTZRTranscribeResult 오류:', error);
      throw error;
    }
  }

  async whisperTranscribeResult(file: Express.Multer.File): Promise<string> {
    const start = Date.now();
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: new File([file.buffer], file.originalname, {
          type: file.mimetype,
        }),
        model: 'whisper-1',
      });
      const end = Date.now();
      this.logger.log(`whisperTranscribeResult 실행 시간: ${end - start}ms`);
      console.log(`Whisper 전사 결과 : ${transcription.text}`);
      return transcription.text;
    } catch (error) {
      this.logger.error('whisperTranscribeResult 오류:', error);
      throw new Error('음성 전사 중 오류가 발생했습니다.');
    }
  }
}
