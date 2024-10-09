import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
// group admin이 해당 group을 삭제할 때
export class DeleteGroupDto {
  @ApiProperty({ description: '그룹 ID', example: 1 })
  groupId: number;

  @ApiProperty({
    description: '관리자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  adminUuid: string;
}
