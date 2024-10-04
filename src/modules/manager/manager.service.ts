import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ManagerInvitation,
  InvitationStatus,
} from 'src/entities/manager-invitation.entity';
import { ManagerSubordinate } from 'src/entities/manager-subordinate.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationStatusDto } from './dto/update-invitation.dto';
import {
  GetInvitationReceivedDto,
  GetInvitationSendDto,
} from './dto/get-invitation.dto';
import { CreateManagerSubordinateDto } from './dto/create-manager.dto';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);
  constructor(
    @InjectRepository(ManagerInvitation)
    private managerInvitationRepository: Repository<ManagerInvitation>,
    @InjectRepository(ManagerSubordinate)
    private managerSubordinateRepository: Repository<ManagerSubordinate>,
  ) {}

  async createInvitation(
    createInvitationDto: CreateInvitationDto,
  ): Promise<ManagerInvitation> {
    try {
      const invitation =
        this.managerInvitationRepository.create(createInvitationDto);
      return await this.managerInvitationRepository.save(invitation);
    } catch (error) {
      this.logger.error(`초대장 생성 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        '초대장 생성 중 오류가 발생했습니다.',
      );
    }
  }

  async getInvitation(id: number): Promise<ManagerInvitation> {
    if (isNaN(id)) {
      throw new BadRequestException('유효하지 않은 초대장 ID입니다.');
    }
    const invitation = await this.managerInvitationRepository.findOne({
      where: { managerInvitationId: id },
    });
    if (!invitation) {
      throw new NotFoundException(`ID가 ${id}인 초대장을 찾을 수 없습니다.`);
    }
    return invitation;
  }

  async updateInvitationStatus(
    id: number,
    updateInvitationStatusDto: UpdateInvitationStatusDto,
  ): Promise<ManagerInvitation> {
    const invitation = await this.getInvitation(id);

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `ID가 ${id}인 초대장은 이미 ${invitation.status} 상태입니다.`,
      );
    }

    invitation.status = updateInvitationStatusDto.status;
    await this.managerInvitationRepository.save(invitation);

    if (updateInvitationStatusDto.status === InvitationStatus.ACCEPTED) {
      await this.createManagerSubordinate(invitation);
    }

    return invitation;
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
  ): Promise<ManagerInvitation[]> {
    try {
      const invitations = await this.managerInvitationRepository.find({
        where: { managerUuid: getInvitationSendDto.managerUuid },
      });
      this.logger.log(
        `관리자 ${getInvitationSendDto.managerUuid}가 보낸 ${invitations.length}개의 초대장을 조회했습니다.`,
      );
      return invitations;
    } catch (error) {
      this.logger.error(`보낸 초대장 조회 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        '보낸 초대장 조회 중 오류가 발생했습니다.',
      );
    }
  }

  async getInvitationReceived(
    getInvitationReceivedDto: GetInvitationReceivedDto,
  ): Promise<ManagerInvitation[]> {
    try {
      const invitations = await this.managerInvitationRepository.find({
        where: { subordinateUuid: getInvitationReceivedDto.subordinateUuid },
      });
      this.logger.log(
        `부하 ${getInvitationReceivedDto.subordinateUuid}가 받은 ${invitations.length}개의 초대장을 조회했습니다.`,
      );
      return invitations;
    } catch (error) {
      this.logger.error(`받은 초대장 조회 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        '받은 초대장 조회 중 오류가 발생했습니다.',
      );
    }
  }

  async getInvitationUsers(
    createManagerSubordinateDto: CreateManagerSubordinateDto,
  ): Promise<ManagerInvitation> {
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
      return invitation;
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
}
