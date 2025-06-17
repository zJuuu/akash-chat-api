import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/app/api/server/litellm-management';
import { testRedisConnection } from '@/lib/redis';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Health-Check] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Health-Check] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Health-Check] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

async function checkLiteLLMHealth() {
  try {
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/health`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      responseTime: Date.now()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now()
    };
  }
}

async function checkRedisHealth() {
  try {
    const isConnected = await testRedisConnection();
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      connected: isConnected,
      responseTime: Date.now()
    };
  } catch (error) {
    return {
      status: 'error',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now()
    };
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  log.info('Health check request started');
  
  try {
    // Check environment variables
    const envCheck = {
      LITELLM_API_ENDPOINT: !!process.env.LITELLM_API_ENDPOINT,
      LITELLM_ADMIN_KEY: !!process.env.LITELLM_ADMIN_KEY,
      LITELLM_USER_ROLE: !!process.env.LITELLM_USER_ROLE,
      LITELLM_TEAM_ID: !!process.env.LITELLM_TEAM_ID,
      LITELLM_TEAM_AUTH0: !!process.env.LITELLM_TEAM_AUTH0,
      LITELLM_TEAM_PERMISSIONLESS: !!process.env.LITELLM_TEAM_PERMISSIONLESS,
      RECAPTCHA_SECRET_KEY: !!process.env.RECAPTCHA_SECRET_KEY,
      AUTH0_SECRET: !!process.env.AUTH0_SECRET,
      REDIS_HOST: !!process.env.REDIS_HOST,
      REDIS_PORT: !!process.env.REDIS_PORT
    };

    // Check LiteLLM backend health
    const litellmHealth = await checkLiteLLMHealth();

    // Check Redis health
    const redisHealth = await checkRedisHealth();

    // Clean up expired sessions and get count
    const cleanedSessions = await cleanupExpiredSessions();

    // System metrics
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      responseTime: Date.now() - startTime
    };

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        litellm: litellmHealth,
        redis: redisHealth,
        frontend: {
          status: 'healthy',
          responseTime: Date.now() - startTime
        }
      },
      environment: envCheck,
      system: systemInfo,
      sessions: {
        cleanedExpiredSessions: cleanedSessions,
        storageType: redisHealth.status === 'healthy' ? 'Redis' : 'Memory'
      }
    };

    // Determine overall health status
    if (litellmHealth.status !== 'healthy') {
      healthData.status = 'degraded';
    }

    // Redis is optional, so we only warn if it's configured but not working
    if (process.env.REDIS_HOST && redisHealth.status !== 'healthy') {
      healthData.status = 'degraded';
      log.warn('Redis is configured but not healthy', { redisHealth });
    }

    const missingEnvVars = Object.entries(envCheck)
      .filter(([key, value]) => !value && !key.startsWith('REDIS_')) // Redis vars are optional
      .map(([key]) => key);

    if (missingEnvVars.length > 0) {
      healthData.status = 'degraded';
      log.warn('Missing environment variables', { missingEnvVars });
    }

    log.info('Health check completed', { 
      status: healthData.status,
      responseTime: healthData.system.responseTime,
      litellmStatus: litellmHealth.status,
      redisStatus: redisHealth.status,
      cleanedSessions
    });

    return new NextResponse(JSON.stringify(healthData), {
      status: healthData.status === 'healthy' ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
    });
  } catch (error) {
    log.error('Health check failed', { error });
    
    return new NextResponse(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
} 