import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerInvitation } from '@/entities/manager-invitation.entity';
import { ManagerSubordinate } from '@/entities/manager-subordinate.entity';
import { User } from '@/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Auth } from '@/entities/auth.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ManagerInvitation,
      ManagerSubordinate,
      User,
      Auth,
    ]),
  ],
  providers: [ManagerService, UsersService],
  controllers: [ManagerController],
  exports: [ManagerService],
})
export class ManagerModule {}
