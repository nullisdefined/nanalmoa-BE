import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupInvitation } from 'src/entities/group-invitation.entity';
import { ManagerInvitation } from 'src/entities/manager-invitation.entity';
import {
  InvitationsDto,
  InvitationsType,
  InvitationsRole,
} from './dto/invitations.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(GroupInvitation)
    private groupInvitationRepository: Repository<GroupInvitation>,
    @InjectRepository(ManagerInvitation)
    private managerInvitationRepository: Repository<ManagerInvitation>,
    private usersService: UsersService,
  ) {}

  async getUserInvitations(userUuid: string): Promise<InvitationsDto[]> {
    const userExists = await this.usersService.checkUserExists(userUuid);
    if (!userExists) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const groupInvitations = await this.groupInvitationRepository.find({
      where: [{ inviterUuid: userUuid }, { inviteeUuid: userUuid }],
      relations: ['group'],
    });

    const managerInvitations = await this.managerInvitationRepository.find({
      where: [{ managerUuid: userUuid }, { subordinateUuid: userUuid }],
    });

    const combinedInvitations: InvitationsDto[] = [
      ...groupInvitations.map((inv) => ({
        id: inv.groupInvitationId,
        type: InvitationsType.GROUP,
        role:
          inv.inviterUuid === userUuid
            ? InvitationsRole.GROUP_ADMIN
            : InvitationsRole.GROUP_MEMBER,
        status: inv.status,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        inviterUuid: inv.inviterUuid,
        inviteeUuid: inv.inviteeUuid,
        groupId: inv.group.groupId,
        groupName: inv.group.groupName,
      })),
      ...managerInvitations.map((inv) => ({
        id: inv.managerInvitationId,
        type: InvitationsType.MANAGER,
        role:
          inv.managerUuid === userUuid
            ? InvitationsRole.MANAGER
            : InvitationsRole.SUBORDINATE,
        status: inv.status,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        inviterUuid: inv.managerUuid,
        inviteeUuid: inv.subordinateUuid,
      })),
    ];

    combinedInvitations.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return combinedInvitations;
  }
}
