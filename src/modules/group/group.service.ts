import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Group } from '@/entities/group.entity';
import { UserGroup } from '@/entities/user-group.entity';
import { GroupInfoResponseDto } from './dto/response-group.dto';
import { InviteGroupMemberDto } from './dto/invite-group-memeber.dto';
import { GroupInvitation } from '@/entities/group-invitation.entity';
import { InvitationStatus } from '@/entities/manager-invitation.entity';
import { RespondToInvitationDto } from './dto/response-invitation.dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private userGroupRepository: Repository<UserGroup>,
    @InjectRepository(GroupInvitation)
    private groupInvitationRepository: Repository<GroupInvitation>,
    private dataSource: DataSource,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
  ): Promise<GroupInfoResponseDto> {
    const { groupName, creatorUuid } = createGroupDto;

    // 해당 인물이 소속된 그룹 중 같은 이름을 가진 그룹이 있는지 확인
    const existingGroup = await this.userGroupRepository.findOne({
      where: { user_uuid: creatorUuid },
      relations: ['group'],
    });

    if (existingGroup && existingGroup.group.groupName === groupName) {
      throw new BadRequestException(
        '동일 그룹명을 가진 그룹에 소속되어 있습니다.',
      );
    }

    // 그룹 생성
    const newGroup = this.groupRepository.create({ groupName });
    const savedGroup = await this.groupRepository.save(newGroup);

    // 생성자를 관리자로 추가
    const userGroup = this.userGroupRepository.create({
      user_uuid: creatorUuid,
      group: savedGroup,
      isAdmin: true,
    });
    await this.userGroupRepository.save(userGroup);

    const response: GroupInfoResponseDto = {
      groupId: savedGroup.groupId,
      groupName: savedGroup.groupName,
      createdAt: savedGroup.createdAt,
      memberCount: 1, // 생성 시점에는 생성자 한 명만 멤버
      isAdmin: true, // 생성자는 항상 관리자
    };

    return response;
  }

  async inviteGroupMember(inviteGroupMemberDto: InviteGroupMemberDto) {
    const { groupId, inviterUuid, inviteeUuid } = inviteGroupMemberDto;

    // 초대자==관리자?
    const inviterUserGroup = await this.userGroupRepository.findOne({
      where: { group: { groupId }, user_uuid: inviterUuid },
    });

    if (!inviterUserGroup || !inviterUserGroup.isAdmin) {
      throw new ForbiddenException(
        '그룹 생성자만이 그룹 멤버 초대가 가능합니다.',
      );
    }

    // 해당 인원이 이미 그룹 멤버?
    const existingMember = await this.userGroupRepository.findOne({
      where: { group: { groupId }, user_uuid: inviteeUuid },
    });

    if (existingMember) {
      throw new BadRequestException('이미 그룹 멤버입니다.');
    }

    // 이미 초대를 보낸 상태라면?
    const existingInvitation = await this.groupInvitationRepository.findOne({
      where: {
        group: { groupId },
        inviteeUuid,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new BadRequestException('이미 대기 중인 초대가 있습니다.');
    }

    const newInvitation = this.groupInvitationRepository.create({
      group: { groupId },
      inviterUuid,
      inviteeUuid,
      status: InvitationStatus.PENDING,
    });

    const savedInvitation =
      await this.groupInvitationRepository.save(newInvitation);

    return {
      message: '초대가 성공적으로 보내졌습니다.',
      invitationId: savedInvitation.groupInvitationId,
    };
  }

  async respondToInvitation(respondDto: RespondToInvitationDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invitation = await this.groupInvitationRepository.findOne({
        where: { groupInvitationId: respondDto.invitationId },
        relations: ['group'],
      });

      if (!invitation) {
        throw new NotFoundException('초대를 찾을 수 없습니다.');
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new BadRequestException('유효하지 않은 초대입니다.');
      }

      if (respondDto.status !== InvitationStatus.ACCEPTED) {
        invitation.status = respondDto.status;
        await queryRunner.manager.save(invitation);
        await queryRunner.commitTransaction();
        return;
      }

      // 초대 수락 처리
      invitation.status = InvitationStatus.ACCEPTED;
      await queryRunner.manager.save(invitation);

      // UserGroup에 새 멤버 추가
      const newUserGroup = this.userGroupRepository.create({
        user_uuid: invitation.inviteeUuid,
        group: invitation.group,
        isAdmin: false,
      });
      await queryRunner.manager.save(newUserGroup);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        '초대 응답 처리 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getInvitation(invitationId: number): Promise<GroupInvitation> {
    const invitation = await this.groupInvitationRepository.findOne({
      where: { groupInvitationId: invitationId },
      relations: ['group'],
    });

    if (!invitation) {
      throw new NotFoundException(
        `초대 ID ${invitationId}를 찾을 수 없습니다.`,
      );
    }

    return invitation;
  }
}
