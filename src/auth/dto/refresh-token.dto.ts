import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AuthProvider } from 'src/entities/auth.entity';

export class RefreshTokenDto {
  @ApiProperty({ description: '사용자 ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: '리프레시 토큰',
    example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;

  @ApiProperty({
    description: '소셜 로그인 프로바이더',
    enum: AuthProvider,
    example: AuthProvider.KAKAO,
  })
  @IsNotEmpty()
  @IsString()
  socialProvider: AuthProvider;
}
