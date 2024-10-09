import { ApiProperty } from '@nestjs/swagger';
// 그룹원 정보를 반환할 때 사용
export class GroupMemberResponseDto {
  @ApiProperty({
    description: '사용자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userUuid: string;

  @ApiProperty({ description: '관리자 여부', example: false })
  isAdmin: boolean;

  @ApiProperty({
    description: '그룹 가입 날짜',
    example: '2023-05-20T09:00:00Z',
  })
  joinedAt: Date;
}
