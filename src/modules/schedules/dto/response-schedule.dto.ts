import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';
import { Schedule } from 'src/entities/schedule.entity';

export class ResponseScheduleDto extends PickType(CreateScheduleDto, [
  'userId',
  'categoryId',
  'startDate',
  'endDate',
  'title',
  'place',
  'memo',
  'isGroupSchedule',
  'isAllDay',
] as const) {
  @ApiProperty({ description: '일정 ID', example: 1 })
  scheduleId: number;

  @ApiProperty({ description: '사용자 ID', example: 1, required: true })
  userId: number;

  @ApiProperty({ description: '카테고리 ID', example: 2, required: true })
  categoryId: number;

  @ApiProperty({
    description: '일정 시작 날짜',
    example: '2024-09-21T09:00:00Z',
    required: true,
  })
  startDate: Date;

  @ApiProperty({
    description: '일정 종료 날짜',
    example: '2024-09-21T18:00:00Z',
    required: true,
  })
  endDate: Date;

  @ApiProperty({
    description: '일정 제목',
    example: '마을 잔치',
    required: true,
  })
  title: string;

  @ApiProperty({ description: '장소', example: '노인정', required: true })
  place: string;

  @ApiProperty({
    description: '메모',
    example: '이장님 몰래하는거라 조심해서 해야한다.',
    required: true,
  })
  memo: string;

  @ApiProperty({
    description: '그룹 일정 여부',
    example: false,
    required: true,
  })
  isGroupSchedule: boolean;

  @ApiProperty({ description: '종일 옵션', example: false, required: true })
  isAllDay: boolean;

  constructor(schedule: Schedule) {
    super();
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
