import { Inject } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_TOKEN = 'REDIS_CLIENT';

export const InjectRedis = () => Inject(REDIS_TOKEN);

export const redisProvider = {
  provide: REDIS_TOKEN,
  useFactory: () => new Redis(process.env.REDIS_URL ?? 'redis://cache:6379'),
};
