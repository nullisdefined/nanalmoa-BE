import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetInvitationSendDto {
  @ApiProperty({ description: '관리자의 UUID' })
  @IsUUID()
  @IsNotEmpty()
  managerUuid: string;
}

export class GetInvitationReceivedDto {
  @ApiProperty({ description: '피관리자의 UUID' })
  @IsUUID()
  @IsNotEmpty()
  subordinateUuid: string;
}
