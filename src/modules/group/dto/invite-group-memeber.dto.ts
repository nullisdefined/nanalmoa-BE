import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, IsArray } from 'class-validator';

export class InviteGroupMemberDto {
  @ApiProperty({ description: '그룹 ID', example: 1 })
  @IsNumber()
  groupId: number;

  @ApiProperty({
    description: '초대받는 사용자들의 UUID 리스트',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  inviteeUuids: string[];
}
