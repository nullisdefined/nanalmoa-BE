import { ApiProperty } from '@nestjs/swagger';

export class UserRoutineResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userUuid: string;

  @ApiProperty({ example: '07:00' })
  wakeUpTime: string;

  @ApiProperty({ example: '08:00' })
  breakfastTime: string;

  @ApiProperty({ example: '12:00' })
  lunchTime: string;

  @ApiProperty({ example: '18:00' })
  dinnerTime: string;

  @ApiProperty({ example: '22:00' })
  bedTime: string;
}
