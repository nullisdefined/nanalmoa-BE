import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Body,
  BadRequestException,
  Put,
  ConflictException,
} from '@nestjs/common';
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
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '@/auth/auth.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('Access-Token')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

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

  @Put('update')
  @ApiOperation({ summary: '회원정보 수정' })
  @ApiResponse({ status: 200, description: '회원정보 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async updateUserInfo(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const userUuid = req.user.userUuid;
    const { name, phoneNumber, email, address } = updateUserDto;

    const currentUser = await this.usersService.getUserByUuid(userUuid);

    if (phoneNumber && phoneNumber !== currentUser.phoneNumber) {
      const isVerified = this.authService.isPhoneNumberVerified(phoneNumber);
      if (!isVerified) {
        throw new BadRequestException(
          '전화번호 인증이 필요합니다. 먼저 인증을 완료해주세요.',
        );
      }
    }

    if (email && email !== currentUser.email) {
      // 이메일 중복 검사
      const isEmailTaken = await this.usersService.isEmailTaken(
        email,
        userUuid,
      );
      if (isEmailTaken) {
        throw new ConflictException('이미 사용 중인 이메일 주소입니다.');
      }

      // 이메일 인증 확인
      const isVerified = this.authService.isEmailVerified(email);
      if (!isVerified) {
        throw new BadRequestException(
          '이메일 인증이 필요합니다. 먼저 인증을 완료해주세요.',
        );
      }
    }

    const updatedUser = await this.usersService.updateUser(userUuid, {
      name,
      phoneNumber,
      email,
      address,
    });

    return {
      message: '회원정보가 성공적으로 수정되었습니다.',
      user: updatedUser,
    };
  }
}
