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
      example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
    },
    user: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c',
        },
        phoneNumber: { type: 'string', example: '01012345678' },
        name: { type: 'string', example: '김재우' },
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
      description: '새로 발급된 액세스 토큰',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    refreshToken: {
      type: 'string',
      description: '새로 발급된 리프레시 토큰 (옵셔널)',
      example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
    },
  },
};

export const BasicSignupResponseSchema: SchemaObject = {
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
    user: {
      type: 'object',
      properties: {
        userUuid: {
          type: 'string',
          example: 'b5944322-becb-4d01-b0a3-77c7b3fbfac5',
        },
        name: {
          type: 'string',
          example: '김재우',
        },
        phoneNumber: {
          type: 'string',
          example: '01012345678',
        },
        profileImage: {
          type: 'string',
          example: null,
        },
        email: {
          type: 'string',
          example: null,
        },
        userId: {
          type: 'number',
          example: 1,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-10-05T01:46:17.431Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-10-05T01:46:17.431Z',
        },
        isManager: {
          type: 'boolean',
          example: false,
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

export const NaverTokenResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    access_token: {
      type: 'string',
      description: '네이버 액세스 토큰',
      example: 'AAAAOLtP40eH6P5S4Z7lrloCNvK1dcT5bcrwq2FGHfwTOBEtgA...',
    },
    refresh_token: {
      type: 'string',
      description: '네이버 리프레시 토큰',
      example: 'c8ceMEJisO4Se7uGCEYKK1k9dzjdas5AAAAAgop',
    },
  },
};

export const KakaoTokenResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    access_token: {
      type: 'string',
      description: '카카오 액세스 토큰',
      example: 'AAAAOLtP40eH6P5S4Z7lrloCNvK1dcT5bcrwq2FGHfwTOBEtgA...',
    },
    refresh_token: {
      type: 'string',
      description: '카카오 리프레시 토큰',
      example: 'c8ceMEJisO4Se7uGCEYKK1k9dzjdas5AAAAAgop',
    },
  },
};

export const RefreshBasicTokenResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    refreshToken: {
      type: 'string',
      description: '새로 발급된 기본 리프레시 토큰',
      example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
    },
  },
};

export const RefreshNaverTokenResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    access_token: {
      type: 'string',
      description: '새로 발급된 네이버 액세스 토큰',
      example: 'AAAAOLtP40eH6P5S4Z7lrloCNvK1dcT5bcrwq2FGHfwTOBEtgA...',
    },
    refresh_token: {
      type: 'string',
      description: '새로 발급된 네이버 리프레시 토큰',
      example: 'c8ceMEJisO4Se7uGCEYKK1k9dzjdas5AAAAAgop',
    },
  },
};

export const RefreshKakaoTokenResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    access_token: {
      type: 'string',
      description: '새로 발급된 카카오 액세스 토큰',
      example: 'AAAAOLtP40eH6P5S4Z7lrloCNvK1dcT5bcrwq2FGHfwTOBEtgA...',
    },
    refresh_token: {
      type: 'string',
      description: '새로 발급된 카카오 리프레시 토큰',
      example: 'c8ceMEJisO4Se7uGCEYKK1k9dzjdas5AAAAAgop',
    },
  },
};

export const RefreshAccessTokenResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    accessToken: {
      type: 'string',
      description: '새로 발급된 액세스 토큰',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    refreshToken: {
      type: 'string',
      description: '새로 발급된 리프레시 토큰 (옵셔널)',
      example: 'tyvx8E0QQgMsAQaNB2DV-a2eqtjk5W6AAAAAgop',
    },
  },
};
