import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from '@/entities/manager-invitation.entity';

export class GroupInvitationDetailDto {
  @ApiProperty({
    description: '초대한 사용자의 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  inviterUuid: string;

  @ApiProperty({
    description: '초대한 사용자의 이름',
    example: '홍길동',
  })
  inviterName: string;

  @ApiProperty({
    description: '초대받은 사용자의 UUID',
    example: '223e4567-e89b-12d3-a456-426614174001',
  })
  inviteeUuid: string;

  @ApiProperty({
    description: '초대받은 사용자의 이름',
    example: '김철수',
  })
  inviteeName: string;

  @ApiProperty({
    description: '그룹 이름',
    example: '우리 동네 모임',
  })
  groupName: string;

  @ApiProperty({
    description: '그룹 ID',
    example: 1,
  })
  groupId: number;

  @ApiProperty({
    description: '초대 상태',
    enum: InvitationStatus,
    example: InvitationStatus.PENDING,
  })
  status: InvitationStatus;
}
