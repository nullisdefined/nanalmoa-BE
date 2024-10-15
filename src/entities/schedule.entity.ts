import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Category } from './category.entity';
import { GroupSchedule } from './group-schedule.entity';
import { User } from './user.entity';

@Entity('schedule')
export class Schedule {
  @PrimaryGeneratedColumn({ name: 'schedule_id' })
  scheduleId: number;

  @Column({ name: 'user_uuid', type: 'uuid' })
  userUuid: string;

  @ManyToOne(() => User, (user) => user.schedules)
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'userUuid' })
  user: User;

  @ManyToOne(() => Category, (category) => category.schedules)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ length: 255, nullable: false, default: '새로운 일정' })
  title?: string;

  @Column({ length: 255, default: '' })
  place?: string;

  @Column({ type: 'text', default: '' })
  memo?: string;

  @Column({ name: 'is_all_day', default: false })
  isAllDay?: boolean;

  @Column({ name: 'is_group_schedule', default: false })
  isGroupSchedule: boolean;

  @Column({
    name: 'repeat_type',
    type: 'enum',
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'none',
  })
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

  @Column({ name: 'repeat_end_date', type: 'timestamp', nullable: true })
  repeatEndDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => GroupSchedule, (groupSchedule) => groupSchedule.schedule)
  groupSchedules: GroupSchedule[];

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurring_interval', type: 'int', nullable: true })
  recurringInterval?: number;

  @Column('int', {
    array: true,
    nullable: true,
    name: 'recurring_days_of_week',
  })
  recurringDaysOfWeek: number[];

  @Column({ name: 'recurring_day_of_month', type: 'int', nullable: true })
  recurringDayOfMonth?: number;

  @Column({ name: 'recurring_month_of_year', type: 'int', nullable: true })
  recurringMonthOfYear?: number;
}
