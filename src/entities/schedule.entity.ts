import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('schedule')
export class Schedule {
  @PrimaryGeneratedColumn({ name: 'schedule_id' })
  scheduleId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255 })
  place: string;

  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @Column({ name: 'is_group_schedule', default: false })
  isGroupSchedule: boolean;
}
