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
import { ScheduleInstance } from './schedule-instance.entity';

@Entity('schedule')
export class Schedule {
  @PrimaryGeneratedColumn({ name: 'schedule_id' })
  scheduleId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Category, (category) => category.schedules)
  @JoinColumn({ name: 'category_id' })
  category: Category;

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

  @Column({
    name: 'repeat_type',
    type: 'enum',
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none',
  })
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly';

  @Column({ name: 'repeat_end_date', type: 'timestamp', nullable: true })
  repeatEndDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ScheduleInstance, (instance) => instance.schedule)
  instances: ScheduleInstance[];
}
