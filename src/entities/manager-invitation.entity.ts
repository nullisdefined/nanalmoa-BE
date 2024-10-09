import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvitationStatus {
  PENDING = 'PENDING', // 초대가 발송되었지만, 아직 응답하지 않은 상태
  ACCEPTED = 'ACCEPTED', // 초대가 수락되어 매니저로 등록된 상태
  REJECTED = 'REJECTED', // 초대가 거절된 상태
  CANCELED = 'CANCELED', // 초대가 철회된 상태
  REMOVED = 'REMOVED', // 등록된 매니저가 삭제된 상태 (매니저 테이블에서 제거됨)
}
// 1. 상수화 코드 작성
// 2. 지금처럼 (광훈님 선호방식)
// 추천 : ManagerInvitation이 그룹핑으로 관리되었으면 좋겠다. 지금은 일단 진행
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
