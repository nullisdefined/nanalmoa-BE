import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as coolsms from 'coolsms-node-sdk';

@Injectable()
export class CoolSmsService {
  private messageService: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('COOLSMS_API_KEY');
    const apiSecret = this.configService.get<string>('COOLSMS_API_SECRET');
    this.messageService = new coolsms.default(apiKey, apiSecret);
  }

  async sendVerificationCode(
    phoneNumber: string,
    verificationCode: string,
    expirationMinutes: number,
  ): Promise<boolean> {
    try {
      const result = await this.messageService.sendOne({
        to: phoneNumber,
        from: this.configService.get<string>('COOLSMS_SENDER_PHONE_NUMBER'),
        text: `[나날모아] 본인확인 인증번호
[${verificationCode}]를 화면에 입력해주세요.
이 번호는 ${expirationMinutes}분동안 유효합니다.`,
      });

      console.log('SMS send result:', result);
      return result.statusCode === '2000';
    } catch (error) {
      console.error('인증번호 전송 실패:', error);
      return false;
    }
  }
}
