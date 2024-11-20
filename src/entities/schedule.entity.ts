import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Category } from './category.entity';
import { GroupSchedule } from './group-schedule.entity';
import { User } from './user.entity';
import { ScheduleRecurring } from './schedule-recurring.entity';

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

  @Column({ length: 255, nullable: true, default: '새로운 일정' })
  title?: string;

  @Column({ length: 255, nullable: true })
  place?: string;

  @Column({ type: 'text', nullable: true })
  memo?: string;

  @Column({ name: 'is_all_day', nullable: true })
  isAllDay?: boolean;

  @Column({ name: 'is_group_schedule', default: false })
  isGroupSchedule: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => GroupSchedule, (groupSchedule) => groupSchedule.schedule)
  groupSchedules: GroupSchedule[];

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @OneToOne(() => ScheduleRecurring, (recurring) => recurring.schedule)
  recurring: ScheduleRecurring;
}
