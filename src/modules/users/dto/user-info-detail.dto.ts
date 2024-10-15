import { ApiProperty } from '@nestjs/swagger';

export class UserInfo {
  @ApiProperty({
    description: '사용자 UUID',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  uuid: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  name: string;

  @ApiProperty({ description: '사용자 이메일', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: '사용자 전화번호', example: '010-1234-5678' })
  phoneNumber: string;

  @ApiProperty({
    description: '사용자 프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
  })
  profileImageUrl: string;
}
