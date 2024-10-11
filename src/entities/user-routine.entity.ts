import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_routine')
export class UserRoutine {
  @PrimaryGeneratedColumn({ name: 'user_routine_id' })
  userRoutineId: number;

  @Column({ name: 'user_uuid', type: 'uuid' })
  userUuid: string;

  @Column({ name: 'wake_up_time', type: 'time' })
  wakeUpTime: Date;

  @Column({ name: 'breakfast_time', type: 'time' })
  breakfastTime: Date;

  @Column({ name: 'lunch_time', type: 'time' })
  lunchTime: Date;

  @Column({ name: 'dinner_time', type: 'time' })
  dinnerTime: Date;

  @Column({ name: 'morning_time', type: 'time' })
  bedTime: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({ name: '' })
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_uuid' })
  user: User;
}
