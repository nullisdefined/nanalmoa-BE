import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from '@/entities/auth.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {}

  async getUserByUuid(userUuid: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userUuid } });
    if (!user) {
      throw new NotFoundException(
        `사용자 UUID ${userUuid}를 찾을 수 없습니다.`,
      );
    }
    return user;
  }
}
