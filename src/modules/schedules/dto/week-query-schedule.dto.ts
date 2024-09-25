import { ApiProperty } from '@nestjs/swagger';
import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class WeekQueryDto {
  @ApiProperty({ description: '기준 날짜', example: '2024-09-18' })
  @IsDate()
  @Type(() => Date)
  date: Date;
}
