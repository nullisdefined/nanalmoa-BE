import { Category } from '@/entities/category.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateScheduleDto } from './create-schedule.dto';

export class VoiceScheduleUploadDto {
  @ApiProperty({
    type: 'file',
    description: '음성 파일 (.wav, .mp3 등)',
  })
  audio: Express.Multer.File;

  @ApiProperty({
    example: '2024-09-26T12:45:50Z',
    description: '음성 인식 시점의 현재 날짜',
    type: String,
  })
  @Type(() => Date)
  currentDateTime: Date;
}

export class VoiceScheduleResponseDto extends CreateScheduleDto {
  @ApiProperty({ description: '카테고리 정보' })
  category: Category;

  constructor(partial: Partial<VoiceScheduleResponseDto> = {}) {
    super();
    Object.assign(this, partial);
  }
}
