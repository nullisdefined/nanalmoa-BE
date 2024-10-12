import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const UserResponseSchema: SchemaObject = {
  type: 'object',
  properties: {
    userUuid: {
      type: 'string',
      example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c',
      description: '사용자 UUID',
    },
    userId: {
      type: 'number',
      example: 12,
      description: '사용자 ID',
    },
    name: {
      type: 'string',
      example: '김재우',
      description: '사용자 이름',
    },
    profileImage: {
      type: 'string',
      example:
        'http://img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg',
      description: '프로필 이미지 URL',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-10-01T20:49:37.375Z',
      description: '계정 생성 시간',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-10-01T20:49:37.375Z',
      description: '계정 업데이트 시간',
    },
    email: {
      type: 'string',
      example: 'jaegool0119@kakao.com',
      description: '사용자 이메일',
    },
    isManager: {
      type: 'boolean',
      example: false,
      description: '관리자 여부',
    },
  },
};

export const SearchUserResponseSchema: SchemaObject = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      userId: {
        type: 'number',
        example: 102,
        description: '사용자 ID',
      },
      userUuid: {
        type: 'string',
        example: 'd3498999-9bab-4086-af8c-bff0b48dd727',
        description: '사용자 UUID',
      },
      name: {
        type: 'string',
        example: '김재우',
        description: '사용자 이름',
      },
      profileImage: {
        type: 'string',
        example: 'https://ssl.pstatic.net/static/pwe/address/img_profile.png',
        description: '프로필 이미지 URL',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-10-05T21:59:21.346Z',
        description: '계정 생성 시간',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-10-05T21:59:21.346Z',
        description: '계정 업데이트 시간',
      },
      email: {
        type: 'string',
        example: 'jw03265@naver.com',
        description: '사용자 이메일',
      },
      phoneNumber: {
        type: 'string',
        nullable: true,
        example: null,
        description: '사용자 전화번호',
      },
      isManager: {
        type: 'boolean',
        example: false,
        description: '관리자 여부',
      },
    },
  },
};
