import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';

@Injectable()
export class OCRTranscriptionService {
  private client: ImageAnnotatorClient;
  private readonly logger = new Logger(OCRTranscriptionService.name);

  constructor(private configService: ConfigService) {
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

  async detectTextByOCR(imageBuffer: Buffer): Promise<string> {
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
}
