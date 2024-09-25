import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class WeekQueryDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @IsInt()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: '기준 날짜', example: '2024-09-18' })
  @IsDate()
  @Type(() => Date)
  date: Date;
}
