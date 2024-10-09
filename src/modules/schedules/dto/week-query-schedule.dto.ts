import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class WeekQueryDto {
  @ApiProperty({
    description: '특정 사용자의 UUID',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsUUID()
  userUuid: string;

  @ApiProperty({ description: '기준 날짜', example: '2024-09-18' })
  @IsDate()
  @Type(() => Date)
  date: Date;
}
