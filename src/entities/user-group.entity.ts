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

@Entity('user_group') // 사용자와 그룹 간의 관계를 나타내는 중간 테이블
// 사용자가 그룹의 관리자인지 여부(isAdmin)도 저장
export class UserGroup {
  @PrimaryGeneratedColumn({ name: 'user_group_id' })
  userGroupId: number;

  @Column()
  user_uuid: string;

  @ManyToOne(() => Group, (group) => group.userGroups)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ default: false, name: 'is_admin' })
  isAdmin: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
