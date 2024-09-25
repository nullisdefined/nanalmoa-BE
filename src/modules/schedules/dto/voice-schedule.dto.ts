import { ApiProperty } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';

export class VoiceScheduleUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '음성 파일 (.wav, .mp3 등)',
  })
  audio: any;

  @ApiProperty({
    example: '2024-09-13 12:45:50',
    description: '음성 인식 시점의 현재 날짜와 시간',
  })
  currentDateTime: string;
}

export class VoiceScheduleConfirmDto extends CreateScheduleDto {
  @ApiProperty({ example: '노인부 찬양 집회 참석', description: '일정 의도' })
  intent: string;
}
