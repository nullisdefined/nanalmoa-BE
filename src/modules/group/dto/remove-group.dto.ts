import { ApiProperty } from '@nestjs/swagger';
// group admin이 해당 group을 삭제할 때
export class DeleteGroupDto {
  @ApiProperty({ description: '삭제할 그룹 ID', example: 1 })
  groupId: number;
}
