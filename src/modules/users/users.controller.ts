import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  @Get(':id')
  @ApiOperation({ summary: '특정 사용자 조회' })
  @ApiParam({ name: 'id', type: 'number', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getUserById(@Param('id') id: number) {
    // 특정 사용자 조회 로직
  }

  @Get('me')
  @ApiOperation({ summary: '현재 로그인한 사용자 정보 조회' })
  @ApiResponse({ status: 200, description: '현재 사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  async getCurrentUser() {
    // 현재 로그인한 사용자 정보 조회 로직
  }
}
