import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Auth, AuthProvider } from 'src/entities/auth.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
      console.error(
        'Error getting Kakao token:',
        error.response?.data || error.message,
      );
      console.error('Error details:', error);
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
      console.error(
        'Error getting Kakao user info:',
        error.response?.data || error.message,
      );
      throw new UnauthorizedException('카카오 사용자 정보 획득 실패');
    }
  }

  async findOrCreateUser(
    kakaoUser: any,
    kakaoRefreshToken: string,
  ): Promise<User> {
    const { id: oauthId, kakao_account, properties } = kakaoUser;

    let userAuth = await this.authRepository.findOne({
      where: {
        oauth_id: oauthId.toString(),
        auth_provider: AuthProvider.KAKAO,
      },
      relations: ['user'],
    });

    if (userAuth) {
      // 사용자 정보 업데이트
      userAuth.user.name = properties?.nickname || userAuth.user.name;
      userAuth.user.profile_image =
        properties?.profile_image || userAuth.user.profile_image;
      userAuth.user.email = kakao_account?.email || userAuth.user.email;
      userAuth.refresh_token = kakaoRefreshToken;
      await this.userRepository.save(userAuth.user);
      await this.authRepository.save(userAuth);
      return userAuth.user;
    } else {
      // 새 사용자 등록
      const newUser = this.userRepository.create({
        name: properties?.nickname,
        profile_image: properties?.profile_image,
        email: kakao_account?.email,
      });
      await this.userRepository.save(newUser);

      const newUserAuth = this.authRepository.create({
        user: newUser,
        oauth_id: oauthId.toString(),
        auth_provider: AuthProvider.KAKAO,
        refresh_token: kakaoRefreshToken,
      });
      await this.authRepository.save(newUserAuth);

      return newUser;
    }
  }

  generateAccessToken(user: User): string {
    const payload = { sub: user.user_id, email: user.email, name: user.name };
    return this.jwtService.sign(payload);
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
      console.error(
        'Error refreshing Kakao token:',
        error.response?.data || error.message,
      );
      throw new UnauthorizedException('카카오 토큰 갱신 실패');
    }
  }

  async refreshAccessToken(
    userId: number,
    refreshToken: string,
    socialProvider: AuthProvider,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const auth = await this.authRepository.findOne({
      where: {
        user_id: userId,
        refresh_token: refreshToken,
        auth_provider: socialProvider,
      },
      relations: ['user'],
    });

    if (!auth) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    try {
      let socialTokens;
      switch (socialProvider) {
        case AuthProvider.KAKAO:
          socialTokens = await this.refreshKakaoToken(refreshToken);
          break;
        case AuthProvider.NAVER:
          // 네이버 토큰 갱신 로직
          break;
        default:
          throw new UnauthorizedException(
            '지원하지 않는 소셜 프로바이더입니다.',
          );
      }

      // 우리 서비스의 액세스 토큰 생성
      const accessToken = this.generateAccessToken(auth.user);

      // 새 리프레시 토큰을 발급한 경우
      if (socialTokens.refresh_token) {
        auth.refresh_token = socialTokens.refresh_token;
        await this.authRepository.save(auth);
      }

      return {
        accessToken,
        refreshToken: socialTokens.refresh_token,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.authRepository.update(auth.auth_id, { refresh_token: null });
      throw new UnauthorizedException('토큰 갱신에 실패했습니다.');
    }
  }
}
