import { NextResponse } from 'next/server';
import { getModelsData } from '../../../lib/models-server';

// In-memory cache for models data
let modelsCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Models-API] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Models-API] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Models-API] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Models-API] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};


function isCacheValid(): boolean {
  if (!modelsCache) {
    return false;
  }
  
  const now = Date.now();
  const cacheAge = now - modelsCache.timestamp;
  const isValid = cacheAge < CACHE_DURATION_MS;
  
  log.debug('Cache validation check', {
    cacheExists: !!modelsCache,
    cacheTimestamp: new Date(modelsCache.timestamp).toISOString(),
    currentTimestamp: new Date(now).toISOString(),
    cacheAgeMs: cacheAge,
    cacheAgeMinutes: Math.round(cacheAge / 60000),
    isValid
  });
  
  return isValid;
}

async function getCachedOrFetchModels() {
  if (isCacheValid()) {
    log.info('Returning cached models data', {
      cacheAgeMinutes: Math.round((Date.now() - modelsCache!.timestamp) / 60000)
    });
    return modelsCache!.data;
  }

  log.info('Cache is invalid or missing, fetching fresh data from LiteLLM');
  
  try {
    const processedData = await getModelsData();
    
    modelsCache = {
      data: processedData,
      timestamp: Date.now()
    };
    
    log.info('Successfully cached fresh models data', {
      cacheTimestamp: new Date(modelsCache.timestamp).toISOString(),
      chatModels: processedData.chatModels.length,
      embeddingModels: processedData.embeddingModels.length
    });
    
    return processedData;
  } catch (error) {
    if (modelsCache) {
      log.warn('Failed to fetch fresh data, returning stale cached data as fallback', {
        staleDataAgeMinutes: Math.round((Date.now() - modelsCache.timestamp) / 60000),
        error
      });
      return modelsCache.data;
    }
    
    throw error;
  }
}

export async function GET() {
  const startTime = Date.now();
  log.info('Models API request started');

  try {
    const modelsData = await getCachedOrFetchModels();
    const responseTime = Date.now() - startTime;

    log.info('Models API request completed successfully', {
      responseTime,
      wasFromCache: isCacheValid(),
      chatModels: modelsData.chatModels.length,
      embeddingModels: modelsData.embeddingModels.length
    });

    return new NextResponse(JSON.stringify(modelsData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300', // 5 minutes cache
      }
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    log.error('Models API request failed', { error, responseTime });

    return new NextResponse(JSON.stringify({
      error: 'Failed to fetch models',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`
      }
    });
  }
}

