import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_routine')
export class UserRoutine {
  @PrimaryGeneratedColumn({ name: 'user_routine_id' })
  userRoutineId: number;

  @Column({ type: 'uuid', name: 'user_uuid' })
  userUuid: string;

  @Column({ name: 'wake_up_time', type: 'time' })
  wakeUpTime: string;

  @Column({ name: 'breakfast_time', type: 'time' })
  breakfastTime: string;

  @Column({ name: 'lunch_time', type: 'time' })
  lunchTime: string;

  @Column({ name: 'dinner_time', type: 'time' })
  dinnerTime: string;

  @Column({ name: 'bed_time', type: 'time' })
  bedTime: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'userUuid' })
  user: User;
}
