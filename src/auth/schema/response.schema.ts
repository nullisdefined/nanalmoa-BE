import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const NaverLoginResponseSchema: SchemaObject = {
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
        id: { type: 'string', example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c' },
        email: { type: 'string', example: 'user@example.com' },
        phoneNumber: { type: 'string', example: '01012345678' },
        name: { type: 'string', example: '홍길동' },
        profileImage: {
          type: 'string',
          example: 'https://example.com/profile.jpg',
        },
      },
    },
  },
};

export const KakaoLoginResponseSchema: SchemaObject = {
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
        id: { type: 'string', example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c' },
        email: { type: 'string', example: 'user@example.com' },
        phoneNumber: { type: 'string', example: '01012345678' },
        name: { type: 'string', example: '홍길동' },
        profileImage: {
          type: 'string',
          example: 'https://example.com/profile.jpg',
        },
      },
    },
  },
};

export const BasicLoginResponseSchema: SchemaObject = {
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
};

export const RefreshTokenResponseSchema: SchemaObject = {
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
      example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
    },
  },
};
