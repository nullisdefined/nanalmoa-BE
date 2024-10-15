import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class WeekQueryDto {
  @ApiProperty({
    description: '특정 사용자의 UUID',
    required: false,
  })
  @IsOptional()
  userUuid?: string;

  @ApiProperty({ description: '기준 날짜', example: '2024-09-18' })
  @IsDate()
  @Type(() => Date)
  date: Date;
}
