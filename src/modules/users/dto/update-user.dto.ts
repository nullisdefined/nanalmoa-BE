import {
  IsString,
  IsOptional,
  IsEmail,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(/^01[016789]\d{7,8}$/, {
    message: '올바른 전화번호 형식이 아닙니다.',
  })
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  phoneVerificationCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  emailVerificationCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  address?: string;
}
