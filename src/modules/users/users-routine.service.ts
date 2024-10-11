import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoutine } from 'src/entities/user-routine.entity';
import { UpdateUserRoutineDto } from './dto/update-user-routine.dto';
import { UserRoutineResponseDto } from './dto/response-user-routine.dto';
import { UsersService } from './users.service';

@Injectable()
export class UsersRoutineService {
  constructor(
    @InjectRepository(UserRoutine)
    private userRoutineRepository: Repository<UserRoutine>,
    private usersService: UsersService,
  ) {}

  async updateUserRoutine(
    userUuid: string,
    updateDto: UpdateUserRoutineDto,
  ): Promise<UserRoutineResponseDto> {
    if (!userUuid) {
      throw new BadRequestException('User UUID is required');
    }

    await this.usersService.checkUserExists(userUuid);

    let userRoutine = await this.userRoutineRepository.findOne({
      where: { userUuid },
    });

    if (userRoutine) {
      // 기존 레코드가 있는 경우, 받은 필드만 업데이트
      Object.assign(userRoutine, updateDto);
    } else {
      // 기존 레코드가 없는 경우, 기본값으로 초기화 후 받은 필드 업데이트
      userRoutine = this.userRoutineRepository.create({
        ...this.getDefaultRoutine(userUuid),
        ...updateDto,
        userUuid, // userUuid를 명시적으로 설정
      });
    }

    // 시간 순서 검증
    this.validateTimeOrder(userRoutine);

    await this.userRoutineRepository.save(userRoutine);

    return this.mapToResponseDto(userRoutine);
  }

  async getUserRoutine(userUuid: string): Promise<UserRoutineResponseDto> {
    if (!userUuid) {
      throw new BadRequestException('User UUID is required');
    }

    await this.usersService.checkUserExists(userUuid);

    const userRoutine = await this.userRoutineRepository.findOne({
      where: { userUuid },
    });
    if (!userRoutine) {
      // 레코드가 없을 경우 기본 시간대 반환
      return this.mapToResponseDto(this.getDefaultRoutine(userUuid));
    }
    return this.mapToResponseDto(userRoutine);
  }

  private validateTimeOrder(routine: UserRoutine) {
    const times = [
      routine.wakeUpTime,
      routine.breakfastTime,
      routine.lunchTime,
      routine.dinnerTime,
      routine.bedTime,
    ];

    for (let i = 1; i < times.length; i++) {
      if (
        new Date(`1970-01-01T${times[i]}`) <=
        new Date(`1970-01-01T${times[i - 1]}`)
      ) {
        throw new Error('시간 순서가 올바르지 않습니다.');
      }
    }
  }

  private mapToResponseDto(routine: UserRoutine): UserRoutineResponseDto {
    return {
      userUuid: routine.userUuid,
      wakeUpTime: routine.wakeUpTime,
      breakfastTime: routine.breakfastTime,
      lunchTime: routine.lunchTime,
      dinnerTime: routine.dinnerTime,
      bedTime: routine.bedTime,
    };
  }

  private getDefaultRoutine(userUuid: string): UserRoutine {
    return {
      userUuid,
      wakeUpTime: '07:00',
      breakfastTime: '08:00',
      lunchTime: '12:00',
      dinnerTime: '18:00',
      bedTime: '22:00',
    } as UserRoutine;
  }
}
