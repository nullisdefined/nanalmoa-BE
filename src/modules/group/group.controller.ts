import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroupService } from './group.service';
import { InviteGroupMemberDto } from './dto/invite-group-memeber.dto';
import { RespondToInvitationDto } from './dto/response-invitation.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { GroupInfoResponseDto } from './dto/response-group.dto';
import { GroupMemberResponseDto } from './dto/response-group-member.dto';
import { GroupDetailResponseDto } from './dto/response-group-detail.dto';
import { GroupInvitationDetailDto } from './dto/response-group-invitation-detail.dto';

@ApiTags('Group')
@Controller('groups')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('Access-Token')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // 그룹 생성 및 관리
  @Post()
  @ApiOperation({ summary: '새 그룹 생성' })
  @ApiResponse({ status: 201, description: '그룹이 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async createGroup(
    @Query('groupName') groupName: string,
    @Req() req: Request,
  ) {
    const creatorUuid = req.user['userUuid'];
    return this.groupService.createGroup({ groupName, creatorUuid });
  }

  @Delete(':groupId')
  @ApiOperation({ summary: '그룹 삭제' })
  @ApiParam({ name: 'groupId', description: '삭제할 그룹 ID' })
  @ApiResponse({ status: 200, description: '그룹이 성공적으로 삭제됨' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '그룹을 찾을 수 없음' })
  async deleteGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ) {
    const adminUuid = req.user['userUuid'];
    await this.groupService.deleteGroup(groupId, adminUuid);
    return { message: '그룹이 성공적으로 삭제되었습니다.' };
  }

  // 그룹 정보 조회
  @Get('user')
  @ApiOperation({ summary: '사용자가 속한 그룹 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자의 그룹 목록',
    type: [GroupInfoResponseDto],
  })
  async getUserGroups(@Req() req: Request): Promise<GroupInfoResponseDto[]> {
    const userUuid = req.user['userUuid'];
    return this.groupService.getUserGroups(userUuid);
  }

  @Get(':groupId/members')
  @ApiOperation({ summary: '특정 그룹의 그룹원 정보 조회' })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiResponse({
    status: 200,
    description: '그룹원 목록',
    type: [GroupMemberResponseDto],
  })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '그룹을 찾을 수 없음' })
  async getGroupMembers(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<GroupMemberResponseDto[]> {
    const userUuid = req.user['userUuid'];
    return this.groupService.getGroupMembers(groupId, userUuid);
  }

  // 그룹 멤버 관리
  @Post('invite')
  @ApiOperation({ summary: '그룹 멤버 초대' })
  @ApiResponse({ status: 201, description: '초대가 성공적으로 생성됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async inviteGroupMembers(
    @Body() inviteGroupMemberDto: InviteGroupMemberDto,
    @Req() req: Request,
  ) {
    const inviterUuid = req.user['userUuid'];
    if (inviteGroupMemberDto.inviteeUuids.includes(inviterUuid)) {
      throw new ForbiddenException('자신을 초대할 수 없습니다.');
    }
    return this.groupService.inviteGroupMembers(
      inviteGroupMemberDto,
      inviterUuid,
    );
  }
  @Delete(':groupId/members/:memberUuid')
  @ApiOperation({ summary: '그룹 멤버 추방' })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'memberUuid', description: '추방할 멤버의 UUID' })
  @ApiResponse({ status: 200, description: '멤버가 성공적으로 추방됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '그룹 또는 멤버를 찾을 수 없음' })
  async removeGroupMember(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('memberUuid') memberUuid: string,
    @Req() req: Request,
  ) {
    const adminUuid = req.user['userUuid'];
    await this.groupService.removeGroupMember(
      { groupId, memberUuid },
      adminUuid,
    );
    return { message: '멤버가 성공적으로 그룹에서 추방되었습니다.' };
  }

  // 초대 관리
  @Patch('invitation/:id/accept')
  @ApiOperation({ summary: '그룹 초대 수락' })
  @ApiParam({ name: 'id', description: '초대 ID' })
  @ApiResponse({ status: 200, description: '초대 수락 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  async acceptInvitation(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const inviteeUuid = req.user['userUuid'];
    return this.groupService.acceptInvitation(id, inviteeUuid);
  }

  @Patch('invitation/:id/reject')
  @ApiOperation({ summary: '그룹 초대 거절' })
  @ApiParam({ name: 'id', description: '초대 ID' })
  @ApiResponse({ status: 200, description: '초대 거절 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  async rejectInvitation(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const inviteeUuid = req.user['userUuid'];
    return this.groupService.rejectInvitation(id, inviteeUuid);
  }

  @Patch('invitation/:id/cancel')
  @ApiOperation({ summary: '그룹 초대 철회' })
  @ApiParam({ name: 'id', description: '초대 ID' })
  @ApiResponse({ status: 200, description: '초대 철회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  async cancelInvitation(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ) {
    const inviterUuid = req.user['userUuid'];
    return this.groupService.cancelInvitation(id, inviterUuid);
  }

  @Get('invitations/sent')
  @ApiOperation({ summary: '보낸 그룹 초대 조회' })
  @ApiResponse({
    status: 200,
    description: '보낸 초대 목록',
    type: [RespondToInvitationDto],
  })
  async getSentInvitations(
    @Req() req: Request,
  ): Promise<RespondToInvitationDto[]> {
    const userUuid = req.user['userUuid'];
    return this.groupService.getSentInvitations(userUuid);
  }

  @Get('invitations/received')
  @ApiOperation({ summary: '받은 그룹 초대 조회' })
  @ApiResponse({
    status: 200,
    description: '받은 초대 목록',
    type: [RespondToInvitationDto],
  })
  async getReceivedInvitations(
    @Req() req: Request,
  ): Promise<RespondToInvitationDto[]> {
    const userUuid = req.user['userUuid'];
    return this.groupService.getReceivedInvitations(userUuid);
  }

  @Get('invitation/:id')
  @ApiOperation({ summary: '그룹 초대 상세 정보 조회' })
  @ApiParam({ name: 'id', description: '초대 ID' })
  @ApiResponse({
    status: 200,
    description: '그룹 초대 상세 정보',
    type: GroupInvitationDetailDto,
  })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  async getGroupInvitationDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GroupInvitationDetailDto> {
    return this.groupService.getGroupInvitationDetail(id);
  }

  @Get(':groupId')
  @ApiOperation({ summary: '상세 그룹 정보 조회' })
  @ApiParam({ name: 'groupId', description: '조회할 그룹 ID' })
  @ApiResponse({
    status: 200,
    description: '상세 그룹 정보',
    type: GroupDetailResponseDto,
  })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '그룹을 찾을 수 없음' })
  async getGroupDetail(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Req() req: Request,
  ): Promise<GroupDetailResponseDto> {
    const userUuid = req.user['userUuid'];
    return this.groupService.getGroupDetail(groupId, userUuid);
  }
}
