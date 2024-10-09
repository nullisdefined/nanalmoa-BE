import { ApiProperty } from '@nestjs/swagger';
import { Schedule } from 'src/entities/schedule.entity';
import { Category } from '@/entities/category.entity';
import { ScheduleInstance } from '@/entities/schedule-instance.entity';

export class ResponseScheduleDto {
  @ApiProperty({ description: '일정 ID', example: 1 })
  scheduleId: number;

  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

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
    enum: ['none', 'daily', 'weekly', 'monthly'],
    example: 'none',
  })
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly';

  @ApiProperty({
    description: '반복 종료 날짜',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  repeatEndDate?: Date;

  instances?: {
    instanceStartDate: Date;
    instanceEndDate: Date;
  }[];

  constructor(
    schedule: Schedule,
    category: Category,
    instances?: ScheduleInstance[],
  ) {
    this.scheduleId = schedule.scheduleId;
    this.userId = schedule.userId;
    this.category = category;
    this.startDate = schedule.startDate;
    this.endDate = schedule.endDate;
    this.title = schedule.title;
    this.place = schedule.place;
    this.memo = schedule.memo;
    this.isGroupSchedule = schedule.isGroupSchedule;
    this.isAllDay = schedule.isAllDay;
    if (instances && instances.length > 0) {
      this.instances = instances.map((instance) => ({
        instanceStartDate: instance.instanceStartDate,
        instanceEndDate: instance.instanceEndDate,
      }));
    }
  }
}
