import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from 'src/entities/schedule.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from '../categories/categories.module';
import { VoiceTranscriptionService } from './voice-transcription.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule]),
    HttpModule,
    ConfigModule,
    CategoriesModule,
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService, VoiceTranscriptionService],
})
export class SchedulesModule {}
