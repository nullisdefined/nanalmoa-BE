import { InvitationStatus } from '@/entities/manager-invitation.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

// 초대 응답 DTO
export class RespondToInvitationDto {
  @ApiProperty({ description: '초대 ID', example: 1 })
  invitationId: number;

  @ApiProperty({
    description: '초대 응답 상태',
    enum: InvitationStatus,
    example: InvitationStatus.ACCEPTED,
  })
  @IsEnum(InvitationStatus)
  status: InvitationStatus;
}
