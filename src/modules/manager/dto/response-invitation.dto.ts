import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from 'src/entities/manager-invitation.entity';

export class InvitationResponseDto {
  @ApiProperty({ description: '초대 ID' })
  managerInvitationId: number;

  @ApiProperty({ description: '초대자 UUID' })
  inviterUuid: string;

  @ApiProperty({ description: '초대받은 사용자 UUID' })
  inviteeUuid: string;

  @ApiProperty({ enum: InvitationStatus, description: '초대 상태' })
  status: InvitationStatus;

  @ApiProperty({ description: '초대 만료 날짜' })
  expiredAt: Date;
}
