import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from 'src/entities/auth.entity';
import { User } from 'src/entities/user.entity';
import { NaverStrategy } from './strategies/naver.strategy';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([Auth, User]),
    PassportModule.register({ session: true }),
  ],
  controllers: [AuthController],
  providers: [AuthService, KakaoStrategy, NaverStrategy],
})
export class AuthModule {}
