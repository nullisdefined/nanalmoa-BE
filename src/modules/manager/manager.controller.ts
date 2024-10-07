import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Delete,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ManagerService } from './manager.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ManagerInvitation } from 'src/entities/manager-invitation.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@ApiTags('Manager')
@Controller('manager')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post('invitation')
  @ApiOperation({ summary: '새로운 관리자 초대 생성' })
  @ApiResponse({
    status: 201,
    description: '초대가 성공적으로 생성됨',
    type: ManagerInvitation,
  })
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Req() req: Request,
  ): Promise<ManagerInvitation> {
    const managerUuid = req.user['userUuid'];
    return this.managerService.createInvitation({
      ...createInvitationDto,
      managerUuid,
    });
  }

  @Get('invitation/send')
  @ApiOperation({ summary: '특정 유저가 보낸 초대 현황' })
  @ApiResponse({
    status: 200,
    description: '초대 보낸 정보 조회 성공',
    type: [ManagerInvitation],
  })
  async getInvitationSend(@Req() req: Request): Promise<ManagerInvitation[]> {
    const managerUuid = req.user['userUuid'];
    return this.managerService.getInvitationSend({ managerUuid });
  }

  @Get('invitation/received')
  @ApiOperation({ summary: '특정 유저가 받은 초대 현황' })
  @ApiResponse({
    status: 200,
    description: '초대 받은 정보 조회 성공',
    type: [ManagerInvitation],
  })
  async getInvitationReceived(
    @Req() req: Request,
  ): Promise<ManagerInvitation[]> {
    const subordinateUuid = req.user['userUuid'];
    return this.managerService.getInvitationReceived({ subordinateUuid });
  }

  @Get('invitation/user')
  @ApiOperation({ summary: '보낸 유저와 받은 유저 초대 현황' })
  @ApiResponse({
    status: 200,
    description: '두 유저의 초대 상태',
    type: ManagerInvitation,
  })
  async getInvitationUsers(
    @Query('subordinateUuid') subordinateUuid: string,
    @Req() req: Request,
  ): Promise<ManagerInvitation> {
    const managerUuid = req.user['userUuid'];
    return this.managerService.getInvitationUsers({
      managerUuid,
      subordinateUuid,
    });
  }

  @Get('invitation/:id')
  @ApiOperation({ summary: '초대 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '초대 정보 조회 성공',
    type: ManagerInvitation,
  })
  async getInvitation(@Param('id') id: number): Promise<ManagerInvitation> {
    return this.managerService.getInvitation(id);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: '초대 수락' })
  @ApiResponse({
    status: 200,
    description: '초대가 성공적으로 수락됨',
    type: ManagerInvitation,
  })
  async acceptInvitation(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<ManagerInvitation> {
    const subordinateUuid = req.user['userUuid'];
    return this.managerService.acceptInvitation(id, subordinateUuid);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: '초대 거절' })
  @ApiResponse({
    status: 200,
    description: '초대가 성공적으로 거절됨',
    type: ManagerInvitation,
  })
  async rejectInvitation(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<ManagerInvitation> {
    const subordinateUuid = req.user['userUuid'];
    return this.managerService.rejectInvitation(id, subordinateUuid);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '초대 철회' })
  @ApiResponse({
    status: 200,
    description: '초대가 성공적으로 철회됨',
    type: ManagerInvitation,
  })
  async cancelInvitation(
    @Param('id') id: number,
    @Req() req: Request,
  ): Promise<ManagerInvitation> {
    const managerUuid = req.user['userUuid'];
    return this.managerService.cancelInvitation(id, managerUuid);
  }

  @Delete(':subordinateUuid')
  @ApiOperation({ summary: '관리자-피관리자 관계 제거' })
  @ApiResponse({
    status: 200,
    description: '관리자-피관리자 관계가 성공적으로 제거됨',
  })
  async removeManagerSubordinate(
    @Param('subordinateUuid') subordinateUuid: string,
    @Req() req: Request,
  ): Promise<void> {
    const managerUuid = req.user['userUuid'];
    return this.managerService.removeManagerSubordinate(
      managerUuid,
      subordinateUuid,
    );
  }

  @Get('managers')
  @ApiOperation({ summary: '자신의 관리자 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '관리자 목록 조회 성공',
    type: [UserResponseDto],
  })
  async getManagerList(@Req() req: Request): Promise<UserResponseDto[]> {
    const subordinateUuid = req.user['userUuid'];
    return this.managerService.getManagerList(subordinateUuid);
  }

  @Get('subordinates')
  @ApiOperation({ summary: '자신의 피관리자 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '피관리자 목록 조회 성공',
    type: [UserResponseDto],
  })
  async getSubordinateList(@Req() req: Request): Promise<UserResponseDto[]> {
    const managerUuid = req.user['userUuid'];
    return this.managerService.getSubordinateList(managerUuid);
  }
}
