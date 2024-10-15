import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Req,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthProvider } from 'src/entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BasicSignupDto } from './dto/basic-signup.dto';
import { BasicLoginDto } from './dto/basic-login.dto';
import {
  BasicLoginResponseSchema,
  BasicSignupResponseSchema,
  KakaoLoginResponseSchema,
  NaverLoginResponseSchema,
  RefreshTokenResponseSchema,
  SendVerificationCodeResponseSchema,
  SendVerificationCodeErrorSchema,
  VerifyCodeResponseSchema,
  VerifyCodeErrorSchema,
  RefreshTokenErrorSchema,
  NaverTokenResponseSchema,
  KakaoTokenResponseSchema,
  RefreshBasicTokenResponseSchema,
  RefreshNaverTokenResponseSchema,
  RefreshKakaoTokenResponseSchema,
  RefreshAccessTokenResponseSchema,
} from './schema/response.schema';
import { VerifyCodeDto } from './dto/verify-code.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: '백엔드에서 네이버 로그인' })
  @ApiResponse({
    status: 302,
    description: '네이버 로그인 페이지로 리다이렉트',
  })
  async naverLogin() {}

  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  @ApiOperation({ summary: '백엔드에서 카카오 로그인' })
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 페이지로 리다이렉트',
  })
  async kakaoLogin() {}

  private async handleSocialLogin(code: string, provider: AuthProvider) {
    if (!code) {
      throw new UnauthorizedException('인가 코드가 없습니다.');
    }

    try {
      const socialTokens =
        provider === AuthProvider.NAVER
          ? await this.authService.getNaverToken(code)
          : await this.authService.getKakaoToken(code);

      const socialUser =
        provider === AuthProvider.NAVER
          ? await this.authService.getNaverUserInfo(socialTokens.access_token)
          : await this.authService.getKakaoUserInfo(socialTokens.access_token);

      const user = await this.authService.findOrCreateSocialUser(
        socialUser,
        socialTokens.refresh_token,
        provider,
      );
      const accessToken = this.authService.generateAccessToken(user, provider);

      return {
        accessToken,
        refreshToken: socialTokens.refresh_token,
      };
    } catch (error) {
      console.error(`${provider} login error:`, error);
      throw new UnauthorizedException(`${provider} 로그인 실패`);
    }
  }

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
    schema: NaverLoginResponseSchema,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async naverLoginCallback(@Query('code') code: string) {
    return this.handleSocialLogin(code, AuthProvider.NAVER);
  }

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
    schema: KakaoLoginResponseSchema,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async kakaoLoginCallback(@Query('code') code: string) {
    return this.handleSocialLogin(code, AuthProvider.KAKAO);
  }

  @Post('sms/send')
  @ApiOperation({ summary: 'SMS 인증 코드 전송' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: '인증 코드를 받을 전화번호',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '인증 코드 전송 성공',
    schema: SendVerificationCodeResponseSchema,
  })
  @ApiResponse({
    status: 500,
    description: '인증 코드 전송 실패',
    schema: SendVerificationCodeErrorSchema,
  })
  async sendVerificationCode(@Body('phoneNumber') phoneNumber: string) {
    const result = await this.authService.sendVerificationCode(phoneNumber);
    if (!result) {
      throw new InternalServerErrorException('인증 코드 전송에 실패했습니다');
    }
    return { message: '인증 코드 전송 성공' };
  }

  @Post('sms/verify')
  @ApiOperation({ summary: 'SMS 인증 코드 확인' })
  @ApiResponse({
    status: 200,
    description: '인증 성공',
    schema: VerifyCodeResponseSchema,
  })
  @ApiResponse({
    status: 400,
    description: '유효하지 않은 인증 코드',
    schema: VerifyCodeErrorSchema,
  })
  verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    const { phoneNumber, code } = verifyCodeDto;
    return this.authService.verifyCode(phoneNumber, code);
  }

  @Post('basic/signup')
  @ApiOperation({ summary: '일반 회원가입' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공 및 로그인 상태(토큰 발행)',
    schema: BasicSignupResponseSchema,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async signup(@Body() signupDto: BasicSignupDto) {
    const { phoneNumber, verificationCode, name, email, profileImage } =
      signupDto;

    await this.authService.verifyCode(phoneNumber, verificationCode);

    this.authService.invalidateVerificationCode(phoneNumber);

    return await this.authService.signupWithPhoneNumber(
      phoneNumber,
      name,
      email,
      profileImage,
    );
  }

  @Post('basic/login')
  @ApiOperation({ summary: '일반 로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: BasicLoginResponseSchema,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: BasicLoginDto) {
    const { phoneNumber, verificationCode } = loginDto;
    await this.authService.verifyCode(phoneNumber, verificationCode);
    const user = await this.authService.validateUserByPhoneNumber(phoneNumber);
    const tokens = await this.authService.loginWithPhoneNumber(user);
    return {
      ...tokens,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공, 리프레시 토큰은 옵셔널',
    schema: RefreshAccessTokenResponseSchema,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: RefreshTokenErrorSchema,
  })
  async refreshToken(@Req() req, @Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new BadRequestException('인증 토큰이 없습니다.');
      }

      const [, token] = authHeader.split(' ');

      const decodedToken = this.jwtService.decode(token);

      if (!decodedToken || typeof decodedToken === 'string') {
        throw new BadRequestException('유효하지 않은 토큰 형식입니다.');
      }

      const { sub: userUuid, socialProvider } = decodedToken;

      try {
        this.jwtService.verify(token);
      } catch (error) {
        if (error.name !== 'TokenExpiredError') {
          throw new UnauthorizedException('유효하지 않은 토큰입니다.');
        }
      }

      const newTokens = await this.authService.refreshAccessToken(
        userUuid,
        refreshTokenDto.refreshToken,
        socialProvider,
      );
      return newTokens;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new UnauthorizedException('액세스 토큰 갱신 실패');
    }
  }

  @Post('email/send')
  @ApiOperation({ summary: '이메일 인증 코드 전송' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: '인증 코드를 받을 이메일 주소',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '인증 코드 전송 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '인증 코드가 이메일로 전송되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 이메일 형식',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '잘못된 이메일 형식입니다.' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async sendEmailVerification(@Body('email') email: string) {
    return this.authService.sendEmailVerification(email);
  }

  @Post('email/verify')
  @ApiOperation({ summary: '이메일 인증 코드 확인' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: '인증 코드를 받은 이메일 주소',
        },
        code: {
          type: 'string',
          description: '이메일로 받은 인증 코드',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '인증 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '이메일이 성공적으로 인증되었습니다.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 인증 코드',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '잘못된 인증 코드입니다.' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async verifyEmailCode(
    @Body('email') email: string,
    @Body('code') code: string,
  ) {
    return this.authService.verifyEmailCode(email, code);
  }
}
