import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({
    description: '인증 코드를 받은 전화번호',
    example: '010-1234-5678',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: '수신한 인증 코드',
    example: '916842',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
