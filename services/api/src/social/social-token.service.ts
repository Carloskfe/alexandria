import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import Redis from 'ioredis';
import { InjectRedis } from '../auth/redis.provider';
import { OAUTH_CONFIG } from './social-oauth.config';

export interface SocialTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const ALG = 'aes-256-cbc';
const IV_LEN = 16;

@Injectable()
export class SocialTokenService {
  private readonly logger = new Logger(SocialTokenService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  private get key(): Buffer {
    const secret = process.env.SOCIAL_TOKEN_SECRET ?? 'changeme-social-secret';
    return scryptSync(secret, 'salt', 32) as Buffer;
  }

  private encrypt(plain: string): string {
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALG, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decrypt(ciphertext: string): string {
    const [ivHex, dataHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = createDecipheriv(ALG, this.key, iv);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  private redisKey(userId: string, platform: string): string {
    return `social:tokens:${userId}:${platform}`;
  }

  async store(userId: string, platform: string, tokens: SocialTokens): Promise<void> {
    const key = this.redisKey(userId, platform);
    const encrypted = this.encrypt(JSON.stringify(tokens));
    const ttl = Math.max(1, Math.floor((tokens.expiresAt - Date.now()) / 1000));
    await this.redis.set(key, encrypted, 'EX', ttl);

    if (tokens.refreshToken) {
      const refreshKey = `${key}:refresh`;
      const refreshEncrypted = this.encrypt(tokens.refreshToken);
      await this.redis.set(refreshKey, refreshEncrypted, 'EX', 60 * 24 * 60 * 60);
    }
  }

  async getToken(userId: string, platform: string): Promise<SocialTokens | null> {
    const key = this.redisKey(userId, platform);
    const raw = await this.redis.get(key);
    if (!raw) return null;

    const tokens: SocialTokens = JSON.parse(this.decrypt(raw));

    const fiveMinutes = 5 * 60 * 1000;
    if (tokens.expiresAt - Date.now() < fiveMinutes && tokens.refreshToken) {
      const refreshed = await this.refresh(userId, platform, tokens.refreshToken);
      if (refreshed) return refreshed;
    }

    return tokens;
  }

  private async refresh(
    userId: string,
    platform: string,
    refreshToken: string,
  ): Promise<SocialTokens | null> {
    const refreshKey = `${this.redisKey(userId, platform)}:refresh`;
    const rawRefresh = await this.redis.get(refreshKey);
    if (!rawRefresh) return null;

    let storedRefresh: string;
    try {
      storedRefresh = this.decrypt(rawRefresh);
    } catch {
      return null;
    }

    if (storedRefresh !== refreshToken) return null;

    const config = OAUTH_CONFIG[platform];
    if (!config) return null;

    const clientId = process.env[config.clientIdEnv];
    const clientSecret = process.env[config.clientSecretEnv];
    if (!clientId || !clientSecret) return null;

    try {
      const res = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      });

      if (!res.ok) {
        this.logger.warn(`Token refresh failed for ${platform}: HTTP ${res.status}`);
        return null;
      }

      const data = (await res.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      };

      const refreshed: SocialTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken,
        expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
      };

      await this.store(userId, platform, refreshed);
      return refreshed;
    } catch (err) {
      this.logger.error(`Token refresh error for ${platform}: ${(err as Error).message}`);
      return null;
    }
  }
}
