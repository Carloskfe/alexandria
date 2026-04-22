import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthProvider } from '../../users/user.entity';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.FACEBOOK_APP_ID || 'not-configured',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'not-configured',
      callbackURL: `${process.env.API_URL ?? 'http://localhost:4000'}/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'picture'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile, done: (err: any, user?: any) => void) {
    const user = await this.authService.upsertOAuthUser({
      provider: AuthProvider.FACEBOOK,
      providerId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      name: `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim() || null,
      avatarUrl: (profile.photos as any)?.[0]?.value ?? null,
    });
    done(null, user);
  }
}
