import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { Auth } from '@/entities/auth.entity';
import { AuthModule } from '@/auth/auth.module';
import { UserRoutine } from '@/entities/user-routine.entity';
import { UsersRoutineController } from './users-routine.controller';
import { UsersRoutineService } from './users-routine.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth, User, AuthModule, UserRoutine]),
    AuthModule,
  ],
  controllers: [UsersController, UsersRoutineController],
  providers: [UsersService, UsersRoutineService],
  exports: [UsersService, UsersRoutineService],
})
export class UsersModule {}
