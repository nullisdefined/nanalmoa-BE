import { ApiProperty } from '@nestjs/swagger';
import { ResponseScheduleDto } from './response-schedule.dto';

export class ResponseRecurringScheduleDto extends ResponseScheduleDto {
  @ApiProperty({
    description: '반복 간격',
    example: 1,
  })
  recurringInterval: number;

  @ApiProperty({
    description: '반복 요일 (주간 반복일 경우)',
    example: [1, 3, 5],
    required: false,
  })
  recurringDaysOfWeek?: number[];

  @ApiProperty({
    description: '반복 일 (월간 반복일 경우)',
    example: 15,
    required: false,
  })
  recurringDayOfMonth?: number;

  @ApiProperty({
    description: '반복 월 (연간 반복일 경우)',
    example: 3,
    required: false,
  })
  recurringMonthOfYear?: number;

  constructor(schedule: any, category: any, instances?: any[]) {
    super(schedule, category, instances);
    this.recurringInterval = schedule.recurringInterval;
    this.recurringDaysOfWeek = schedule.recurringDaysOfWeek;
    this.recurringDayOfMonth = schedule.recurringDayOfMonth;
    this.recurringMonthOfYear = schedule.recurringMonthOfYear;
  }
}
