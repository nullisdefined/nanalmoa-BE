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
    if (!userUuid) {
      throw new NotFoundException('사용자 UUID가 없습니다.');
    }

    const auth = await this.authRepository.findOne({
      where: { userUuid },
      relations: ['user'],
    });

    if (!auth || !auth.user) {
      throw new NotFoundException(
        `사용자 UUID ${userUuid}를 찾을 수 없습니다.`,
      );
    }

    return auth.user;
  }

  async getUsersByUuids(userUuids: string[]): Promise<User[]> {
    if (!userUuids.length) {
      return [];
    }

    const users = await Promise.all(
      userUuids.map((uuid) => this.getUserByUuid(uuid).catch(() => null)),
    );

    const validUsers = users.filter((user): user is User => user !== null);

    if (validUsers.length !== userUuids.length) {
      throw new NotFoundException('일부 사용자를 찾을 수 없습니다.');
    }

    return validUsers;
  }

  async checkUserExists(userUuid: string): Promise<boolean> {
    try {
      await this.getUserByUuid(userUuid);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  private determineSearchType(
    keyword: string,
  ): 'phoneNumber' | 'name' | 'email' {
    if (/^\d{10,11}$/.test(keyword)) {
      return 'phoneNumber';
    } else if (/^(\d{2,3})-?(\d{3,4})-?(\d{4})$/.test(keyword)) {
      return 'phoneNumber';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(keyword)) {
      return 'email';
    } else {
      return 'name';
    }
  }
  async searchUser(keyword: string): Promise<User[]> {
    const searchType = this.determineSearchType(keyword);
    let users: User[] = [];

    switch (searchType) {
      case 'phoneNumber':
        users = await this.userRepository.find({
          where: [{ phoneNumber: keyword }],
        });
        break;
      case 'email':
        users = await this.userRepository.find({
          where: [{ email: keyword }],
        });
        break;
      case 'name':
        users = await this.userRepository.find({
          where: [{ name: keyword }],
        });
        break;
    }

    return users;
  }

  async updateUser(userUuid: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userUuid } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async isEmailTaken(
    email: string,
    currentUserUuid?: string,
  ): Promise<boolean> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });

    if (currentUserUuid) {
      query.andWhere('user.userUuid != :userUuid', {
        userUuid: currentUserUuid,
      });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async findOne(userUuid: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userUuid } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }
}
