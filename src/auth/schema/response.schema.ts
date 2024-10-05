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

export const BasicSignupResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      example: '회원가입이 완료되었습니다.',
    },
    user: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c',
        },
        phoneNumber: {
          type: 'string',
          example: '01012345678',
        },
        name: {
          type: 'string',
          example: '홍길동',
        },
        email: {
          type: 'string',
          example: null,
        },
        profileImage: {
          type: 'string',
          example: null,
        },
      },
    },
  },
};

export const SendVerificationCodeResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      example: '인증 코드 전송 성공',
    },
  },
};

export const SendVerificationCodeErrorSchema: SchemaObject = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 500 },
    message: { type: 'string', example: '인증 코드 전송에 실패했습니다' },
    error: { type: 'string', example: 'Internal Server Error' },
  },
};

export const VerifyCodeResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      example: '인증 성공',
    },
  },
};

export const VerifyCodeErrorSchema: SchemaObject = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 400 },
    message: { type: 'string', example: '유효하지 않은 인증 코드입니다.' },
    error: { type: 'string', example: 'Bad Request' },
  },
};

export const RefreshTokenErrorSchema: SchemaObject = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 401 },
    message: { type: 'string', example: '액세스 토큰 갱신 실패' },
    error: { type: 'string', example: 'Unauthorized' },
  },
};
