import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvitationStatus } from 'src/entities/manager-invitation.entity';

export class UpdateInvitationStatusDto {
  @ApiProperty({ enum: InvitationStatus, description: '초대 상태' })
  @IsEnum(InvitationStatus)
  status: InvitationStatus;
}
