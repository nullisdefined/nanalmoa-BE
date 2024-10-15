import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Category } from '@/entities/category.entity';
import { UserInfo } from '@/modules/users/dto/user-info-detail.dto';

export class ResponseGroupInfo {
  @ApiProperty({ description: '그룹 ID', example: 2 })
  groupId: number;

  @ApiProperty({ description: '그룹 이름', example: '개발팀' })
  groupName: string;

  @ApiProperty({ description: '그룹에 속한 사용자 정보', type: [UserInfo] })
  users: UserInfo[];
}

export class ResponseScheduleDto {
  @ApiProperty({ description: '일정 ID', example: 1 })
  scheduleId: number;

  @ApiProperty({ description: '사용자 UUID', example: 'abc123-def456-ghi789' })
  userUuid: string;

  @ApiProperty({
    description: '일정 시작 날짜 및 시간',
    example: '2023-10-15T09:00:00Z',
  })
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({
    description: '일정 종료 날짜 및 시간',
    example: '2023-10-15T10:00:00Z',
  })
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({
    description: '일정 제목',
    example: '팀 미팅',
  })
  title: string;

  @ApiProperty({
    description: '일정 장소',
    example: '회의실 A',
  })
  place?: string;

  @ApiProperty({
    description: '일정에 대한 메모',
    example: '프로젝트 진행 상황 논의',
  })
  memo?: string;

  @ApiProperty({
    description: '종일 일정 여부',
    example: false,
  })
  isAllDay: boolean;

  @ApiProperty({
    description: '일정 카테고리',
    type: () => Category,
  })
  category: Category;

  @ApiProperty({ description: '반복 일정 여부', example: true })
  isRecurring: boolean;

  @ApiProperty({
    description: '반복 유형',
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    example: 'weekly',
  })
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

  @ApiProperty({
    description: '반복 종료 날짜',
    example: '2023-12-31T23:59:59Z',
  })
  @Type(() => Date)
  repeatEndDate?: Date;

  @ApiProperty({
    description: '반복 간격 (일/주/월/년 단위)',
    example: 1,
  })
  recurringInterval?: number;

  @ApiProperty({
    description:
      '주간 반복 시 반복할 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)',
    example: [1, 3, 5],
  })
  recurringDaysOfWeek?: number[];

  @ApiProperty({
    description: '월간 반복 시 반복할 날짜',
    example: 15,
  })
  recurringDayOfMonth?: number;

  @ApiProperty({
    description: '연간 반복 시 반복할 월 (1-12)',
    example: 3,
  })
  recurringMonthOfYear?: number;

  @ApiProperty({
    description: '그룹 및 사용자 정보',
    type: [ResponseGroupInfo],
  })
  groupInfo?: ResponseGroupInfo[];

  @ApiProperty({
    description: '그룹 일정 여부',
    example: false,
  })
  isGroupSchedule: boolean;

  constructor(partial: Partial<ResponseScheduleDto>) {
    Object.assign(this, partial);
    this.isGroupSchedule = !!this.groupInfo && this.groupInfo.length > 0;
  }
}
