import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from './redis.provider';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  generateAccessToken(payload: { sub: string; email: string | null }) {
    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const tokenId = uuidv4();
    await this.redis.set(`refresh:${userId}:${tokenId}`, '1', 'EX', REFRESH_TTL);
    return tokenId;
  }

  async validateRefreshToken(userId: string, tokenId: string): Promise<boolean> {
    const val = await this.redis.get(`refresh:${userId}:${tokenId}`);
    return val === '1';
  }

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}:${tokenId}`);
  }
}
