import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Auth, AuthProvider } from 'src/entities/auth.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CoolSmsService } from './coolsms.service';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly coolSmsService: CoolSmsService,
  ) {}

  private stateStore = new Map<string, number>();
  private verificationCodes: Map<
    string,
    { code: string; expiresAt: Date; isVerified: boolean }
  > = new Map();

  async signupWithPhoneNumber(
    phoneNumber: string,
    verificationCode: string,
    name?: string,
    email?: string,
    profileImage?: string,
  ): Promise<User> {
    const storedData = this.verificationCodes.get(phoneNumber);
    if (!storedData || !storedData.isVerified) {
      throw new BadRequestException('전화번호 인증이 필요합니다.');
    }

    if (storedData.code !== verificationCode) {
      throw new BadRequestException('유효하지 않은 인증 코드입니다.');
    }

    if (new Date() > storedData.expiresAt) {
      this.verificationCodes.delete(phoneNumber);
      throw new BadRequestException('인증 코드가 만료되었습니다.');
    }

    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 전화번호입니다.');
    }

    const newUser = this.userRepository.create({
      userUuid: uuidv4(),
      phoneNumber,
      name,
      email,
      profileImage,
    });
    await this.userRepository.save(newUser);

    const newAuth = this.authRepository.create({
      user: newUser,
      authProvider: AuthProvider.BASIC,
    });
    await this.authRepository.save(newAuth);

    this.verificationCodes.delete(phoneNumber);

    return newUser;
  }

  async validateUserByPhoneNumber(phoneNumber: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new UnauthorizedException('등록되지 않은 전화번호입니다.');
    }
    return user;
  }

  async loginWithPhoneNumber(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.userUuid, socialProvider: AuthProvider.BASIC };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_BASIC_REFRESH_EXPIRATION'),
    });

    const auth = await this.authRepository.findOne({
      where: {
        user: { userUuid: user.userUuid },
        authProvider: AuthProvider.BASIC,
      },
    });
    auth.refreshToken = refreshToken;
    await this.authRepository.save(auth);

    return { accessToken, refreshToken };
  }

  private generateVerificationCode(): string {
    return Math.random().toString().slice(2, 8);
  }

  async sendVerificationCode(phoneNumber: string): Promise<boolean> {
    const verificationCode = this.generateVerificationCode();
    const expirationMinutes = 5;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60000);

    this.verificationCodes.set(phoneNumber, {
      code: verificationCode,
      expiresAt,
      isVerified: false,
    });

    try {
      const result = await this.coolSmsService.sendVerificationCode(
        phoneNumber,
        verificationCode,
        expirationMinutes,
      );
      return result;
    } catch (error) {
      console.error('인증 코드 전송 실패:', error);
      return false;
    }
  }

  verifyCode(phoneNumber: string, code: string): boolean {
    const storedData = this.verificationCodes.get(phoneNumber);
    if (storedData && storedData.code === code) {
      if (new Date() <= storedData.expiresAt) {
        this.verificationCodes.set(phoneNumber, {
          ...storedData,
          isVerified: true,
        });
        return true;
      } else {
        console.log('인증 코드가 만료되었습니다.');
        this.verificationCodes.delete(phoneNumber);
      }
    }
    return false;
  }

  private async refreshBasicToken(
    user: User,
  ): Promise<{ refreshToken: string }> {
    const payload = { sub: user.userUuid, phoneNumber: user.phoneNumber };
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_BASIC_REFRESH_EXPIRATION'),
    });
    return { refreshToken };
  }

  async getNaverToken(
    code: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const tokenUrl = 'https://nid.naver.com/oauth2.0/token';
    const params = {
      grant_type: 'authorization_code',
      client_id: this.configService.get('NAVER_CLIENT_ID'),
      client_secret: this.configService.get('NAVER_CLIENT_SECRET'),
      redirect_uri: this.configService.get('NAVER_REDIRECT_URI'),
      code,
    };

    try {
      const response = await axios.post(tokenUrl, null, { params });
      // console.log('*** response.data: ', response.data);
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error) {
      // console.error(
      //   'Error getting Naver token:',
      //   error.response?.data || error.message,
      // );
      throw new UnauthorizedException('네이버 토큰 획득 실패');
    }
  }

  async getNaverUserInfo(accessToken: string): Promise<any> {
    const userInfoUrl = 'https://openapi.naver.com/v1/nid/me';
    // console.log('*** accessToken: ', accessToken);
    try {
      const response = await axios.get(userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.response;
    } catch (error) {
      // console.error(
      //   'Error getting Naver user info:',
      //   error.response?.data || error.message,
      // );
      throw new UnauthorizedException('네이버 사용자 정보 획득 실패');
    }
  }

  async refreshNaverToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token?: string }> {
    const tokenUrl = 'https://nid.naver.com/oauth2.0/token';
    const params = {
      grant_type: 'refresh_token',
      client_id: this.configService.get('NAVER_CLIENT_ID'),
      client_secret: this.configService.get('NAVER_CLIENT_SECRET'),
      refresh_token: refreshToken,
    };

    try {
      const response = await axios.post(tokenUrl, null, { params });
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error) {
      // console.error(
      //   'Error refreshing Naver token:',
      //   error.response?.data || error.message,
      // );
      throw new UnauthorizedException('네이버 토큰 갱신 실패');
    }
  }

  async getKakaoToken(
    code: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    const params = {
      grant_type: 'authorization_code',
      client_id: this.configService.get('KAKAO_CLIENT_ID'),
      client_secret: this.configService.get('KAKAO_CLIENT_SECRET'),
      redirect_uri: this.configService.get('KAKAO_REDIRECT_URI'),
      code,
    };

    try {
      // console.log('Requesting Kakao token with params:', params);
      const response = await axios.post(tokenUrl, null, { params });
      // console.log('Kakao token response:', response.data);
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error) {
      // console.error(
      //   'Error getting Kakao token:',
      //   error.response?.data || error.message,
      // );
      // console.error('Error details:', error);
      throw new UnauthorizedException('카카오 토큰 획득 실패');
    }
  }

  async getKakaoUserInfo(accessToken: string): Promise<any> {
    const userInfoUrl = 'https://kapi.kakao.com/v2/user/me';
    try {
      const response = await axios.get(userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      // console.error(
      //   'Error getting Kakao user info:',
      //   error.response?.data || error.message,
      // );
      throw new UnauthorizedException('카카오 사용자 정보 획득 실패');
    }
  }

  async refreshKakaoToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token?: string }> {
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    const params = {
      grant_type: 'refresh_token',
      client_id: this.configService.get('KAKAO_CLIENT_ID'),
      client_secret: this.configService.get('KAKAO_CLIENT_SECRET'),
      refresh_token: refreshToken,
    };

    try {
      const response = await axios.post(tokenUrl, null, { params });
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token, // 새 리프레시 토큰 발급
      };
    } catch (error) {
      // console.error(
      //   'Error refreshing Kakao token:',
      //   error.response?.data || error.message,
      // );
      throw new UnauthorizedException('카카오 토큰 갱신 실패');
    }
  }

  async findOrCreateSocialUser(
    socialUser: any,
    refreshToken: string,
    provider: AuthProvider,
  ): Promise<User> {
    let oauthId, name, email, profileImage;

    if (provider === AuthProvider.KAKAO) {
      oauthId = socialUser.id.toString();
      name = socialUser.properties?.nickname;
      email = socialUser.kakao_account?.email;
      profileImage = socialUser.properties?.profile_image;
    } else if (provider === AuthProvider.NAVER) {
      oauthId = socialUser.id;
      name = socialUser.name;
      email = socialUser.email;
      profileImage = socialUser.profile_image;
    } else {
      throw new UnauthorizedException('지원하지 않는 소셜 프로바이더입니다.');
    }

    let userAuth = await this.authRepository.findOne({
      where: {
        oauthId: oauthId,
        authProvider: provider,
      },
      relations: ['user'],
    });

    if (userAuth) {
      // 사용자 정보 업데이트
      userAuth.user.name = name || userAuth.user.name;
      userAuth.user.profileImage = profileImage || userAuth.user.profileImage;
      userAuth.user.email = email || userAuth.user.email;
      userAuth.refreshToken = refreshToken;
      await this.userRepository.save(userAuth.user);
      await this.authRepository.save(userAuth);
      return userAuth.user;
    } else {
      // 새 사용자 등록
      const newUser = this.userRepository.create({
        userUuid: uuidv4(),
        name,
        profileImage: profileImage,
        email,
      });
      await this.userRepository.save(newUser);

      const newUserAuth = this.authRepository.create({
        user: newUser,
        oauthId: oauthId,
        authProvider: provider,
        refreshToken: refreshToken,
      });
      await this.authRepository.save(newUserAuth);

      return newUser;
    }
  }

  generateAccessToken(user: User, socialProvider: AuthProvider): string {
    const payload = {
      sub: user.userUuid,
      socialProvider: socialProvider,
    };
    return this.jwtService.sign(payload);
  }

  async refreshAccessToken(
    userUuid: string,
    refreshToken: string,
    socialProvider: AuthProvider,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const user = await this.userRepository.findOne({
      where: { userUuid },
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const auth = await this.authRepository.findOne({
      where: { user: { userUuid }, authProvider: socialProvider },
    });

    if (!auth || auth.refreshToken !== refreshToken) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    try {
      let newTokens;
      switch (socialProvider) {
        case AuthProvider.BASIC:
          newTokens = await this.refreshBasicToken(user);
          break;
        case AuthProvider.NAVER:
          newTokens = await this.refreshNaverToken(refreshToken);
          break;
        case AuthProvider.KAKAO:
          newTokens = await this.refreshKakaoToken(refreshToken);
          break;
        default:
          throw new UnauthorizedException(
            '지원하지 않는 소셜 프로바이더입니다.',
          );
      }

      const accessToken = this.generateAccessToken(user, socialProvider);

      if (newTokens.refresh_token) {
        auth.refreshToken = newTokens.refresh_token;
        await this.authRepository.save(auth);
      }

      return {
        accessToken,
        refreshToken: newTokens.refresh_token,
      };
    } catch (error) {
      await this.authRepository.update(auth.authId, { refreshToken: null });
      throw new UnauthorizedException('토큰 갱신에 실패했습니다.');
    }
  }
}
