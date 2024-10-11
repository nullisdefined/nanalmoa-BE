import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateUserRoutineDto {
  @ApiProperty({ example: '07:00', description: '기상 시간 (HH:mm 형식)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '올바른 시간 형식이 아닙니다 (HH:mm)',
  })
  wakeUpTime?: string;

  @ApiProperty({ example: '08:00', description: '아침 식사 시간 (HH:mm 형식)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '올바른 시간 형식이 아닙니다 (HH:mm)',
  })
  breakfastTime?: string;

  @ApiProperty({ example: '12:00', description: '점심 식사 시간 (HH:mm 형식)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '올바른 시간 형식이 아닙니다 (HH:mm)',
  })
  lunchTime?: string;

  @ApiProperty({ example: '18:00', description: '저녁 식사 시간 (HH:mm 형식)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '올바른 시간 형식이 아닙니다 (HH:mm)',
  })
  dinnerTime?: string;

  @ApiProperty({ example: '22:00', description: '취침 시간 (HH:mm 형식)' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '올바른 시간 형식이 아닙니다 (HH:mm)',
  })
  bedTime?: string;
}
