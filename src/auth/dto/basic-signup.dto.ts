import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';

export class BasicSignupDto {
  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/, {
    message: '올바른 전화번호 형식이 아닙니다.',
  })
  phoneNumber: string;

  @ApiProperty({
    description: '인증 코드',
    example: '940816',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  verificationCode: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '이메일',
    example: null,
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: null,
    required: false,
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
