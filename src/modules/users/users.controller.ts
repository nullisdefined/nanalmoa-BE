import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UserResponseSchema } from './schema/response.schema';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
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

  // @Get('id/:uuid')
  // @ApiBearerAuth()
  // @ApiOperation({ summary: '사용자 ID 조회' })
  // @ApiParam({
  //   name: 'uuid',
  //   required: true,
  //   description: '사용자 UUID',
  //   schema: { type: 'string' },
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: '사용자 ID 반환',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       userUuid: {
  //         type: 'string',
  //         example: 'aefc3ab2-c527-4858-9971-bf8e6543d56c',
  //         description: '사용자 UUID',
  //       },
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: '인증되지 않은 사용자',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       statusCode: { type: 'number', example: 401 },
  //       message: { type: 'string', example: '인증되지 않은 사용자' },
  //       error: { type: 'string', example: 'Unauthorized' },
  //     },
  //   },
  // })
  // @ApiResponse({
  //   status: 404,
  //   description: '사용자를 찾을 수 없음',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       statusCode: { type: 'number', example: 404 },
  //       message: { type: 'string', example: '사용자를 찾을 수 없습니다.' },
  //       error: { type: 'string', example: 'Not Found' },
  //     },
  //   },
  // })
  // async getUserId(@Param('uuid') uuid: string) {
  //   const user = await this.usersService.getUserByUuid(uuid);
  //   return { userUuid: user.userUuid };
  // }
}
