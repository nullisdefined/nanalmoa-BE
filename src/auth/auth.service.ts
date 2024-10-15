import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Auth, AuthProvider } from 'src/entities/auth.entity';
import { User } from 'src/entities/user.entity';
import { MoreThan, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CoolSmsService } from './coolsms.service';
import { ConfigService } from '@nestjs/config';
import {
  BasicSignupResponseDto,
  KakaoTokenResponseDto,
  LoginWithPhoneNumberResponseDto,
  NaverTokenResponseDto,
  RefreshAccessTokenResponseDto,
  RefreshBasicTokenResponseDto,
  RefreshKakaoTokenResponseDto,
  RefreshNaverTokenResponseDto,
} from './dto/response.dto';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
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
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  private verificationCodes: Map<
    string,
    { code: string; expiresAt: Date; isVerified: boolean }
  > = new Map();
  private transporter: nodemailer.Transporter;
  private emailVerificationCodes: Map<
    string,
    { code: string; expiresAt: Date }
  > = new Map();
  private verifiedPhoneNumbers: Map<string, Date> = new Map();
  private verifiedEmails: Map<string, Date> = new Map();

  setPhoneNumberVerified(phoneNumber: string): void {
    this.verifiedPhoneNumbers.set(phoneNumber, new Date());
  }

  setEmailVerified(email: string): void {
    this.verifiedEmails.set(email, new Date());
  }

  isPhoneNumberVerified(phoneNumber: string): boolean {
    const verifiedAt = this.verifiedPhoneNumbers.get(phoneNumber);
    if (!verifiedAt) return false;

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return verifiedAt > tenMinutesAgo;
  }

  isEmailVerified(email: string): boolean {
    return this.isVerified(this.verifiedEmails, email);
  }

  private isVerified(verificationMap: Map<string, Date>, key: string): boolean {
    const verifiedAt = verificationMap.get(key);
    if (!verifiedAt) {
      return false;
    }

    // 인증 후 10분이 지나지 않았는지 확인
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (verifiedAt > tenMinutesAgo) {
      return true;
    }

    // 10분이 지났다면 인증 정보 삭제
    verificationMap.delete(key);
    return false;
  }

  async signupWithPhoneNumber(
    phoneNumber: string,
    name?: string,
    email?: string,
    profileImage?: string,
  ): Promise<BasicSignupResponseDto> {
    if (!this.isPhoneNumberVerified(phoneNumber)) {
      throw new BadRequestException('전화번호 인증이 필요합니다.');
    }

    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 전화번호입니다.');
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
      userUuid: newUser.userUuid,
      authProvider: AuthProvider.BASIC,
    });
    await this.authRepository.save(newAuth);

    this.verifiedPhoneNumbers.delete(phoneNumber);

    const { accessToken, refreshToken } =
      await this.loginWithPhoneNumber(newUser);

    return {
      accessToken,
      refreshToken,
    };
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
  ): Promise<LoginWithPhoneNumberResponseDto> {
    const payload = { sub: user.userUuid, socialProvider: AuthProvider.BASIC };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_BASIC_REFRESH_EXPIRATION'),
    });

    const auth = await this.authRepository.findOne({
      where: {
        userUuid: user.userUuid,
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
    const now = new Date();
    const storedData = this.verificationCodes.get(phoneNumber);

    // 최근 1분 이내에 발송된 코드가 있는지 확인
    if (
      storedData &&
      now.getTime() - storedData.expiresAt.getTime() < -4 * 60 * 1000
    ) {
      throw new BadRequestException('1분 후에 다시 시도해주세요.');
    }

    const verificationCode = this.generateVerificationCode();
    const expirationMinutes = 5;
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);

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
      // 전송 실패 시 저장된 코드 삭제
      this.verificationCodes.delete(phoneNumber);
      return false;
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<void> {
    const storedData = this.verificationCodes.get(phoneNumber);
    if (!storedData) {
      throw new UnauthorizedException('유효하지 않은 인증 코드입니다.');
    }
    if (storedData.code !== code) {
      throw new UnauthorizedException('유효하지 않은 인증 코드입니다.');
    }
    if (new Date() > storedData.expiresAt) {
      throw new UnauthorizedException('유효하지 않은 인증 코드입니다.');
    }

    this.setPhoneNumberVerified(phoneNumber);
    this.verificationCodes.set(phoneNumber, {
      ...storedData,
      isVerified: true,
    });
  }

  invalidateVerificationCode(phoneNumber: string): void {
    this.verificationCodes.delete(phoneNumber);
  }

  private async refreshBasicToken(
    user: User,
  ): Promise<RefreshBasicTokenResponseDto> {
    const payload = { sub: user.userUuid, phoneNumber: user.phoneNumber };
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_BASIC_REFRESH_EXPIRATION'),
    });
    return { refreshToken };
  }

  async getNaverToken(code: string): Promise<NaverTokenResponseDto> {
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
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('네이버 토큰 획득에 실패했습니다.');
    }
  }

  async getNaverUserInfo(accessToken: string): Promise<any> {
    const userInfoUrl = 'https://openapi.naver.com/v1/nid/me';
    try {
      const response = await axios.get(userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data.response;
    } catch (error) {
      throw new UnauthorizedException(
        '네이버 사용자 정보 획득에 실패했습니다.',
      );
    }
  }

  async refreshNaverToken(
    refreshToken: string,
  ): Promise<RefreshNaverTokenResponseDto> {
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
      throw new UnauthorizedException('네이버 토큰 갱신에 실패했습니다.');
    }
  }

  async getKakaoToken(code: string): Promise<KakaoTokenResponseDto> {
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';
    const params = {
      grant_type: 'authorization_code',
      client_id: this.configService.get('KAKAO_CLIENT_ID'),
      client_secret: this.configService.get('KAKAO_CLIENT_SECRET'),
      redirect_uri: this.configService.get('KAKAO_REDIRECT_URI'),
      code,
    };

    try {
      const response = await axios.post(tokenUrl, null, { params });
      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('카카오 토큰 획득에 실패했습니다.');
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
      throw new UnauthorizedException(
        '카카오 사용자 정보 획득에 실패했습니다.',
      );
    }
  }

  async refreshKakaoToken(
    refreshToken: string,
  ): Promise<RefreshKakaoTokenResponseDto> {
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
      throw new UnauthorizedException('카카오 토큰 갱신에 실패했습니다.');
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
      // 기존 사용자인 경우, 리프레시 토큰만 업데이트
      userAuth.refreshToken = refreshToken;
      await this.authRepository.save(userAuth);
      return userAuth.user;
    } else {
      // 새 사용자 등록
      const newUser = this.userRepository.create({
        userUuid: uuidv4(),
        name,
        profileImage,
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
  ): Promise<RefreshAccessTokenResponseDto> {
    const user = await this.userRepository.findOne({
      where: { userUuid },
    });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const auth = await this.authRepository.findOne({
      where: { userUuid, authProvider: socialProvider },
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

  async sendEmailVerification(email: string) {
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('잘못된 이메일 형식입니다.');
    }

    const now = new Date();
    const storedData = this.emailVerificationCodes.get(email);

    // 최근 1분 이내에 발송된 코드가 있는지 확인
    if (
      storedData &&
      now.getTime() - storedData.expiresAt.getTime() < -4 * 60 * 1000
    ) {
      throw new BadRequestException('1분 후에 다시 시도해주세요.');
    }

    const verificationCode = this.generateVerificationCode();
    const expirationMinutes = 5;
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);

    this.emailVerificationCodes.set(email, {
      code: verificationCode,
      expiresAt,
    });

    const templatePath = path.join(
      process.cwd(),
      'templates',
      'email-verification.html',
    );

    let htmlContent;
    try {
      htmlContent = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      console.error('템플릿 파일을 읽을 수 없습니다:', error);
      throw new BadRequestException('이메일 템플릿을 로드할 수 없습니다.');
    }

    htmlContent = htmlContent.replace('{{verificationCode}}', verificationCode);
    htmlContent = htmlContent.replace(
      '{{expirationMinutes}}',
      expirationMinutes.toString(),
    );

    try {
      await this.sendEmail(email, '[나날모아] 이메일 인증', htmlContent);
      return { message: '인증 코드가 이메일로 전송되었습니다.' };
    } catch (error) {
      console.error('이메일 전송 실패:', error);
      // 전송 실패 시 저장된 코드 삭제
      this.emailVerificationCodes.delete(email);
      throw new BadRequestException('이메일 전송에 실패했습니다.');
    }
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const storedData = this.emailVerificationCodes.get(email);
    if (!storedData) {
      console.log('저장된 이메일 인증 코드가 없습니다.');
      return false;
    }

    if (storedData.code !== code) {
      console.log('잘못된 이메일 인증 코드입니다.');
      return false;
    }

    if (new Date() > storedData.expiresAt) {
      console.log('이메일 인증 코드가 만료되었습니다.');
      this.emailVerificationCodes.delete(email);
      return false;
    }

    this.setEmailVerified(email);
    this.emailVerificationCodes.delete(email);
    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async sendEmail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to,
      subject,
      html,
    });
  }

  async revokeSocialConnection(
    userUuid: string,
    accessToken: string,
    provider: AuthProvider,
  ): Promise<void> {
    try {
      switch (provider) {
        case AuthProvider.KAKAO:
          await this.revokeKakaoConnection(userUuid);
          break;
        case AuthProvider.NAVER:
          await this.revokeNaverConnection(accessToken);
          break;
        default:
          throw new Error(`${provider}는 지원하지 않는 소셜 프로바이더입니다.`);
      }
    } catch (error) {
      console.error(`${provider} unlink 오류`, error);
      throw new InternalServerErrorException(
        `${provider} 연결 해제 실패: ${error.message}`,
      );
    }
  }

  private async revokeKakaoConnection(userUuid: string): Promise<void> {
    const clientId = this.configService.get<string>('KAKAO_ADMIN');
    if (!clientId) {
      throw new Error('KAKAO_CLIENT_ID가 설정되지 않았습니다.');
    }

    try {
      const auth = await this.authRepository.findOne({
        where: {
          userUuid,
          authProvider: AuthProvider.KAKAO,
        },
      });

      if (!auth || !auth.oauthId) {
        throw new Error('카카오 연동 정보를 찾을 수 없습니다.');
      }

      await axios.post(
        'https://kapi.kakao.com/v1/user/unlink',
        {},
        {
          headers: {
            Authorization: `KakaoAK ${clientId}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          params: {
            target_id_type: 'user_id',
            target_id: auth.oauthId,
          },
        },
      );

      await this.authRepository.remove(auth);
    } catch (error) {
      console.error(
        '카카오 연결 해제 오류:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  private async revokeNaverConnection(accessToken: string): Promise<void> {
    const clientId = this.configService.get<string>('NAVER_CLIENT_ID');
    const clientSecret = this.configService.get<string>('NAVER_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new Error(
        'NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다',
      );
    }

    try {
      await axios.get('https://nid.naver.com/oauth2.0/token', {
        params: {
          grant_type: 'delete',
          client_id: clientId,
          client_secret: clientSecret,
          access_token: accessToken,
          service_provider: 'NAVER',
        },
      });
    } catch (error) {
      console.error(
        '네이버 연결 해제 오류:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
