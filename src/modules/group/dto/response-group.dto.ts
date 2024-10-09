import { ApiProperty } from '@nestjs/swagger';
// 그룹 정보를 반환할 때 사용
export class GroupInfoResponseDto {
  @ApiProperty({ description: '그룹 ID', example: 1 })
  groupId: number;

  @ApiProperty({ description: '그룹 이름', example: '우리 동네 모임' })
  groupName: string;

  @ApiProperty({
    description: '그룹 생성 날짜',
    example: '2023-05-20T09:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({ description: '그룹원 수', example: 5 })
  memberCount: number;

  @ApiProperty({ description: '관리자 여부', example: true })
  isAdmin: boolean;
}
