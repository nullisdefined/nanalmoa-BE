import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('KAKAO_CLIENT_ID');
    const clientSecret = configService.get<string>('KAKAO_CLIENT_SECRET');
    const callbackURL = configService.get<string>('KAKAO_REDIRECT_URI');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'Kakao OAuth configuration is incomplete. Check your environment variables.',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
    });

    console.log('Kakao Strategy initialized with:', { clientID, callbackURL });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    const { id, username, _json } = profile;
    const user = {
      id: id,
      name: username,
      email: _json?.kakao_account?.email,
    };

    done(null, user);
  }
}
