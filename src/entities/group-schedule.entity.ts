import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Schedule } from './schedule.entity';

@Entity() // 그룹과 일정을 연결하는 중간 테이블 역할
export class GroupSchedule {
  @PrimaryGeneratedColumn({ name: 'group_schedule_id' })
  groupScheduleId: number;

  @ManyToOne(() => Group, (group) => group.groupSchedules)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => Schedule, (schedule) => schedule.groupSchedules)
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
