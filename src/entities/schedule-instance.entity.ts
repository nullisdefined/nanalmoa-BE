import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Schedule } from './schedule.entity';

@Entity('schedule_instance')
export class ScheduleInstance {
  @PrimaryGeneratedColumn({ name: 'schedule_instance_id' })
  scheduleInstanceId: number;

  @ManyToOne(() => Schedule, (schedule) => schedule.instances)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @Column({ name: 'instance_start_date', type: 'timestamp' })
  instanceStartDate: Date;

  @Column({ name: 'instance_end_date', type: 'timestamp' })
  instanceEndDate: Date;

  @Column({ name: 'is_exception', default: false })
  isException: boolean;

  @Column({ name: 'exception_memo', nullable: true })
  exceptionMemo?: string;
}
