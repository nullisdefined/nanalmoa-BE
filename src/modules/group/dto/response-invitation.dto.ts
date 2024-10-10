import { InvitationStatus } from '@/entities/manager-invitation.entity';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { InviteGroupMemberDto } from './invite-group-memeber.dto';

// 초대 응답 DTO
export class RespondToInvitationDto extends PickType(InviteGroupMemberDto, [
  'inviteeUuid',
  'groupId',
] as const) {
  @ApiProperty({ description: '초대 ID', example: 1 })
  invitationId: number;

  @ApiProperty({
    description: '초대 응답 상태',
    enum: InvitationStatus,
    example: InvitationStatus.ACCEPTED,
  })
  @IsEnum(InvitationStatus)
  status: InvitationStatus;

  @ApiProperty({
    description: '초대하는 사용자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  inviterUuid: string;
}
