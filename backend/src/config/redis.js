const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Main Redis client for general caching
const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

// Cache key prefixes
const CACHE_KEYS = {
  WEBHOOK: 'webhook:',
  EVENT: 'event:',
  DELIVERY: 'delivery:',
  ACTIVE_WEBHOOKS: 'active_webhooks',
  RETRY_QUEUE: 'retry_queue:',
};

// Cache TTL in seconds
const CACHE_TTL = {
  WEBHOOK: 3600, // 1 hour
  EVENT: 1800, // 30 minutes
  ACTIVE_WEBHOOKS: 600, // 10 minutes
};

module.exports = {
  redisClient,
  CACHE_KEYS,
  CACHE_TTL,
};
