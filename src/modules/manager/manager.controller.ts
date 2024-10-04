import { Controller, Post, Body, Param, Put, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ManagerService } from './manager.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationStatusDto } from './dto/update-invitation.dto';
import { ManagerInvitation } from 'src/entities/manager-invitation.entity';
import {
  GetInvitationReceivedDto,
  GetInvitationSendDto,
} from './dto/get-invitation.dto';
import { CreateManagerSubordinateDto } from './dto/create-manager.dto';

@ApiTags('Manager')
@Controller('manager')
export class ManagerController {
  constructor(private readonly managerInvitationService: ManagerService) {}

  @Post('invitation')
  @ApiOperation({ summary: '새로운 관리자 초대 생성' })
  @ApiResponse({
    status: 201,
    description: '초대가 성공적으로 생성됨',
    type: ManagerInvitation,
  })
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
  ): Promise<ManagerInvitation> {
    return this.managerInvitationService.createInvitation(createInvitationDto);
  }

  @Get('invitation/send')
  @ApiOperation({ summary: '특정 유저가 보낸 초대 현황' })
  @ApiResponse({
    status: 200,
    description: '초대 보낸 정보 조회 성공',
    type: [ManagerInvitation],
  })
  async getInvitationSend(
    @Query() getInvitationSendDto: GetInvitationSendDto,
  ): Promise<ManagerInvitation[]> {
    return this.managerInvitationService.getInvitationSend(
      getInvitationSendDto,
    );
  }

  @Get('invitation/received')
  @ApiOperation({ summary: '특정 유저가 받은 초대 현황' })
  @ApiResponse({
    status: 200,
    description: '초대 받은 정보 조회 성공',
    type: [ManagerInvitation],
  })
  async getInvitationReceived(
    @Query() getInvitationReceivedDto: GetInvitationReceivedDto,
  ): Promise<ManagerInvitation[]> {
    return this.managerInvitationService.getInvitationReceived(
      getInvitationReceivedDto,
    );
  }

  @Get('invitation/user')
  @ApiOperation({ summary: '보낸 유저와 받은 유저 초대 현황' })
  @ApiResponse({
    status: 200,
    description: '두 유저의 초대 상태',
    type: ManagerInvitation,
  })
  async getInvitationUsers(
    @Query() createManagerSubordinateDto: CreateManagerSubordinateDto,
  ): Promise<ManagerInvitation> {
    return this.managerInvitationService.getInvitationUsers(
      createManagerSubordinateDto,
    );
  }

  @Get('invitation/:id')
  @ApiOperation({ summary: '초대 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '초대 정보 조회 성공',
    type: ManagerInvitation,
  })
  async getInvitation(@Param('id') id: number): Promise<ManagerInvitation> {
    return this.managerInvitationService.getInvitation(id);
  }

  @Put('invitation/:id/status')
  @ApiOperation({ summary: '초대 상태 업데이트' })
  @ApiResponse({
    status: 200,
    description: '초대 상태가 성공적으로 업데이트됨',
    type: ManagerInvitation,
  })
  async updateInvitationStatus(
    @Param('id') id: number,
    @Body() updateInvitationStatusDto: UpdateInvitationStatusDto,
  ): Promise<ManagerInvitation> {
    return this.managerInvitationService.updateInvitationStatus(
      id,
      updateInvitationStatusDto,
    );
  }
}
