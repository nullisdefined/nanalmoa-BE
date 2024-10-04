import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BasicLoginDto {
  @ApiProperty({
    description: '사용자 전화번호',
    example: '01012345678',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: '인증 코드',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  verificationCode: string;
}
