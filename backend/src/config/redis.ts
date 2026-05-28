import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null, // Required for BullMQ
  connectTimeout: 1500,
  lazyConnect: true, // Don't connect immediately
  retryStrategy: (times: number) => {
    // Stop retrying quickly to avoid endless console flood when offline
    if (times > 2) {
      return null; // Stop reconnecting
    }
    return 1000;
  }
};

export const getRedisConnection = () => {
  const connection = new Redis(redisConfig);
  // Silent error catcher to prevent ECONNREFUSED stderr floods
  connection.on('error', (err) => {
    // Catch silently
  });
  return connection;
};
export default redisConfig;
