import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Auth, AuthProvider } from '../entities/auth.entity';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('axios');

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;
  let jwtService: JwtService;
  let authRepository: Repository<Auth>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Auth),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    authRepository = module.get<Repository<Auth>>(getRepositoryToken(Auth));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('정의되어 있어야 합니다', () => {
    expect(service).toBeDefined();
  });

  describe('getNaverToken', () => {
    it('액세스 토큰과 리프레시 토큰을 반환해야 합니다', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
        },
      };
      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getNaverToken('mock_code');

      expect(result).toEqual({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
      });
    });

    it('오류 발생 시 UnauthorizedException 예외가 발생해야 합니다', async () => {
      (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.getNaverToken('mock_code')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getNaverUserInfo', () => {
    it('사용자 정보를 반환해야 합니다', async () => {
      const mockResponse = {
        data: {
          response: {
            id: 'mock_id',
            name: 'Mock User',
            email: 'mock@example.com',
          },
        },
      };
      (axios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.getNaverUserInfo('mock_access_token');

      expect(result).toEqual({
        id: 'mock_id',
        name: 'Mock User',
        email: 'mock@example.com',
      });
    });

    it('오류 발생 시 UnauthorizedException 예외가 발생해야 합니다', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        service.getNaverUserInfo('mock_access_token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findOrCreateUser', () => {
    it('기존 사용자가 있으면 해당 사용자를 반환해야 합니다', async () => {
      const mockUser = {
        userId: 1,
        name: 'Existing User',
        email: 'existing@example.com',
      };
      const mockAuth = { user: mockUser, refreshToken: 'old_token' };
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockAuth as Auth);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as User);
      jest.spyOn(authRepository, 'save').mockResolvedValue(mockAuth as Auth);

      const result = await service.findOrCreateUser(
        { id: 'social_id', name: 'Social User', email: 'social@example.com' },
        'new_refresh_token',
        AuthProvider.NAVER,
      );

      expect(result).toEqual(mockUser);
    });

    it('사용자가 없으면 새로운 사용자가 생성되어야 합니다', async () => {
      const mockUser = {
        userId: 1,
        name: 'New User',
        email: 'new@example.com',
      };
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as User);
      jest.spyOn(authRepository, 'create').mockReturnValue({} as Auth);
      jest.spyOn(authRepository, 'save').mockResolvedValue({} as Auth);

      const result = await service.findOrCreateUser(
        { id: 'social_id', name: 'New User', email: 'new@example.com' },
        'refresh_token',
        AuthProvider.NAVER,
      );

      expect(result).toEqual(mockUser);
    });
  });

  describe('generateAccessToken', () => {
    it('JWT 토큰이 생성되어야 합니다', () => {
      const mockUser = {
        userId: 1,
        name: 'Test User',
        email: 'test@example.com',
      };
      const mockToken = 'mock.jwt.token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = service.generateAccessToken(mockUser as User);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.userId,
        email: mockUser.email,
        name: mockUser.name,
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('토큰이 성공적으로 갱신되어야 합니다', async () => {
      const mockAuth = {
        user: { userId: 1, name: 'Test User', email: 'test@example.com' },
        refreshToken: 'old_refresh_token',
      };
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockAuth as Auth);
      jest.spyOn(service, 'refreshKakaoToken').mockResolvedValue({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      });
      jest
        .spyOn(service, 'generateAccessToken')
        .mockReturnValue('new_jwt_token');
      jest.spyOn(authRepository, 'save').mockResolvedValue({} as Auth);

      const result = await service.refreshAccessToken(
        1,
        'old_refresh_token',
        AuthProvider.KAKAO,
      );

      expect(result).toEqual({
        accessToken: 'new_jwt_token',
        refreshToken: 'new_refresh_token',
      });
    });

    it('인증 정보를 찾을 수 없으면 UnauthorizedException 예외가 발생해야 합니다', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.refreshAccessToken(1, 'invalid_token', AuthProvider.KAKAO),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
