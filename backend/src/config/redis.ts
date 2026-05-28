import Redis from 'ioredis';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

export const redisConfig: any = {
  maxRetriesPerRequest: null, // Required for BullMQ
  connectTimeout: 1500,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    if (times > 2) {
      return null; // Stop reconnecting to avoid console floods
    }
    return 1000;
  }
};

// Check if a unified REDIS_URL is provided (typical on Render)
if (process.env.REDIS_URL) {
  try {
    const parsed = new URL(process.env.REDIS_URL);
    redisConfig.host = parsed.hostname;
    redisConfig.port = parseInt(parsed.port || '6379', 10);
    if (parsed.password) {
      redisConfig.password = decodeURIComponent(parsed.password);
    }
    // Render Key Value uses secure connections (rediss://), requiring TLS configs
    if (process.env.REDIS_URL.startsWith('rediss:')) {
      redisConfig.tls = { rejectUnauthorized: false };
    }
    console.log(`Redis Config: Dynamic URL parsed host=${redisConfig.host} port=${redisConfig.port} tls=${!!redisConfig.tls}`);
  } catch (err: any) {
    console.error('Failed to parse REDIS_URL in config:', err.message);
  }
} else {
  redisConfig.host = process.env.REDIS_HOST || 'localhost';
  redisConfig.port = parseInt(process.env.REDIS_PORT || '6379', 10);
}

export const getRedisConnection = () => {
  const connection = new Redis(redisConfig);
  connection.on('error', (err) => {
    // Silent error handler to avoid stdout floods
  });
  return connection;
};

export default redisConfig;
