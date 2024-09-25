import { ApiProperty } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';
import { Schedule } from 'src/entities/schedule.entity';

export class ScheduleResponseDto extends CreateScheduleDto {
  @ApiProperty({ description: '일정 ID', example: 1 })
  scheduleId: number;

  constructor(schedule: Schedule) {
    super(); // 상위 클래스의 속성 초기화
    this.scheduleId = schedule.scheduleId;
    this.userId = schedule.userId;
    this.categoryId = schedule.categoryId;
    this.startDate = schedule.startDate;
    this.endDate = schedule.endDate;
    this.title = schedule.title;
    this.place = schedule.place;
    this.memo = schedule.memo;
    this.isGroupSchedule = schedule.isGroupSchedule;
    this.isAllDay = schedule.isAllDay;
  }
}
