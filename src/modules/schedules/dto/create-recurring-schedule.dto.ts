import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { CreateScheduleDto } from './create-schedule.dto';

export class CreateRecurringScheduleDto extends CreateScheduleDto {
  @ApiProperty({
    description: '반복 간격',
    example: 1,
    default: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  recurringInterval: number;

  @ApiProperty({
    description: '반복 요일 (주간 반복일 경우)',
    example: [1, 3, 5],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  recurringDaysOfWeek?: number[];

  @ApiProperty({
    description: '반복 일 (월간 반복일 경우)',
    example: 15,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  recurringDayOfMonth?: number;

  @ApiProperty({
    description: '반복 월 (연간 반복일 경우)',
    example: 3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  recurringMonthOfYear?: number;

  // repeatType을 필수로 변경
  @ApiProperty({
    description: '반복 유형',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    example: 'weekly',
  })
  @IsNotEmpty()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
