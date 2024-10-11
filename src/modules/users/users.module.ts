import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { Auth } from '@/entities/auth.entity';
import { UserRoutine } from '@/entities/user-routine.entity';
import { UsersRoutineController } from './users-routine.controller';
import { UsersRoutineService } from './users-routine.service';

@Module({
  imports: [TypeOrmModule.forFeature([Auth, User, UserRoutine])],
  controllers: [UsersController, UsersRoutineController],
  providers: [UsersService, UsersRoutineService],
})
export class UsersModule {}
