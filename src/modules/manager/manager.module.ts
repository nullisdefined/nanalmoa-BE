import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerInvitation } from '@/entities/manager-invitation.entity';
import { ManagerSubordinate } from '@/entities/manager-subordinate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ManagerInvitation, ManagerSubordinate])],
  providers: [ManagerService],
  controllers: [ManagerController],
  exports: [ManagerService],
})
export class ManagerModule {}