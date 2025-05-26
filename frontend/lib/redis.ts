import Redis from 'ioredis';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Redis] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Redis] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Redis] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Redis] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Global Redis instance
let redis: Redis | null = null;

// Create Redis connection
export const getRedisClient = (): Redis => {
  if (!redis) {
    log.info('Creating new Redis connection', {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
      hasPassword: !!redisConfig.password
    });

    redis = new Redis(redisConfig);

    // Event handlers
    redis.on('connect', () => {
      log.info('Redis connected successfully');
    });

    redis.on('ready', () => {
      log.info('Redis ready for commands');
    });

    redis.on('error', (error) => {
      log.error('Redis connection error', error);
    });

    redis.on('close', () => {
      log.warn('Redis connection closed');
    });

    redis.on('reconnecting', (delay: number) => {
      log.info('Redis reconnecting', { delay });
    });
  }

  return redis;
};

// Test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    await client.ping();
    log.info('Redis connection test successful');
    return true;
  } catch (error) {
    log.error('Redis connection test failed', error);
    return false;
  }
};

// Close Redis connection
export const closeRedisConnection = async (): Promise<void> => {
  if (redis) {
    try {
      await redis.quit();
      log.info('Redis connection closed gracefully');
    } catch (error) {
      log.error('Error closing Redis connection', error);
    } finally {
      redis = null;
    }
  }
};

// Redis session helpers
export const redisSessionHelpers = {
  // Set session with expiration
  setSession: async (sessionId: string, sessionData: any, expirationSeconds: number = 7 * 24 * 60 * 60): Promise<boolean> => {
    try {
      const client = getRedisClient();
      const key = `session:${sessionId}`;
      const value = JSON.stringify(sessionData);
      
      await client.setex(key, expirationSeconds, value);
      
      log.debug('Session stored in Redis', { 
        sessionId: sessionId.substring(0, 8) + '...',
        expirationSeconds 
      });
      
      return true;
    } catch (error) {
      log.error('Failed to store session in Redis', { 
        sessionId: sessionId.substring(0, 8) + '...',
        error 
      });
      return false;
    }
  },

  // Get session
  getSession: async (sessionId: string): Promise<any | null> => {
    try {
      const client = getRedisClient();
      const key = `session:${sessionId}`;
      const value = await client.get(key);
      
      if (!value) {
        log.debug('Session not found in Redis', { 
          sessionId: sessionId.substring(0, 8) + '...' 
        });
        return null;
      }
      
      const sessionData = JSON.parse(value);
      
      log.debug('Session retrieved from Redis', { 
        sessionId: sessionId.substring(0, 8) + '...',
        hasData: !!sessionData 
      });
      
      return sessionData;
    } catch (error) {
      log.error('Failed to retrieve session from Redis', { 
        sessionId: sessionId.substring(0, 8) + '...',
        error 
      });
      return null;
    }
  },

  // Delete session
  deleteSession: async (sessionId: string): Promise<boolean> => {
    try {
      const client = getRedisClient();
      const key = `session:${sessionId}`;
      const result = await client.del(key);
      
      log.debug('Session deleted from Redis', { 
        sessionId: sessionId.substring(0, 8) + '...',
        existed: result > 0 
      });
      
      return result > 0;
    } catch (error) {
      log.error('Failed to delete session from Redis', { 
        sessionId: sessionId.substring(0, 8) + '...',
        error 
      });
      return false;
    }
  },

  // Get all session keys (for cleanup)
  getAllSessionKeys: async (): Promise<string[]> => {
    try {
      const client = getRedisClient();
      const keys = await client.keys('session:*');
      
      log.debug('Retrieved session keys from Redis', { count: keys.length });
      
      return keys;
    } catch (error) {
      log.error('Failed to retrieve session keys from Redis', { error });
      return [];
    }
  },

  // Cleanup expired sessions (manual cleanup if needed)
  cleanupExpiredSessions: async (): Promise<number> => {
    try {
      const client = getRedisClient();
      const keys = await client.keys('session:*');
      let deletedCount = 0;
      
      for (const key of keys) {
        const ttl = await client.ttl(key);
        if (ttl === -1) { // Key exists but has no expiration
          await client.del(key);
          deletedCount++;
        }
      }
      
      log.info('Manual session cleanup completed', { 
        totalKeys: keys.length,
        deletedCount 
      });
      
      return deletedCount;
    } catch (error) {
      log.error('Failed to cleanup expired sessions', { error });
      return 0;
    }
  }
};

export default getRedisClient; 