import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from 'src/entities/schedule.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from '../categories/categories.module';
import { VoiceTranscriptionService } from './voice-transcription.service';
import { OCRTranscriptionService } from './OCR-transcription.service';
import { User } from '@/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Auth } from '@/entities/auth.entity';
import { UsersModule } from '../users/users.module';
import { ManagerModule } from '../manager/manager.module';
import { GroupModule } from '../group/group.module';
import { GroupSchedule } from '@/entities/group-schedule.entity';
import { Multer } from 'multer';
import { ScheduleRecurring } from '@/entities/schedule-recurring.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Schedule,
      User,
      Auth,
      GroupSchedule,
      ScheduleRecurring,
    ]),
    HttpModule,
    ConfigModule,
    CategoriesModule,
    UsersModule,
    ManagerModule,
    GroupModule,
  ],
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    VoiceTranscriptionService,
    OCRTranscriptionService,
    UsersService,
  ],
})
export class SchedulesModule {}
