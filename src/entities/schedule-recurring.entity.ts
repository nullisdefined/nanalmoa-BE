import {
  Column,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Entity,
  UpdateDateColumn,
} from 'typeorm';
import { Schedule } from './schedule.entity';

@Entity('schedule_recurring')
export class ScheduleRecurring {
  @PrimaryGeneratedColumn({ name: 'recurring_id' })
  recurringId: number;

  @OneToOne(() => Schedule)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ name: 'schedule_id' })
  scheduleId: number;

  @Column({
    name: 'repeat_type',
    type: 'enum',
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
  })
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

  @Column({ name: 'repeat_end_date', type: 'timestamp', nullable: true })
  repeatEndDate?: Date;

  @Column({ name: 'recurring_interval', type: 'int', nullable: true })
  recurringInterval?: number;

  @Column('int', {
    array: true,
    nullable: true,
    name: 'recurring_days_of_week',
  })
  recurringDaysOfWeek?: number[];

  @Column({ name: 'recurring_day_of_month', type: 'int', nullable: true })
  recurringDayOfMonth?: number;

  @Column({ name: 'recurring_month_of_year', type: 'int', nullable: true })
  recurringMonthOfYear?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
