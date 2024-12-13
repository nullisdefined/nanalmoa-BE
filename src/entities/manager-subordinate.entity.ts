import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('manager_subordinate')
export class ManagerSubordinate {
  @PrimaryGeneratedColumn({ name: 'user_manager_id' })
  userManagerId: number;

  @Column({ type: 'varchar', name: 'manager_uuid' })
  managerUuid: string;

  @Column({ type: 'varchar', name: 'subordinate_uuid' })
  subordinateUuid: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.manager)
  @JoinColumn({ name: 'manager_uuid', referencedColumnName: 'userUuid' })
  manager: User;

  @ManyToOne(() => User, (user) => user.subordinate)
  @JoinColumn({ name: 'subordinate_uuid', referencedColumnName: 'userUuid' })
  subordinate: User;
}
