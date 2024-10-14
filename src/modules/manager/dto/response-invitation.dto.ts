import { ApiProperty } from '@nestjs/swagger';
import { InvitationStatus } from 'src/entities/manager-invitation.entity';

export class InvitationResponseDto {
  @ApiProperty({ description: '초대 ID' })
  managerInvitationId: number;

  @ApiProperty({ description: '초대자 UUID' })
  managerUuid: string;

  @ApiProperty({ description: '초대자 이름', example: '홍길동' })
  managerName: string;

  @ApiProperty({ description: '초대받은 사용자 UUID' })
  subordinateUuid: string;

  @ApiProperty({ description: '초대 받은 사용자 이름', example: '김철수' })
  subordinateName: string;

  @ApiProperty({ enum: InvitationStatus, description: '초대 상태' })
  status: InvitationStatus;

  @ApiProperty({ description: '초대 생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '초대 상태 최종 업데이트 일시' })
  updatedAt: Date;
}
