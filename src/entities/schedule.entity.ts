import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('schedule')
export class Schedule {
  @PrimaryGeneratedColumn({ name: 'schedule_id' })
  scheduleId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'category_id', default: 7 })
  categoryId?: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ length: 255, default: '새로운 일정' })
  title?: string;

  @Column({ length: 255, default: '' })
  place?: string;

  @Column({ type: 'text', default: '' })
  memo?: string;

  @Column({ name: 'is_group_schedule', default: false })
  isGroupSchedule?: boolean;

  @Column({ name: 'is_all_day', default: false })
  isAllDay?: boolean;
}
