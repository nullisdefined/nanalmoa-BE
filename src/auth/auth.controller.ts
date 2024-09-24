import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthProvider } from 'src/entities/auth.entity';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: '일반 회원가입' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: '사용자 이메일' },
        password: { type: 'string', description: '사용자 비밀번호' },
        name: { type: 'string', description: '사용자 이름' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async signup(@Body() signupDto: any) {
    // 회원가입 로직
  }

  @Post('login')
  @ApiOperation({ summary: '일반 로그인' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: '사용자 이메일' },
        password: { type: 'string', description: '사용자 비밀번호' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: any) {
    // 로그인 로직
  }

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: '네이버 로그인' })
  @ApiResponse({
    status: 302,
    description: '네이버 로그인 페이지로 리다이렉트',
  })
  async naverLogin() {}

  @Get('naver/callback')
  @ApiOperation({ summary: '네이버 로그인 콜백' })
  @ApiQuery({
    name: 'code',
    required: true,
    type: String,
    description: '네이버 인가 코드',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    type: String,
    description: '상태 값',
  })
  @ApiResponse({
    status: 200,
    description: '네이버 로그인 인증 성공',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: '발급된 액세스 토큰',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        },
        refreshToken: {
          type: 'string',
          description: '발급된 리프레시 토큰',
          example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
        },
        socialProvider: {
          type: 'string',
          description: '소셜 프로바이더',
          example: 'naver',
        },
        user: {
          type: 'object',
          properties: {
            id: {
              example: 1,
            },
            email: {
              example: 'user@example.com',
            },
            name: {
              example: '홍길동',
            },
            profileImage: {
              example: 'https://example.com/profile.jpg',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async naverLoginCallback(@Query('code') code: string) {
    try {
      if (!code) {
        throw new UnauthorizedException('인가 코드가 없습니다.');
      }

      const naverTokens = await this.authService.getNaverToken(code);
      const naverUser = await this.authService.getNaverUserInfo(
        naverTokens.access_token,
      );

      const user = await this.authService.findOrCreateUser(
        naverUser,
        naverTokens.refresh_token,
        AuthProvider.NAVER,
      );
      const accessToken = this.authService.generateAccessToken(user);

      return {
        accessToken,
        refreshToken: naverTokens.refresh_token,
        socialProvider: AuthProvider.NAVER,
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          profileImage: user.profile_image,
        },
      };
    } catch (error) {
      console.error('Naver login error:', error);
      throw new UnauthorizedException('네이버 로그인 실패');
    }
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: '카카오 로그인' })
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 페이지로 리다이렉트',
  })
  async kakaoLogin() {}

  @Get('kakao/callback')
  @ApiOperation({ summary: '카카오 로그인 콜백' })
  @ApiQuery({
    name: 'code',
    required: true,
    type: String,
    description: '카카오 인가 코드',
  })
  @ApiResponse({
    status: 200,
    description: '카카오 로그인 인증 성공',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: '발급된 액세스 토큰',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        },
        refreshToken: {
          type: 'string',
          description: '발급된 리프레시 토큰',
          example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
        },
        socialProvider: {
          type: 'string',
          description: '소셜 프로바이더',
          example: 'kakao',
        },
        user: {
          type: 'object',
          properties: {
            id: {
              example: 1,
            },
            email: {
              example: 'user@example.com',
            },
            name: {
              example: '홍길동',
            },
            profileImage: {
              example: 'https://example.com/profile.jpg',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async kakaoLoginCallback(@Query('code') code: string) {
    try {
      if (!code) {
        throw new UnauthorizedException('인가 코드가 없습니다.');
      }

      const kakaoTokens = await this.authService.getKakaoToken(code);
      const kakaoUser = await this.authService.getKakaoUserInfo(
        kakaoTokens.access_token,
      );

      const user = await this.authService.findOrCreateUser(
        kakaoUser,
        kakaoTokens.refresh_token,
        AuthProvider.KAKAO,
      );
      const accessToken = this.authService.generateAccessToken(user);

      return {
        accessToken,
        refreshToken: kakaoTokens.refresh_token,
        socialProvider: AuthProvider.KAKAO,
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          profileImage: user.profile_image,
        },
      };
    } catch (error) {
      console.error('Kakao login error:', error);
      throw new UnauthorizedException('카카오 로그인 실패');
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  @ApiBody({ type: RefreshTokenDto, description: '리프레시 토큰 정보' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공, 리프레시 토큰은 옵셔널',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        },
        refreshToken: {
          example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const newAccessToken = await this.authService.refreshAccessToken(
        refreshTokenDto.userId,
        refreshTokenDto.refreshToken,
        refreshTokenDto.socialProvider,
      );
      return { ...newAccessToken };
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new UnauthorizedException('액세스 토큰 갱신 실패');
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Req() req) {
    // 로그아웃 로직
  }
}
