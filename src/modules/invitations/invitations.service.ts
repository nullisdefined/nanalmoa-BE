import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { GroupInvitation } from 'src/entities/group-invitation.entity';
import {
  InvitationStatus,
  ManagerInvitation,
} from 'src/entities/manager-invitation.entity';
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
      where: [
        { inviterUuid: userUuid, status: Not(InvitationStatus.REMOVED) },
        { inviteeUuid: userUuid, status: Not(InvitationStatus.REMOVED) },
      ],
      relations: ['group'],
    });

    const managerInvitations = await this.managerInvitationRepository.find({
      where: [
        { managerUuid: userUuid, status: Not(InvitationStatus.REMOVED) },
        { subordinateUuid: userUuid, status: Not(InvitationStatus.REMOVED) },
      ],
    });

    const combinedInvitations: InvitationsDto[] = await Promise.all([
      ...groupInvitations.map(async (inv) => {
        const inviter = await this.usersService.findOne(inv.inviterUuid);
        const invitee = await this.usersService.findOne(inv.inviteeUuid);
        return {
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
          inviterName: inviter.name,
          inviteeUuid: inv.inviteeUuid,
          inviteeName: invitee.name,
          groupId: inv.group.groupId,
          groupName: inv.group.groupName,
        };
      }),
      ...managerInvitations.map(async (inv) => {
        const manager = await this.usersService.findOne(inv.managerUuid);
        const subordinate = await this.usersService.findOne(
          inv.subordinateUuid,
        );
        return {
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
          inviterName: manager.name,
          inviteeUuid: inv.subordinateUuid,
          inviteeName: subordinate.name,
        };
      }),
    ]);

    combinedInvitations.sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );

    return combinedInvitations;
  }
}
