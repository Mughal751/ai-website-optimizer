import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error('Missing REDIS_URL environment variable');
}

declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | undefined;
}

export function getRedisClient(): Redis {
  if (!global._redisClient) {
    global._redisClient = new Redis(REDIS_URL as string, {
      maxRetriesPerRequest: null // required by BullMQ
    });
  }
  return global._redisClient;
}
