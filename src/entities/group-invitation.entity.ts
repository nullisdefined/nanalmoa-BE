import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { InvitationStatus } from './manager-invitation.entity';

@Entity('group_invitation') // 그룹 초대용
export class GroupInvitation {
  @PrimaryGeneratedColumn({
    name: 'group_invitation_id',
  })
  groupInvitationId: number;

  @ManyToOne(() => Group, (group) => group.invitations)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'inviter_uuid' })
  inviterUuid: string;

  @Column({ name: 'invitee_uuid' })
  inviteeUuid: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
