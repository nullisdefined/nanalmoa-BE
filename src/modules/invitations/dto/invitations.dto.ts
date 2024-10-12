import { ApiProperty } from '@nestjs/swagger';

export enum InvitationsType {
  GROUP = 'group',
  MANAGER = 'manager',
}

export enum InvitationsRole {
  MANAGER = 'MANAGER',
  SUBORDINATE = 'SUBORDINATE',
  GROUP_ADMIN = 'GROUP_ADMIN',
  GROUP_MEMBER = 'GROUP_MEMBER',
}

export class InvitationsDto {
  @ApiProperty({ description: '초대의 고유 식별자' })
  id: number;

  @ApiProperty({
    enum: InvitationsType,
    description: '초대 유형 (그룹 또는 관리자)',
  })
  type: InvitationsType;

  @ApiProperty({
    enum: InvitationsRole,
    description: '이 초대에서 사용자의 역할',
  })
  role: InvitationsRole;

  @ApiProperty({ description: '초대의 현재 상태' })
  status: string;

  @ApiProperty({ description: '초대 생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '초대 마지막 업데이트 일시' })
  updatedAt: Date;

  @ApiProperty({ description: '초대자의 UUID' })
  inviterUuid: string;

  @ApiProperty({ description: '초대받은 사람의 UUID' })
  inviteeUuid: string;

  @ApiProperty({ description: '관련 그룹의 ID', required: false })
  groupId?: number;

  @ApiProperty({ description: '관련 그룹의 이름', required: false })
  groupName?: string;
}
