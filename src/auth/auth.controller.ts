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
        socialProvider: provider,
        user: {
          id: user.userUuid,
          email: user.email,
          phoneNumber: user.phoneNumber,
          name: user.name,
          profileImage: user.profileImage,
        },
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
              example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c',
            },
            email: {
              example: 'user@example.com',
            },
            phoneNumber: {
              example: '01012345678',
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
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '네이버 로그인 실패' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
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
              example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c',
            },
            email: {
              example: 'user@example.com',
            },
            phoneNumber: {
              example: '01012345678',
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
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '카카오 로그인 실패' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
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
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '인증 코드 전송 성공',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '인증 코드 전송 실패',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: '인증 코드 전송에 실패했습니다' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: '인증 코드를 받은 전화번호',
        },
        code: {
          type: 'string',
          description: '수신한 인증 코드',
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
          example: '인증 성공',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '유효하지 않은 인증 코드',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: '유효하지 않은 인증 코드입니다.' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  verifyCode(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ) {
    const isValid = this.authService.verifyCode(phoneNumber, code);
    if (!isValid) {
      throw new BadRequestException('유효하지 않은 인증 코드입니다.');
    }
    return { message: '인증 성공' };
  }

  @Post('basic/signup')
  @ApiOperation({ summary: '일반 회원가입' })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '회원가입이 완료되었습니다.' },
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c',
            },
            phoneNumber: { type: 'string', example: '01012345678' },
            name: { type: 'string', example: '홍길동' },
            email: { type: 'string', example: null },
            profileImage: {
              type: 'string',
              example: null,
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async signup(@Body() signupDto: BasicSignupDto) {
    const { phoneNumber, verificationCode, name, email, profileImage } =
      signupDto;

    const user = await this.authService.signupWithPhoneNumber(
      phoneNumber,
      verificationCode,
      name,
      email,
      profileImage,
    );

    return {
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.userUuid,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        profileImage: user.profileImage,
      },
    };
  }

  @Post('basic/login')
  @ApiOperation({ summary: '일반 로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: '발급된 액세스 토큰',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          description: '발급된 리프레시 토큰',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c',
            },
            phoneNumber: { type: 'string', example: '01012345678' },
            name: { type: 'string', example: '홍길동' },
            email: { type: 'string', example: null },
            profileImage: {
              type: 'string',
              example: null,
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: BasicLoginDto) {
    const { phoneNumber, verificationCode } = loginDto;
    if (!this.authService.verifyCode(phoneNumber, verificationCode)) {
      throw new UnauthorizedException('유효하지 않은 인증 코드입니다.');
    }
    const user = await this.authService.validateUserByPhoneNumber(phoneNumber);
    const tokens = await this.authService.loginWithPhoneNumber(user);
    return {
      ...tokens,
      user: {
        id: user.userUuid,
        email: user.email,
        phoneNumber: user.phoneNumber,
        name: user.name,
        profileImage: user.profileImage,
      },
    };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공, 리프레시 토큰은 옵셔널',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '액세스 토큰 갱신 실패' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async refreshToken(@Req() req, @Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedException('인증 토큰이 없습니다.');
      }

      const [, token] = authHeader.split(' ');
      const decodedToken = this.jwtService.decode(token);

      if (!decodedToken || typeof decodedToken === 'string') {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const { sub: userUuid, socialProvider } = decodedToken;

      const newTokens = await this.authService.refreshAccessToken(
        userUuid,
        refreshTokenDto.refreshToken,
        socialProvider,
      );
      return newTokens;
    } catch (error) {
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
