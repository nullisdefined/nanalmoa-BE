import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @ApiProperty({ description: '시작 날짜', example: '2023-09-01' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: '종료 날짜', example: '2023-09-30' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
