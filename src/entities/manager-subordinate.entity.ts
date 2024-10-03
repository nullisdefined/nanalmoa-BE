import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('manager-subordinate')
export class ManagerSubordinate {
  @PrimaryGeneratedColumn({ name: 'user_manager_id' })
  userManagerId: number;

  @Column({ type: 'varchar', name: 'manager_uuid' })
  managerUuid: string;

  @Column({ type: 'varchar', name: 'subordinate_uuid' })
  subordinateUuid: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
