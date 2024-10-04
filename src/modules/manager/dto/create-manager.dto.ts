import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateManagerSubordinateDto {
  @ApiProperty({ description: '관리자의 UUID' })
  @IsUUID()
  managerUuid: string;

  @ApiProperty({ description: '관리인의 UUID' })
  @IsUUID()
  subordinateUuid: string;
}
