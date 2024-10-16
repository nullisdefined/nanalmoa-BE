import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
