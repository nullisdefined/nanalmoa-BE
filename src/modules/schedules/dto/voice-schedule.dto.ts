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

export class VoiceScheduleResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  userId: number;

  @ApiProperty({
    description: '일정 시작 날짜와 "시간"',
    example: '2024-09-21T09:00:00Z',
    type: Date,
  })
  startDate: Date;

  @ApiProperty({
    description: '일정 종료 날짜와 "시간"',
    example: '2024-09-21T18:00:00Z',
    type: Date,
  })
  endDate: Date;

  @ApiProperty({ description: '일정 제목', example: '주일 예배' })
  title: string;

  @ApiProperty({ description: '장소', example: '동네 교회' })
  place: string;

  @ApiProperty({ description: '종일 옵션', example: false })
  isAllDay: boolean;

  @ApiProperty({ description: '카테고리 ID', example: 4 })
  categoryId: number;
}
