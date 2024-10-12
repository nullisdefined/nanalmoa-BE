import { ApiProperty } from '@nestjs/swagger';
import { Schedule } from 'src/entities/schedule.entity';
import { Category } from '@/entities/category.entity';
import { ScheduleInstance } from '@/entities/schedule-instance.entity';

export class ResponseScheduleDto {
  @ApiProperty({ description: '일정 ID', example: 1 })
  scheduleId: number;

  @ApiProperty({
    description: '특정 사용자의 UUID',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  userUuid: string;

  @ApiProperty({
    description: '카테고리',
    type: () => Category,
    example: {
      categoryId: 1,
      categoryName: '병원',
    },
  })
  category: Category;

  @ApiProperty({
    description: '일정 시작 날짜',
    example: '2024-09-21T09:00:00Z',
  })
  startDate: Date;

  @ApiProperty({
    description: '일정 종료 날짜',
    example: '2024-09-21T18:00:00Z',
  })
  endDate: Date;

  @ApiProperty({
    description: '일정 제목',
    example: '마을 잔치',
  })
  title: string;

  @ApiProperty({ description: '장소', example: '노인정' })
  place: string;

  @ApiProperty({
    description: '메모',
    example: '이장님 몰래하는거라 조심해서 해야한다.',
  })
  memo: string;

  @ApiProperty({
    description: '그룹 일정 여부',
    example: false,
  })
  isGroupSchedule: boolean;

  @ApiProperty({ description: '종일 옵션', example: false })
  isAllDay: boolean;

  @ApiProperty({
    description: '반복 유형',
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    example: 'none',
  })
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiProperty({
    description: '반복 종료 날짜',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  repeatEndDate?: Date;

  @ApiProperty({ description: '반복 일정 여부', example: false })
  isRecurring: boolean;

  @ApiProperty({ description: '반복 간격', example: 1, required: false })
  recurringInterval?: number;

  @ApiProperty({ description: '반복 요일', type: [Number], required: false })
  recurringDaysOfWeek?: number[];

  @ApiProperty({ description: '반복 일', example: 1, required: false })
  recurringDayOfMonth?: number;

  @ApiProperty({ description: '반복 월', example: 1, required: false })
  recurringMonthOfYear?: number;

  @ApiProperty({ description: '예외 일정 여부', required: false })
  isException?: boolean;

  @ApiProperty({
    description: '일정 인스턴스',
    type: [ScheduleInstance],
    required: false,
  })
  instances?: ScheduleInstance[];

  constructor(
    schedule: Schedule,
    category: Category,
    instances?: ScheduleInstance[],
    isException: boolean = false,
  ) {
    this.scheduleId = schedule.scheduleId;
    this.userUuid = schedule.userUuid;
    this.category = category;
    this.startDate = schedule.startDate;
    this.endDate = schedule.endDate;
    this.title = schedule.title || '새로운 일정';
    this.place = schedule.place;
    this.memo = schedule.memo;
    this.isGroupSchedule =
      schedule.isGroupSchedule ||
      (schedule.groupSchedules && schedule.groupSchedules.length > 0);
    this.isAllDay = schedule.isAllDay;
    this.repeatType = schedule.repeatType;
    this.repeatEndDate = schedule.repeatEndDate;
    this.isRecurring = schedule.isRecurring;
    this.recurringInterval = schedule.recurringInterval;
    this.recurringDaysOfWeek = schedule.recurringDaysOfWeek;
    this.recurringDayOfMonth = schedule.recurringDayOfMonth;
    this.recurringMonthOfYear = schedule.recurringMonthOfYear;
    this.isException = isException;

    if (instances && instances.length > 0) {
      this.instances = instances;
    }
  }
}
