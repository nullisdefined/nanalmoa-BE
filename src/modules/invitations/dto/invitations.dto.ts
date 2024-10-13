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
  @ApiProperty({ description: '초대의 고유 식별자', example: 1 })
  id: number;

  @ApiProperty({
    enum: InvitationsType,
    description: '초대 유형 (그룹 또는 관리자)',
    example: InvitationsType.GROUP,
  })
  type: InvitationsType;

  @ApiProperty({
    enum: InvitationsRole,
    description: '이 초대에서 사용자의 역할',
    example: InvitationsRole.GROUP_ADMIN,
  })
  role: InvitationsRole;

  @ApiProperty({
    description: '초대의 현재 상태',
    example: 'PENDING',
  })
  status: string;

  @ApiProperty({
    description: '초대 생성 일시',
    example: '2023-05-20T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '초대 마지막 업데이트 일시',
    example: '2023-05-20T09:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '초대자의 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  inviterUuid: string;

  @ApiProperty({
    description: '초대자의 이름',
    example: '홍길동',
  })
  inviterName: string;

  @ApiProperty({
    description: '초대받은 사람의 UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  inviteeUuid: string;

  @ApiProperty({
    description: '초대받은 사람의 이름',
    example: '김철수',
  })
  inviteeName: string;

  @ApiProperty({
    description: '관련 그룹의 ID',
    required: false,
    example: 1,
  })
  groupId?: number;

  @ApiProperty({
    description: '관련 그룹의 이름',
    required: false,
    example: '우리 동네 모임',
  })
  groupName?: string;
}
