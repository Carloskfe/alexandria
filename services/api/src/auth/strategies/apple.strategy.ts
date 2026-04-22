import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@nicokaiser/passport-apple';
import { AuthProvider } from '../../users/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.APPLE_CLIENT_ID || 'not-configured',
      teamID: process.env.APPLE_TEAM_ID || 'not-configured',
      keyID: process.env.APPLE_KEY_ID || 'not-configured',
      key: process.env.APPLE_PRIVATE_KEY || 'not-configured',
      callbackURL: `${process.env.API_URL ?? 'http://localhost:4000'}/auth/apple/callback`,
      scope: ['name', 'email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any, done: (err: any, user?: any) => void) {
    const user = await this.authService.upsertOAuthUser({
      provider: AuthProvider.APPLE,
      providerId: profile.id,
      email: profile.email ?? null,
      name: profile.name ? `${profile.name.firstName ?? ''} ${profile.name.lastName ?? ''}`.trim() : null,
      avatarUrl: null,
    });
    done(null, user);
  }
}
