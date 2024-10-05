import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: '사용자의 UUID' })
  userUuid: string;

  @ApiProperty({ description: '사용자의 이름' })
  name: string;

  @ApiProperty({ description: '사용자의 프로필 이미지 URL' })
  profileImage: string;

  @ApiProperty({ description: '사용자의 이메일 주소' })
  email: string;

  @ApiProperty({ description: '사용자의 관리자 여부' })
  isManager: boolean;

  constructor(user: Partial<UserResponseDto>) {
    Object.assign(this, user);
  }
}
