import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
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
  async naverLogin() {
    // 네이버 로그인 로직
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: '네이버 로그인 콜백' })
  @ApiResponse({ status: 200, description: '네이버 로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async naverLoginCallback(@Req() req) {
    // 네이버 로그인 콜백 처리 로직
  }

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: '카카오 로그인' })
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 페이지로 리다이렉트',
  })
  async kakaoLogin() {
    // 카카오 로그인 로직
  }

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: '카카오 로그인 콜백' })
  @ApiResponse({ status: 200, description: '카카오 로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async kakaoLoginCallback(@Req() req) {
    // 카카오 로그인 콜백 처리 로직
  }

  @Post('refresh')
  @ApiOperation({ summary: '토큰 갱신' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', description: '리프레시 토큰' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async refreshToken(@Body() refreshTokenDto: any) {
    // 토큰 갱신 로직
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Req() req) {
    // 로그아웃 로직
  }
}
