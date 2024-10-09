import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '@/entities/group.entity';
import { UserGroup } from '@/entities/user-group.entity';
import { GroupSchedule } from '@/entities/group-schedule.entity';
import { GroupInvitation } from '@/entities/group-invitation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      UserGroup,
      GroupSchedule,
      GroupInvitation,
    ]),
  ],

  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
