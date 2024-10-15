import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class MonthQueryDto {
  @ApiProperty({
    description: '특정 사용자의 UUID',
    required: false,
  })
  userUuid?: string;

  @ApiProperty({ description: '년도', example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @ApiProperty({ description: '월', example: 9 })
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;
}
