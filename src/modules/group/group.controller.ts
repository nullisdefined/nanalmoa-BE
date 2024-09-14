import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Group')
@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupController {
  @Get(':scheduleId')
  @ApiOperation({ summary: '그룹 멤버 조회' })
  @ApiParam({
    name: 'scheduleId',
    type: 'number',
    description: '조회할 일정 ID',
  })
  @ApiResponse({ status: 200, description: '그룹 멤버 목록 반환' })
  @ApiResponse({ status: 404, description: '일정을 찾을 수 없음' })
  async getGroupMembers(@Param('scheduleId') scheduleId: number) {
    // 그룹 멤버 조회 로직
  }

  @Post(':scheduleId')
  @ApiOperation({ summary: '그룹 멤버 초대' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', description: '초대할 사용자 ID' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '멤버 초대 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async inviteMember(
    @Param('scheduleId') scheduleId: number,
    @Body() inviteDto: any,
  ) {
    // 그룹 멤버 초대 로직
  }

  @Delete(':scheduleId')
  @ApiOperation({ summary: '그룹 탈퇴' })
  @ApiResponse({ status: 200, description: '그룹 탈퇴 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async leaveGroup(@Param('scheduleId') scheduleId: number) {
    // 그룹 탈퇴 로직
  }

  @Delete(':scheduleId/member')
  @ApiOperation({ summary: '그룹 멤버 삭제' })
  @ApiParam({ name: 'scheduleId', type: 'number', description: '일정 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', description: '삭제할 멤버의 사용자 ID' },
      },
    },
  })
  @ApiResponse({ status: 200, description: '멤버 삭제 성공' })
  @ApiResponse({ status: 404, description: '멤버 또는 일정을 찾을 수 없음' })
  async removeMember(
    @Param('scheduleId') scheduleId: number,
    @Body() removeMemberDto: any,
  ) {
    // 그룹 멤버 삭제 로직
  }
}
