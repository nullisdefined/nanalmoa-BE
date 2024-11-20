import { Category } from '@/entities/category.entity';
import { UserInfo } from '@/modules/users/dto/user-info-detail.dto';

export class ResponseGroupInfo {
  groupId: number;
  groupName: string;
  users: UserInfo[];
}

export class ResponseScheduleDto {
  scheduleId: number;
  userUuid: string;
  category: Category;
  title: string;
  place: string;
  memo: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  isRecurring: boolean;
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  repeatEndDate?: Date;
  recurringInterval?: number;
  recurringDaysOfWeek?: number[];
  recurringDayOfMonth?: number;
  recurringMonthOfYear?: number;
  groupInfo?: ResponseGroupInfo[];

  constructor(params: {
    scheduleId: number;
    userUuid: string;
    category: Category;
    title?: string;
    place?: string;
    memo?: string;
    startDate: Date;
    endDate: Date;
    isAllDay?: boolean;
    isRecurring: boolean;
    recurring?: {
      repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
      repeatEndDate?: Date;
      recurringInterval?: number;
      recurringDaysOfWeek?: number[];
      recurringDayOfMonth?: number;
      recurringMonthOfYear?: number;
    };
    groupInfo?: ResponseGroupInfo[];
  }) {
    this.scheduleId = params.scheduleId;
    this.userUuid = params.userUuid;
    this.category = params.category;
    this.title = params.title || '';
    this.place = params.place || '';
    this.memo = params.memo || '';
    this.startDate = params.startDate;
    this.endDate = params.endDate;
    this.isAllDay = params.isAllDay || false;
    this.isRecurring = params.isRecurring;

    if (params.recurring) {
      this.repeatType = params.recurring.repeatType;
      this.repeatEndDate = params.recurring.repeatEndDate;
      this.recurringInterval = params.recurring.recurringInterval;
      this.recurringDaysOfWeek = params.recurring.recurringDaysOfWeek;
      this.recurringDayOfMonth = params.recurring.recurringDayOfMonth;
      this.recurringMonthOfYear = params.recurring.recurringMonthOfYear;
    }

    this.groupInfo = params.groupInfo;
  }
}
