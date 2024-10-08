import { Controller, Get, UseGuards, Req, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import {
  SearchUserResponseSchema,
  UserResponseSchema,
} from './schema/response.schema';
import { User } from '@/entities/user.entity';

@ApiTags('Users')
@Controller('users')
// @UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('Access-Token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth('Access-Token')
  @ApiOperation({ summary: '현재 로그인한 사용자 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '현재 사용자 정보 반환',
    schema: UserResponseSchema,
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async getCurrentUser(@Req() req) {
    const userUuid = req.user.userUuid;
    return this.usersService.getUserByUuid(userUuid);
  }

  @Post('search')
  @ApiOperation({
    summary: '사용자 검색',
    description: '전화번호, 이메일, 또는 이름으로 사용자 검색',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['keyword'],
      properties: {
        keyword: {
          type: 'string',
          description: '검색 키워드 (전화번호, 이메일, 또는 이름)',
          example: 'jw03265@naver.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '검색된 사용자 정보 반환',
    schema: SearchUserResponseSchema,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '사용자를 찾을 수 없습니다.' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async searchUser(@Body('keyword') keyword: string): Promise<User[]> {
    return this.usersService.searchUser(keyword);
  }
}
