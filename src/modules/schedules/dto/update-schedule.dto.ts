import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateScheduleDto {
  @ApiProperty({
    description: '일정 시작 날짜 및 시간',
    example: '2024-10-15T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({
    description: '일정 종료 날짜 및 시간',
    example: '2024-10-15T01:00:00Z',
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({
    description: '일정 제목',
    example: '팀 미팅',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: '일정 장소',
    example: '회의실 A',
    required: false,
  })
  @IsOptional()
  @IsString()
  place?: string;

  @ApiProperty({
    description: '일정에 대한 메모',
    example: '프로젝트 진행 상황 논의',
    required: false,
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({
    description: '종일 일정 여부',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiProperty({
    description: '일정 카테고리 ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    description: '반복 일정 여부',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({
    description: '반복 유형',
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    example: 'weekly',
    required: false,
  })
  @IsEnum(['none', 'daily', 'weekly', 'monthly', 'yearly'])
  @IsOptional()
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiProperty({
    description: '반복 종료 날짜',
    example: '2024-11-02T23:59:59Z',
    required: false,
  })
  @ValidateIf((o) => o.isRecurring === true)
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  repeatEndDate?: Date;

  @ApiProperty({
    description: '반복 간격 (일/주/월/년 단위)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  recurringInterval?: number;

  @ApiProperty({
    description:
      '주간 반복 시 반복할 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)',
    example: [2, 4],
    required: false,
  })
  @IsOptional()
  @IsArray()
  recurringDaysOfWeek?: number[];

  @ApiProperty({
    description: '월간 반복 시 반복할 날짜',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  recurringDayOfMonth?: number;

  @ApiProperty({
    description: '연간 반복 시 반복할 월 (1-12)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  recurringMonthOfYear?: number;
}
