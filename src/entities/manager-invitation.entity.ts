import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('manager_invitation')
export class ManagerInvitation {
  @PrimaryGeneratedColumn({ name: 'manager_invitation_id' })
  managerInvitationId: number;

  @Column({ name: 'manager_uuid', type: 'varchar' })
  managerUuid: string;

  @Column({ name: 'subordinate_uuid', type: 'varchar' })
  subordinateUuid: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({
    name: 'expired_at',
    type: 'timestamp',
  })
  expiredAt: Date;
}
