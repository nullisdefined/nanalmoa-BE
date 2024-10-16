import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Group } from '@/entities/group.entity';
import { UserGroup } from '@/entities/user-group.entity';
import { GroupInfoResponseDto } from './dto/response-group.dto';
import { InviteGroupMemberDto } from './dto/invite-group-memeber.dto';
import { GroupInvitation } from '@/entities/group-invitation.entity';
import { InvitationStatus } from '@/entities/manager-invitation.entity';
import { RespondToInvitationDto } from './dto/response-invitation.dto';
import { GroupMemberResponseDto } from './dto/response-group-member.dto';
import { RemoveGroupMemberDto } from './dto/remove-group-member.dto';
import { UsersService } from '../users/users.service';
import { GroupDetailResponseDto } from './dto/response-group-detail.dto';
import { GroupInvitationDetailDto } from './dto/response-group-invitation-detail.dto';
import { Schedule } from '@/entities/schedule.entity';
import { GroupSchedule } from '@/entities/group-schedule.entity';
import { GroupInfo } from '../schedules/dto/create-schedule.dto';
import { UserInfo } from '../users/dto/user-info-detail.dto';
import { User } from '@/entities/user.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(UserGroup)
    private userGroupRepository: Repository<UserGroup>,
    @InjectRepository(GroupInvitation)
    private groupInvitationRepository: Repository<GroupInvitation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private usersService: UsersService,
    @InjectRepository(GroupSchedule)
    private groupScheduleRepository: Repository<GroupSchedule>,
  ) {}

  async createGroup(
    createGroupDto: CreateGroupDto,
  ): Promise<GroupInfoResponseDto> {
    const { groupName, creatorUuid } = createGroupDto;

    const existingGroup = await this.userGroupRepository.findOne({
      where: { userUuid: creatorUuid },
      relations: ['group'],
    });

    if (existingGroup && existingGroup.group.groupName === groupName) {
      throw new BadRequestException(
        '동일 그룹명을 가진 그룹에 소속되어 있습니다.',
      );
    }

    const newGroup = this.groupRepository.create({ groupName });
    const savedGroup = await this.groupRepository.save(newGroup);

    const userGroup = this.userGroupRepository.create({
      userUuid: creatorUuid,
      group: savedGroup,
      isAdmin: true,
    });
    await this.userGroupRepository.save(userGroup);

    const response: GroupInfoResponseDto = {
      groupId: savedGroup.groupId,
      groupName: savedGroup.groupName,
      createdAt: savedGroup.createdAt,
      memberCount: 1,
      isAdmin: true,
    };

    return response;
  }

  async inviteGroupMembers(
    inviteGroupMemberDto: InviteGroupMemberDto,
    inviterUuid: string,
  ) {
    const { groupId, inviteeUuids } = inviteGroupMemberDto;

    const group = await this.groupRepository.findOne({
      where: { groupId },
      relations: ['userGroups'],
    });
    if (!group) {
      throw new NotFoundException('해당 그룹을 찾지 못했습니다.');
    }

    // 5. 초대자가 그룹장인지 확인
    const isCreator = group.userGroups.some(
      (ug) => ug.userUuid === inviterUuid && ug.isAdmin,
    );
    if (!isCreator) {
      throw new ForbiddenException('그룹 생성자만이 초대를 할 수 있습니다.');
    }

    const results = await Promise.all(
      inviteeUuids.map(async (inviteeUuid) => {
        try {
          // 자기 자신을 초대하지 못하도록 체크
          if (inviteeUuid === inviterUuid) {
            throw new BadRequestException('자기 자신을 초대할 수 없습니다.');
          }

          // 유저 존재 여부 체크
          const userExists =
            await this.usersService.checkUserExists(inviteeUuid);
          if (!userExists) {
            throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
          }

          // 해당 그룹에 이미 속해 있는지 체크
          const existingMember = await this.userGroupRepository.findOne({
            where: { group: { groupId }, userUuid: inviteeUuid },
          });
          if (existingMember) {
            throw new BadRequestException('이미 그룹의 멤버입니다.');
          }

          // 기존 보내고 있는 초대가 없어야 함 (ACCEPTED, PENDING 상태가 아니어야 함)
          const existingInvitation =
            await this.groupInvitationRepository.findOne({
              where: {
                group: { groupId },
                inviteeUuid,
                status: In([
                  InvitationStatus.ACCEPTED,
                  InvitationStatus.PENDING,
                ]),
              },
            });

          if (existingInvitation) {
            if (existingInvitation.status === InvitationStatus.ACCEPTED) {
              throw new BadRequestException('이미 수락된 초대가 있습니다.');
            } else {
              throw new BadRequestException('이미 대기 중인 초대가 있습니다.');
            }
          }

          // 모든 조건을 만족하면 새로운 초대 생성
          const newInvitation = this.groupInvitationRepository.create({
            group: { groupId },
            inviterUuid,
            inviteeUuid,
            status: InvitationStatus.PENDING,
          });

          const savedInvitation =
            await this.groupInvitationRepository.save(newInvitation);
          return {
            inviteeUuid,
            status: InvitationStatus.PENDING,
            invitationId: savedInvitation.groupInvitationId,
          };
        } catch (error) {
          return { inviteeUuid, message: error.message };
        }
      }),
    );

    return {
      results,
    };
  }

  async acceptInvitation(id: number, inviteeUuid: string) {
    const invitation = await this.getInvitation(id);

    if (invitation.inviteeUuid !== inviteeUuid) {
      throw new UnauthorizedException('초대받은 사람만이 수락할 수 있습니다.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ForbiddenException('현재 수신 중인 초대만 수락할 수 있습니다.');
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      invitation.status = InvitationStatus.ACCEPTED;
      await transactionalEntityManager.save(invitation);

      const group = await transactionalEntityManager.findOne(Group, {
        where: { groupId: invitation.group.groupId },
      });

      if (!group) {
        throw new NotFoundException(
          `해당 그룹 ID : ${invitation.group.groupId} 를 가진 그룹은 없습니다.`,
        );
      }

      const userGroup = new UserGroup();
      userGroup.userUuid = invitation.inviteeUuid;
      userGroup.group = group;
      userGroup.isAdmin = false;
      await transactionalEntityManager.save(userGroup);
    });

    return { message: '초대가 성공적으로 수락되었습니다.' };
  }

  async rejectInvitation(id: number, inviteeUuid: string) {
    const invitation = await this.getInvitation(id);

    if (invitation.inviteeUuid !== inviteeUuid) {
      throw new UnauthorizedException('초대받은 사람만이 거절할 수 있습니다.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ForbiddenException('현재 수신 중인 초대만 거절할 수 있습니다');
    }

    invitation.status = InvitationStatus.REJECTED;
    await this.groupInvitationRepository.save(invitation);

    return { message: '초대가 성공적으로 거절되었습니다.' };
  }

  async cancelInvitation(id: number, inviterUuid: string) {
    const invitation = await this.getInvitation(id);

    if (invitation.inviterUuid !== inviterUuid) {
      throw new UnauthorizedException('초대한 사람만이 철회할 수 있습니다');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ForbiddenException('현재 수신 중인 초대만 철회할 수 있습니다');
    }

    invitation.status = InvitationStatus.CANCELED;
    await this.groupInvitationRepository.save(invitation);

    return { message: '초대가 성공적으로 철회되었습니다.' };
  }

  async getSentInvitations(
    userUuid: string,
  ): Promise<RespondToInvitationDto[]> {
    const invitations = await this.groupInvitationRepository.find({
      where: { inviterUuid: userUuid },
      relations: ['group'],
      order: { updatedAt: 'DESC' },
    });

    return invitations.map((invitation) => ({
      invitationId: invitation.groupInvitationId,
      groupId: invitation.group.groupId,
      inviterUuid: invitation.inviterUuid,
      inviteeUuid: invitation.inviteeUuid,
      status: invitation.status,
    }));
  }

  async getReceivedInvitations(
    userUuid: string,
  ): Promise<RespondToInvitationDto[]> {
    const invitations = await this.groupInvitationRepository.find({
      where: { inviteeUuid: userUuid },
      relations: ['group'],
      order: { updatedAt: 'DESC' },
    });

    return invitations.map((invitation) => ({
      invitationId: invitation.groupInvitationId,
      groupId: invitation.group.groupId,
      inviterUuid: invitation.inviterUuid,
      inviteeUuid: invitation.inviteeUuid,
      status: invitation.status,
    }));
  }

  private async getInvitation(invitationId: number): Promise<GroupInvitation> {
    const invitation = await this.groupInvitationRepository.findOne({
      where: { groupInvitationId: invitationId },
      relations: ['group'],
      order: { updatedAt: 'DESC' },
    });

    if (!invitation) {
      throw new NotFoundException(
        `초대 ID ${invitationId}를 찾을 수 없습니다.`,
      );
    }

    return invitation;
  }

  async deleteGroup(groupId: number, adminUuid: string): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { groupId },
      relations: ['userGroups'],
    });

    if (!group) {
      throw new NotFoundException('해당 그룹을 찾을 수 없습니다.');
    }

    const adminUserGroup = group.userGroups.find(
      (ug) => ug.userUuid === adminUuid && ug.isAdmin,
    );

    if (!adminUserGroup) {
      throw new ForbiddenException(
        '그룹 관리자만이 그룹을 삭제할 수 있습니다.',
      );
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.delete(GroupInvitation, {
        group: { groupId },
      });

      await transactionalEntityManager.delete(UserGroup, {
        group: { groupId },
      });

      await transactionalEntityManager.delete(Group, { groupId });
    });
  }

  async getUserGroups(userUuid: string): Promise<GroupInfoResponseDto[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { userUuid: userUuid },
      relations: ['group'],
    });

    if (!userGroups || userGroups.length === 0) {
      return [];
    }

    const groupIds = userGroups.map((ug) => ug.group.groupId);

    // 멤버 수 계산
    const memberCounts = await this.groupRepository
      .createQueryBuilder('group')
      .select('group.groupId', 'groupId')
      .addSelect('COUNT(userGroup.userGroupId)', 'memberCount')
      .leftJoin('group.userGroups', 'userGroup')
      .where('group.groupId IN (:...groupIds)', { groupIds })
      .groupBy('group.groupId')
      .getRawMany();

    // 맵 변환 : 빠른 접근!
    const memberCountMap = new Map(
      memberCounts.map((mc) => [mc.groupId, parseInt(mc.memberCount)]),
    );

    return userGroups
      .map((userGroup) => {
        if (!userGroup.group) {
          console.error(
            `해당 유저 그룹 ID : ${userGroup.userGroupId} 를 가진 그룹을 찾을 수 없습니다.`,
          );
          return null;
        }
        return {
          groupId: userGroup.group.groupId,
          groupName: userGroup.group.groupName,
          createdAt: userGroup.group.createdAt,
          memberCount: memberCountMap.get(userGroup.group.groupId) || 0,
          isAdmin: userGroup.isAdmin,
        };
      })
      .filter(Boolean); // null 값 제거
  }

  async getGroupMembers(
    groupId: number,
    requestingUserUuid: string,
  ): Promise<GroupMemberResponseDto[]> {
    // 먼저 요청한 사용자가 해당 그룹의 멤버인지 확인
    const requestingUserGroup = await this.userGroupRepository.findOne({
      where: { group: { groupId }, userUuid: requestingUserUuid },
    });

    if (!requestingUserGroup) {
      throw new ForbiddenException('당신은 해당 그룹의 멤버가 아닙니다.');
    }

    const userGroups = await this.userGroupRepository.find({
      where: { group: { groupId } },
      order: { createdAt: 'ASC' },
    });

    if (!userGroups || userGroups.length === 0) {
      throw new NotFoundException(
        `해당 그룹 ID : ${groupId} 를 가진 그룹의 구성원이 없습니다.`,
      );
    }

    const groupMembers: GroupMemberResponseDto[] = await Promise.all(
      userGroups.map(async (userGroup) => {
        const user = await this.usersService.findOne(userGroup.userUuid);
        return {
          userUuid: userGroup.userUuid,
          name: user.name,
          isAdmin: userGroup.isAdmin,
          joinedAt: userGroup.createdAt,
        };
      }),
    );

    return groupMembers;
  }
  async removeGroupMember(
    removeGroupMemberDto: RemoveGroupMemberDto,
    adminUuid: string,
  ): Promise<void> {
    const { groupId, memberUuid } = removeGroupMemberDto;
    console.log(removeGroupMemberDto);
    // 그룹 존재 여부 확인
    const group = await this.groupRepository.findOne({
      where: { groupId },
      relations: ['userGroups'],
    });

    if (!group) {
      throw new NotFoundException('해당 그룹을 찾을 수 없습니다.');
    }

    // 요청자가 그룹의 관리자인지 확인
    const adminUserGroup = group.userGroups.find(
      (ug) => ug.userUuid === adminUuid && ug.isAdmin,
    );
    if (!adminUserGroup) {
      throw new ForbiddenException(
        '그룹 관리자만이 멤버를 추방할 수 있습니다.',
      );
    }

    // 추방할 멤버가 그룹에 존재하는지 확인
    const memberUserGroup = await this.userGroupRepository.findOne({
      where: { group: { groupId }, userUuid: memberUuid },
    });

    if (!memberUserGroup) {
      throw new NotFoundException('해당 멤버를 그룹에서 찾을 수 없습니다.');
    }

    // 관리자가 자신을 추방하려는 경우 방지
    if (adminUuid === memberUuid) {
      throw new ForbiddenException('자신을 그룹에서 추방할 수 없습니다.');
    }

    // 멤버 추방 (UserGroup 엔티티 삭제)
    await this.userGroupRepository.remove(memberUserGroup);

    // GroupInvitation 상태를 REMOVED로 업데이트
    const invitation = await this.groupInvitationRepository.findOne({
      where: { group: { groupId }, inviteeUuid: memberUuid },
    });

    if (invitation) {
      invitation.status = InvitationStatus.REMOVED;
      await this.groupInvitationRepository.save(invitation);
    }
  }
  async getGroupDetail(
    groupId: number,
    userUuid: string,
  ): Promise<GroupDetailResponseDto> {
    const group = await this.groupRepository.findOne({
      where: { groupId },
      relations: ['userGroups'],
    });

    if (!group) {
      throw new NotFoundException('해당 그룹을 찾을 수 없습니다.');
    }

    const userGroup = group.userGroups.find((ug) => ug.userUuid === userUuid);

    if (!userGroup) {
      throw new ForbiddenException('당신은 해당 그룹의 멤버가 아닙니다.');
    }

    const memberCount = group.userGroups.length;

    const members: GroupMemberResponseDto[] = await Promise.all(
      group.userGroups.map(async (ug) => {
        const user = await this.usersService.findOne(ug.userUuid);
        return {
          userUuid: ug.userUuid,
          name: user.name,
          isAdmin: ug.isAdmin,
          joinedAt: ug.createdAt,
        };
      }),
    );

    // 가입 일시순으로 정렬
    members.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

    return {
      groupId: group.groupId,
      groupName: group.groupName,
      createdAt: group.createdAt,
      memberCount,
      isAdmin: userGroup.isAdmin,
      members,
    };
  }

  async getGroupInvitationDetail(
    invitationId: number,
  ): Promise<GroupInvitationDetailDto> {
    const invitation = await this.groupInvitationRepository.findOne({
      where: { groupInvitationId: invitationId },
      relations: ['group'],
    });

    if (!invitation) {
      throw new NotFoundException(
        `초대 ID ${invitationId}를 찾을 수 없습니다.`,
      );
    }

    const inviter = await this.usersService.findOne(invitation.inviterUuid);
    const invitee = await this.usersService.findOne(invitation.inviteeUuid);

    return {
      inviterUuid: invitation.inviterUuid,
      inviterName: inviter.name,
      inviteeUuid: invitation.inviteeUuid,
      inviteeName: invitee.name,
      groupName: invitation.group.groupName,
      groupId: invitation.group.groupId,
      status: invitation.status,
    };
  }

  async linkScheduleToGroupsAndUsers(
    schedule: Schedule,
    groupInfo: GroupInfo[],
  ): Promise<void> {
    for (const info of groupInfo) {
      const group = await this.groupRepository.findOne({
        where: { groupId: info.groupId },
      });
      if (!group) {
        throw new BadRequestException(
          `그룹 ID ${info.groupId}를 찾을 수 없습니다.`,
        );
      }

      for (const userUuid of info.userUuids) {
        const groupSchedule = this.groupScheduleRepository.create({
          userUuid,
          group,
          schedule,
        });
        await this.groupScheduleRepository.save(groupSchedule);
      }
    }
  }

  async getUsersForGroup(groupId: number): Promise<UserInfo[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { group: { groupId } },
      relations: ['group'],
    });

    if (userGroups.length === 0) {
      throw new NotFoundException(
        `해당 그룹ID :  ${groupId} 를 가진 그룹의 멤버가 없습니다.`,
      );
    }

    const userUuids = userGroups.map((ug) => ug.userUuid);

    // findByIds 대신 where 조건을 사용하여 쿼리 수행
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.userUuid IN (:...userUuids)', { userUuids })
      .getMany();

    return users.map((user) => ({
      userUuid: user.userUuid,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
      isAdmin: userGroups.find((ug) => ug.userUuid === user.userUuid).isAdmin,
    }));
  }

  async removeGroupMembersFromSchedule(
    scheduleId: number,
    groupInfo: GroupInfo[],
  ): Promise<void> {
    for (const group of groupInfo) {
      try {
        const groupUsers = await this.getUsersForGroup(group.groupId);
        const validUserUuids = groupUsers.map((user) => user.userUuid);

        for (const userUuid of group.userUuids) {
          if (validUserUuids.includes(userUuid)) {
            await this.groupScheduleRepository.delete({
              schedule: { scheduleId },
              group: { groupId: group.groupId },
              userUuid,
            });
          } else {
            console.warn(
              `사용자 ${userUuid}는 그룹 ${group.groupId}의 멤버가 아닙니다. 제거를 건너뜁니다.`,
            );
          }
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          console.error(
            `그룹 ${group.groupId}에 대한 사용자 정보를 찾을 수 없습니다: ${error.message}`,
          );
        } else {
          throw new InternalServerErrorException(
            `그룹 멤버 제거 중 오류가 발생했습니다: ${error.message}`,
          );
        }
      }
    }
  }
}
