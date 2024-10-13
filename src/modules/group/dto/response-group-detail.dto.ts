import { ApiProperty } from '@nestjs/swagger';
import { GroupInfoResponseDto } from './response-group.dto';
import { GroupMemberResponseDto } from './response-group-member.dto';

export class GroupDetailResponseDto extends GroupInfoResponseDto {
  @ApiProperty({
    description: '그룹 멤버 목록',
    type: [GroupMemberResponseDto],
  })
  members: GroupMemberResponseDto[];
}
