import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';

export class ScheduleResponseDto extends PickType(CreateScheduleDto, [
  'userId',
  'categoryId',
  'startDate',
  'endDate',
  'title',
  'place',
  'memo',
  'isGroupSchedule',
] as const) {
  @ApiProperty({ description: '일정 ID', example: '1' })
  scheduleId: number;

  @ApiProperty({ description: '생성 날짜', example: '2023-09-21T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: '수정 날짜', example: '2023-09-21T20:00:00Z' })
  updatedAt: Date;
}
