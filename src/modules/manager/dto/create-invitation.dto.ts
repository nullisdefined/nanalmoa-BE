import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsUUID, IsDate, IsOptional } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    description: '초대하는 사용자의 UUID',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  @IsUUID()
  managerUuid: string;

  @ApiProperty({
    description: '초대할 사용자의 UUID',
    example: '2b0d7b3d-9bdd-4bad-3b7d-9b1deb4dcb6d',
  })
  @IsUUID()
  subordinateUuid: string;

  @ApiProperty({ description: '초대 로그 만료 날짜', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date) // 문자열을 Date 객체로 자동 변환
  expiredAt?: Date;
}
