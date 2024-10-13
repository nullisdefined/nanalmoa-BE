import { ApiProperty } from '@nestjs/swagger';

export class GroupMemberResponseDto {
  @ApiProperty({
    description: '사용자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userUuid: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({ description: '관리자 여부', example: false })
  isAdmin: boolean;

  @ApiProperty({
    description: '그룹 가입 날짜',
    example: '2023-05-20T09:00:00Z',
  })
  joinedAt: Date;
}
