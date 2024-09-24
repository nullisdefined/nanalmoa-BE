import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from 'src/entities/auth.entity';
import { User } from 'src/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getNaverToken: jest.fn(),
            getNaverUserInfo: jest.fn(),
            getKakaoToken: jest.fn(),
            getKakaoUserInfo: jest.fn(),
            findOrCreateUser: jest.fn(),
            generateAccessToken: jest.fn(),
            refreshAccessToken: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('정의되어 있어야 합니다', () => {
    expect(controller).toBeDefined();
  });

  describe('naverLoginCallback', () => {
    it('네이버 로그인 성공 시 사용자 정보와 토큰을 반환해야 합니다', async () => {
      const mockCode = 'testCode';
      const mockNaverTokens = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      };
      const mockNaverUser = {
        id: '123',
        email: 'test@example.com',
        name: '홍길동',
      };
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        name: '홍길동',
        profileImage: 'example.com/profile.jpg',
      };
      const mockAccessToken = 'newAccessToken';

      jest
        .spyOn(authService, 'getNaverToken')
        .mockResolvedValue(mockNaverTokens);
      jest
        .spyOn(authService, 'getNaverUserInfo')
        .mockResolvedValue(mockNaverUser);
      jest
        .spyOn(authService, 'findOrCreateUser')
        .mockResolvedValue(mockUser as User);
      jest
        .spyOn(authService, 'generateAccessToken')
        .mockReturnValue(mockAccessToken);

      const result = await controller.naverLoginCallback(mockCode);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockNaverTokens.refresh_token,
        socialProvider: AuthProvider.NAVER,
        user: {
          id: mockUser.userId,
          email: mockUser.email,
          name: mockUser.name,
          profileImage: mockUser.profileImage,
        },
      });
    });

    it('인가 코드가 없을 때 UnauthorizedException 예외가 발생해야 합니다', async () => {
      await expect(controller.naverLoginCallback(null)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('kakaoLoginCallback', () => {
    it('카카오 로그인 성공 시 사용자 정보와 토큰을 반환해야 합니다', async () => {
      const mockCode = 'testCode';
      const mockKakaoTokens = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      };
      const mockKakaoUser = {
        id: '123',
        kakao_account: { email: 'test@example.com' },
        properties: { nickname: '홍길동' },
      };
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        name: '홍길동',
        profileImage: 'example.com/profile.jpg',
      };
      const mockAccessToken = 'newAccessToken';

      jest
        .spyOn(authService, 'getKakaoToken')
        .mockResolvedValue(mockKakaoTokens);
      jest
        .spyOn(authService, 'getKakaoUserInfo')
        .mockResolvedValue(mockKakaoUser);
      jest
        .spyOn(authService, 'findOrCreateUser')
        .mockResolvedValue(mockUser as User);
      jest
        .spyOn(authService, 'generateAccessToken')
        .mockReturnValue(mockAccessToken);

      const result = await controller.kakaoLoginCallback(mockCode);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockKakaoTokens.refresh_token,
        socialProvider: AuthProvider.KAKAO,
        user: {
          id: mockUser.userId,
          email: mockUser.email,
          name: mockUser.name,
          profileImage: mockUser.profileImage,
        },
      });
    });

    it('인가 코드가 없을 때 UnauthorizedException 예외가 발생해야 합니다', async () => {
      await expect(controller.kakaoLoginCallback(null)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('토큰 갱신 성공 시 새로운 액세스 토큰을 반환해야 합니다', async () => {
      const mockRefreshTokenDto = {
        userId: 1,
        refreshToken: 'oldRefreshToken',
        socialProvider: AuthProvider.NAVER,
      };
      const mockNewTokens = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      };

      jest
        .spyOn(authService, 'refreshAccessToken')
        .mockResolvedValue(mockNewTokens);

      const result = await controller.refreshToken(mockRefreshTokenDto);

      expect(result).toEqual(mockNewTokens);
    });

    it('토큰 갱신 실패 시 UnauthorizedException 예외가 발생해야 합니다', async () => {
      const mockRefreshTokenDto = {
        userId: 1,
        refreshToken: 'invalidToken',
        socialProvider: AuthProvider.NAVER,
      };

      jest
        .spyOn(authService, 'refreshAccessToken')
        .mockRejectedValue(new Error('Refresh failed'));

      await expect(
        controller.refreshToken(mockRefreshTokenDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
