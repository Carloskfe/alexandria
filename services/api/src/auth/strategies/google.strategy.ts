import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthProvider } from '../../users/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'not-configured',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
      callbackURL: `${process.env.API_URL ?? 'http://localhost:4000'}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any, done: VerifyCallback) {
    const user = await this.authService.upsertOAuthUser({
      provider: AuthProvider.GOOGLE,
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      name: profile.displayName ?? null,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
    done(null, user);
  }
}
