import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { Group } from '@/entities/group.entity';
import { UserGroup } from '@/entities/user-group.entity';
import { GroupSchedule } from '@/entities/group-schedule.entity';
import { GroupInvitation } from '@/entities/group-invitation.entity';
import { UsersModule } from '../users/users.module';
import { User } from '@/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      UserGroup,
      GroupSchedule,
      GroupInvitation,
      User,
    ]),
    UsersModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
