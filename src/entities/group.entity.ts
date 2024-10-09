import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserGroup } from './user-group.entity';
import { GroupSchedule } from './group-schedule.entity';
import { GroupInvitation } from './group-invitation.entity';

@Entity() // 그룹 엔티티
export class Group {
  @PrimaryGeneratedColumn({
    name: 'group_id',
  })
  groupId: number;

  @Column({ name: 'groupName' })
  groupName: string;

  @OneToMany(() => UserGroup, (userGroup) => userGroup.group)
  userGroups: UserGroup[];

  @OneToMany(() => GroupSchedule, (groupSchedule) => groupSchedule.group)
  groupSchedules: GroupSchedule[];

  @OneToMany(() => GroupInvitation, (invitation) => invitation.group)
  invitations: GroupInvitation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
