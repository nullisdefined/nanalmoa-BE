import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Schedule } from './schedule.entity';
import { User } from './user.entity';

@Entity('group_schedule')
export class GroupSchedule {
  @PrimaryGeneratedColumn({ name: 'group_schedule_id' })
  groupScheduleId: number;

  @Column({ name: 'user_uuid' })
  userUuid: string;

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

  @ManyToOne(() => User, (user) => user.groupSchedules)
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'userUuid' })
  user: User;
}
