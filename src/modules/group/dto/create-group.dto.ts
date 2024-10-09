import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
// 새 그룹 생성 시 사용
export class CreateGroupDto {
  @ApiProperty({ description: '그룹 이름', example: '우리 동네 모임' })
  @IsString()
  groupName: string;

  @ApiProperty({
    description: '그룹 생성자 UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  creatorUuid: string;
}
