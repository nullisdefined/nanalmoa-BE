import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
// group admin이 새 멤버를 그룹에 초대할 때
export class InviteGroupMemberDto {
  @ApiProperty({ description: '그룹 ID', example: 1 })
  groupId: number;

  @ApiProperty({
    description: '초대할 사용자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  inviteeUuid: string;

  @ApiProperty({
    description: '초대자 UUID (admin)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  inviterUuid: string;
}
