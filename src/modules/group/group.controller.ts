import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Patch,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteGroupMemberDto } from './dto/invite-group-memeber.dto';
import { RespondToInvitationDto } from './dto/response-invitation.dto';
import { InvitationStatus } from '@/entities/manager-invitation.entity';

@ApiTags('Group')
@Controller('groups')
// @UseGuards(AuthGuard('jwt'))
// @ApiBearerAuth('Access-Token')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: '새 그룹 생성' })
  @ApiResponse({ status: 201, description: '그룹이 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.createGroup(createGroupDto);
  }

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

  @Post('invite')
  @ApiOperation({ summary: '그룹 멤버 초대' })
  @ApiResponse({ status: 201, description: '초대가 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async inviteGroupMember(@Body() inviteGroupMemberDto: InviteGroupMemberDto) {
    return this.groupService.inviteGroupMember(inviteGroupMemberDto);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: '그룹 초대 수락' })
  @ApiParam({ name: 'id', description: '초대 ID' })
  @ApiQuery({ name: 'userUuid', description: '사용자 UUID' })
  @ApiResponse({ status: 200, description: '초대 수락 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  async acceptInvitation(
    @Param('id') id: number,
    @Query('userUuid') userUuid: string,
  ) {
    const invitation = await this.groupService.getInvitation(id);

    if (invitation.inviteeUuid !== userUuid) {
      throw new ForbiddenException('이 초대를 수락할 권한이 없습니다.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ForbiddenException('이 초대는 더 이상 유효하지 않습니다.');
    }

    const respondDto: RespondToInvitationDto = {
      invitationId: id,
      status: InvitationStatus.ACCEPTED,
    };

    await this.groupService.respondToInvitation(respondDto);

    return { message: '그룹 초대가 성공적으로 수락되었습니다.' };
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
