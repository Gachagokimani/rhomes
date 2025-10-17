import createClient from 'redis';
import logger from '../../backend/logger.js';

let redisClient;
let redisAvailable = false;

const connectRedis = async (url) => {
  if (!url) return;
  try {
    redisClient = createClient({ url });
    redisClient.on('error', (err) => logger.warn('Redis error', { message: err.message }));
    await redisClient.connect();
    redisAvailable = true;
    logger.info('Connected to Redis');
  } catch (err) {
    logger.warn('Could not connect to Redis. Falling back to in-memory store.', { message: err.message });
    redisAvailable = false;
  }
};

// In-memory fallback
const memoryStore = new Map();

const setOtp = async (key, value, ttlSeconds = 600) => {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (_e) {
      logger.warn('OTP store error', { error: _e.message });
    }
    return;
  }
  const expires = Date.now() + ttlSeconds * 1000;
  memoryStore.set(key, { value, expires });
};

const getOtp = async (key) => {
  if (redisAvailable && redisClient) {
    try {
      const raw = await redisClient.get(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_e) {
      logger.warn('OTP retrieval error', { error: _e.message });
      return null;
    }
  }
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
};

const delOtp = async (key) => {
  if (redisAvailable && redisClient) {
    await redisClient.del(key);
    return;
  }
  memoryStore.delete(key);
};

export default {
  connectRedis,
  setOtp,
  getOtp,
  delOtp,
};
