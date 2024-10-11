import { InvitationStatus } from '@/entities/manager-invitation.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RespondToInvitationDto {
  @ApiProperty({ description: '초대 ID' })
  invitationId: number;

  @ApiProperty({ description: '그룹 ID' })
  groupId: number;

  @ApiProperty({ description: '초대한 사용자의 UUID' })
  inviterUuid: string;

  @ApiProperty({ description: '초대받은 사용자의 UUID' })
  inviteeUuid: string;

  @ApiProperty({ description: '초대 상태', enum: InvitationStatus })
  status: InvitationStatus;
}
