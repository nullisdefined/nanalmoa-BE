import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ManagerInvitation,
  InvitationStatus,
} from 'src/entities/manager-invitation.entity';
import { ManagerSubordinate } from 'src/entities/manager-subordinate.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import {
  GetInvitationReceivedDto,
  GetInvitationSendDto,
} from './dto/get-invitation.dto';
import { CreateManagerSubordinateDto } from './dto/create-manager.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { InvitationResponseDto } from './dto/response-invitation.dto';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);
  constructor(
    @InjectRepository(ManagerInvitation)
    private managerInvitationRepository: Repository<ManagerInvitation>,
    @InjectRepository(ManagerSubordinate)
    private managerSubordinateRepository: Repository<ManagerSubordinate>,
    private usersService: UsersService,
  ) {}

  private async validateUsers(
    createInvitationDto: CreateInvitationDto,
  ): Promise<void> {
    const [managerExists, subordinateExists] = await Promise.all([
      this.usersService.checkUserExists(createInvitationDto.managerUuid),
      this.usersService.checkUserExists(createInvitationDto.subordinateUuid),
    ]);
    if (!managerExists) {
      throw new NotFoundException(
        `관리자 UUID ${createInvitationDto.managerUuid}를 찾을 수 없습니다.`,
      );
    }

    if (!subordinateExists) {
      throw new NotFoundException(
        `피관리자 UUID ${createInvitationDto.subordinateUuid}를 찾을 수 없습니다.`,
      );
    }

    if (
      createInvitationDto.managerUuid === createInvitationDto.subordinateUuid
    ) {
      throw new BadRequestException(
        `관리자 UUID ${createInvitationDto.managerUuid}와 피관리자 UUID ${createInvitationDto.managerUuid}를 같게 설정할 수 없습니다.`,
      );
    }
  }

  async getInvitation(id: number): Promise<InvitationResponseDto> {
    if (isNaN(id)) {
      throw new BadRequestException('유효하지 않은 초대장 ID입니다.');
    }
    const invitation = await this.managerInvitationRepository.findOne({
      where: { managerInvitationId: id },
    });
    if (!invitation) {
      throw new NotFoundException(`ID가 ${id}인 초대장을 찾을 수 없습니다.`);
    }

    const manager = await this.usersService.findOne(invitation.managerUuid);
    const subordinate = await this.usersService.findOne(invitation.managerUuid);

    return {
      ...invitation,
      managerName: manager.name,
      subordinateName: subordinate.name,
    };
  }

  async createInvitation(
    createInvitationDto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    try {
      await this.validateUsers(createInvitationDto);
      const { managerUuid, subordinateUuid } = createInvitationDto;

      const existingInvitation = await this.managerInvitationRepository.findOne(
        {
          where: {
            managerUuid,
            subordinateUuid,
            status: InvitationStatus.PENDING,
          },
        },
      );

      if (existingInvitation) {
        throw new BadRequestException('이미 대기 중인 초대가 있습니다.');
      }

      const existingRelation = await this.managerSubordinateRepository.findOne({
        where: { managerUuid, subordinateUuid },
      });

      if (existingRelation) {
        throw new BadRequestException(
          '이미 관리자-피관리자 관계가 존재합니다.',
        );
      }

      const invitation = this.managerInvitationRepository.create({
        managerUuid,
        subordinateUuid,
        status: InvitationStatus.PENDING,
      });

      const manager = this.usersService.findOne(managerUuid);
      const subordinate = this.usersService.findOne(subordinateUuid);
      await this.managerInvitationRepository.save(invitation);

      return {
        ...invitation,
        managerName: (await manager).name,
        subordinateName: (await subordinate).name,
      };
    } catch (error) {
      this.logger.error(`초대장 생성 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        '초대장 생성 중 오류가 발생했습니다.',
      );
    }
  }
  async acceptInvitation(
    id: number,
    subordinateUuid: string,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.getInvitation(id);

    if (invitation.subordinateUuid !== subordinateUuid) {
      throw new ForbiddenException('초대를 수락할 권한이 없습니다.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('대기 중인 초대만 수락할 수 있습니다.');
    }

    invitation.status = InvitationStatus.ACCEPTED;
    await this.managerInvitationRepository.save(invitation);
    await this.createManagerSubordinate(invitation);

    return invitation;
  }

  async rejectInvitation(
    id: number,
    subordinateUuid: string,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.getInvitation(id);

    if (invitation.subordinateUuid !== subordinateUuid) {
      throw new ForbiddenException('초대를 거절할 권한이 없습니다.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('대기 중인 초대만 거절할 수 있습니다.');
    }

    invitation.status = InvitationStatus.REJECTED;
    return await this.managerInvitationRepository.save(invitation);
  }

  async cancelInvitation(
    id: number,
    managerUuid: string,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.getInvitation(id);

    if (invitation.managerUuid !== managerUuid) {
      throw new ForbiddenException('초대를 철회할 권한이 없습니다.');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('대기 중인 초대만 철회할 수 있습니다.');
    }

    invitation.status = InvitationStatus.CANCELED;
    return await this.managerInvitationRepository.save(invitation);
  }

  async removeManagerSubordinate(
    managerUuid: string,
    subordinateUuid: string,
  ): Promise<void> {
    const relation = await this.managerSubordinateRepository.findOne({
      where: { managerUuid, subordinateUuid },
    });

    if (!relation) {
      throw new NotFoundException('관리자-피관리자 관계를 찾을 수 없습니다.');
    }

    await this.managerSubordinateRepository.remove(relation);

    const invitation = await this.managerInvitationRepository.findOne({
      where: {
        managerUuid,
        subordinateUuid,
        status: InvitationStatus.ACCEPTED,
      },
    });

    if (invitation) {
      invitation.status = InvitationStatus.REMOVED;
      await this.managerInvitationRepository.save(invitation);
    }
  }

  private async createManagerSubordinate(
    invitation: ManagerInvitation,
  ): Promise<void> {
    try {
      const managerSubordinate = this.managerSubordinateRepository.create({
        managerUuid: invitation.managerUuid,
        subordinateUuid: invitation.subordinateUuid,
      });
      await this.managerSubordinateRepository.save(managerSubordinate);
    } catch (error) {
      this.logger.error(
        `관리자-피관리자 관계 생성 실패: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        '관리자-피관리자 관계 생성 중 오류가 발생했습니다.',
      );
    }
  }

  async getInvitationSend(
    getInvitationSendDto: GetInvitationSendDto,
  ): Promise<InvitationResponseDto[]> {
    try {
      const invitations = await this.managerInvitationRepository.find({
        where: { managerUuid: getInvitationSendDto.managerUuid },
      });
      this.logger.log(
        `관리자 ${getInvitationSendDto.managerUuid}가 보낸 ${invitations.length}개의 초대장을 조회했습니다.`,
      );
      const invitationResponses = await Promise.all(
        invitations.map(async (invitation) => {
          const manager = await this.usersService.findOne(
            invitation.managerUuid,
          );
          const subordinate = await this.usersService.findOne(
            invitation.subordinateUuid,
          );
          return {
            ...invitation,
            managerName: manager.name,
            subordinateName: subordinate.name,
          };
        }),
      );
      return invitationResponses;
    } catch (error) {
      this.logger.error(`보낸 초대장 조회 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        '보낸 초대장 조회 중 오류가 발생했습니다.',
      );
    }
  }

  async getInvitationReceived(
    getInvitationReceivedDto: GetInvitationReceivedDto,
  ): Promise<InvitationResponseDto[]> {
    try {
      const invitations = await this.managerInvitationRepository.find({
        where: { subordinateUuid: getInvitationReceivedDto.subordinateUuid },
      });
      const invitationResponses = await Promise.all(
        invitations.map(async (invitation) => {
          const manager = await this.usersService.findOne(
            invitation.managerUuid,
          );
          const subordinate = await this.usersService.findOne(
            invitation.subordinateUuid,
          );
          return {
            ...invitation,
            managerName: manager.name,
            subordinateName: subordinate.name,
          };
        }),
      );

      this.logger.log(
        `부하 ${getInvitationReceivedDto.subordinateUuid}가 받은 ${invitations.length}개의 초대장을 조회했습니다.`,
      );
      return invitationResponses;
    } catch (error) {
      this.logger.error(`받은 초대장 조회 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        '받은 초대장 조회 중 오류가 발생했습니다.',
      );
    }
  }

  async getInvitationUsers(
    createManagerSubordinateDto: CreateManagerSubordinateDto,
  ): Promise<InvitationResponseDto> {
    try {
      const invitation = await this.managerInvitationRepository.findOne({
        where: {
          subordinateUuid: createManagerSubordinateDto.subordinateUuid,
          managerUuid: createManagerSubordinateDto.managerUuid,
        },
      });
      if (!invitation) {
        this.logger.warn(
          `관리자 ${createManagerSubordinateDto.managerUuid}와 피관리자 ${createManagerSubordinateDto.subordinateUuid} 간의 초대장을 찾을 수 없습니다.`,
        );
        throw new NotFoundException(
          '지정된 관리자와 피관리자 간의 초대장을 찾을 수 없습니다.',
        );
      }
      this.logger.log(
        `관리자 ${createManagerSubordinateDto.managerUuid}와 피관리자 ${createManagerSubordinateDto.subordinateUuid} 간의 초대장을 조회했습니다.`,
      );

      const manager = this.usersService.findOne(invitation.managerUuid);
      const subordinate = this.usersService.findOne(invitation.subordinateUuid);

      return {
        ...invitation,
        managerName: (await manager).name,
        subordinateName: (await subordinate).name,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `사용자 간 초대장 조회 실패: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        '사용자 간 초대장 조회 중 오류가 발생했습니다.',
      );
    }
  }
  async getManagerList(subordinateUuid: string): Promise<UserResponseDto[]> {
    try {
      const managerSubordinates = await this.managerSubordinateRepository.find({
        where: { subordinateUuid },
      });

      const managerUuids = managerSubordinates.map((ms) => ms.managerUuid);
      const managers = await this.usersService.getUsersByUuids(managerUuids);

      this.logger.log(
        `사용자 ${subordinateUuid}의 관리자 ${managers.length}명을 조회했습니다.`,
      );
      return managers.map((manager) => new UserResponseDto(manager));
    } catch (error) {
      this.logger.error(`관리자 목록 조회 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        '관리자 목록 조회 중 오류가 발생했습니다.',
      );
    }
  }

  async getSubordinateList(managerUuid: string): Promise<UserResponseDto[]> {
    try {
      const managerSubordinates = await this.managerSubordinateRepository.find({
        where: { managerUuid },
      });

      const subordinateUuids = managerSubordinates.map(
        (ms) => ms.subordinateUuid,
      );
      const subordinates =
        await this.usersService.getUsersByUuids(subordinateUuids);

      this.logger.log(
        `관리자 ${managerUuid}의 피관리자 ${subordinates.length}명을 조회했습니다.`,
      );
      return subordinates.map(
        (subordinate) => new UserResponseDto(subordinate),
      );
    } catch (error) {
      this.logger.error(
        `피관리자 목록 조회 실패: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        '피관리자 목록 조회 중 오류가 발생했습니다.',
      );
    }
  }

  async validateAndCheckManagerRelation(
    managerUuid: string,
    subordinateUuid: string,
  ): Promise<boolean> {
    try {
      await this.validateUsers({ managerUuid, subordinateUuid });

      const relation = await this.managerSubordinateRepository.findOne({
        where: { managerUuid, subordinateUuid },
      });

      if (relation) {
        this.logger.log(
          `사용자 ${managerUuid}는 ${subordinateUuid}의 관리자입니다.`,
        );
        return true;
      } else {
        this.logger.log(
          `사용자 ${managerUuid}는 ${subordinateUuid}의 관리자가 아닙니다.`,
        );
        return false;
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `관리자 관계 확인 중 오류 발생: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        '관리자 관계 확인 중 오류가 발생했습니다.',
      );
    }
  }
}
