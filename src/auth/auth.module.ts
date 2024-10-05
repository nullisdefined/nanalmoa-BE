import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from 'src/entities/auth.entity';
import { User } from 'src/entities/user.entity';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { CoolSmsService } from './coolsms.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Auth, User]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    KakaoStrategy,
    NaverStrategy,
    JwtStrategy,
    CoolSmsService,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
