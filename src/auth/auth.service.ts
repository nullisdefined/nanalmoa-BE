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

  private stateStore = new Map<string, number>();

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

  async findOrCreateUser(
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

  generateAccessToken(user: User): string {
    const payload = { sub: user.userId, email: user.email, name: user.name };
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
      // console.error(
      //   'Error refreshing Kakao token:',
      //   error.response?.data || error.message,
      // );
      throw new UnauthorizedException('카카오 토큰 갱신 실패');
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

  async refreshAccessToken(
    userId: number,
    refreshToken: string,
    socialProvider: AuthProvider,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const auth = await this.authRepository.findOne({
      where: {
        userId: userId,
        refreshToken: refreshToken,
        authProvider: socialProvider,
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
          socialTokens = await this.refreshNaverToken(refreshToken);
          break;
        default:
          throw new UnauthorizedException(
            '지원하지 않는 소셜 프로바이더입니다.',
          );
      }

      const accessToken = this.generateAccessToken(auth.user);

      if (socialTokens.refresh_token) {
        auth.refreshToken = socialTokens.refresh_token;
        await this.authRepository.save(auth);
      }

      return {
        accessToken,
        refreshToken: socialTokens.refresh_token,
      };
    } catch (error) {
      // console.error('Token refresh error:', error);
      await this.authRepository.update(auth.authId, { refreshToken: null });
      throw new UnauthorizedException('토큰 갱신에 실패했습니다.');
    }
  }
}
