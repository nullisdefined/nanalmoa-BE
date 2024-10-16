import { InvitationStatus } from '@/entities/manager-invitation.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RespondToInvitationDto {
  @ApiProperty({ description: '초대 ID' })
  invitationId: number;

  @ApiProperty({ description: '그룹 ID' })
  groupId: number;
  @ApiProperty({
    description: '그룹명',
    example: '바게트빵을 좋아하는 사람들의 모임',
  })
  groupName: string;

  @ApiProperty({ description: '초대한 사용자의 UUID' })
  inviterUuid: string;
  @ApiProperty({ description: '초대한 사용자 이름', example: '홍길동' })
  inviterName: string;

  @ApiProperty({ description: '초대받은 사용자의 UUID' })
  inviteeUuid: string;
  @ApiProperty({ description: '초대받은 사용자 이름', example: '김철수' })
  inviteeName: string;

  @ApiProperty({ description: '초대 상태', enum: InvitationStatus })
  status: InvitationStatus;
}
