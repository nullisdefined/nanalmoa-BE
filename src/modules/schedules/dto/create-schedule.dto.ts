import {
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ description: '카테고리 ID', example: 2 })
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiProperty({
    description: '일정 시작 날짜',
    example: '2023-09-21T09:00:00Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: '일정 종료 날짜',
    example: '2023-09-21T18:00:00Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ description: '일정 제목', example: '마을 잔치' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: '장소', example: '노인정' })
  @IsNotEmpty()
  @IsString()
  place: string;

  @ApiProperty({
    description: '메모',
    required: false,
    example: '이장님 몰래하는거라 조심해서 해야한다.',
  })
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiProperty({ description: '그룹 일정 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isGroupSchedule: boolean = false;
}
