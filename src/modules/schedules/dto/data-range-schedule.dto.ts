import { CreateScheduleDto } from './create-schedule.dto';
import { PickType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

export class DateRangeDto extends PickType(CreateScheduleDto, [
  'startDate',
  'endDate',
  'userUuid',
] as const) {
  @ApiProperty({
    description: '조회 시작 날짜',
    example: '2024-09-01',
  })
  startDate: Date;

  @ApiProperty({
    description: '조회 종료 날짜',
    example: '2024-09-30',
  })
  endDate: Date;
}
