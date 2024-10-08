import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import axios from 'axios';
import FormData from 'form-data';

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
}
