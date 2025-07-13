import { NextRequest, NextResponse } from 'next/server';
import { getUserBySession, getUserByAuth0Id, getUserInfoWithKeys } from '@/app/api/server/litellm-management';
import { getSession } from '@auth0/nextjs-auth0';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired rate limit entries
const cleanupRateLimit = () => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [ip, data] of entries) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
};

// Check rate limit for IP
const checkRateLimit = (ip: string): { allowed: boolean; remaining: number; resetTime: number } => {
  cleanupRateLimit();
  
  const now = Date.now();
  const existing = rateLimitStore.get(ip);
  
  if (!existing || now > existing.resetTime) {
    // First request or window expired
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimitStore.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime };
  }
  
  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
  }
  
  // Increment count
  existing.count++;
  rateLimitStore.set(ip, existing);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.count, resetTime: existing.resetTime };
};

// Get client IP address
const getClientIP = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
};

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Account-Me] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Account-Me] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Account-Me] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Account-Me] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const clientIP = getClientIP(req);
  
  log.info('Account info request started', { requestId, clientIP });
  
  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);
  
  if (!rateLimit.allowed) {
    log.warn('Rate limit exceeded for account request', { 
      requestId, 
      clientIP,
      resetTime: new Date(rateLimit.resetTime).toISOString()
    });
    
    return new NextResponse(JSON.stringify({ 
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString(),
        "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
      },
    });
  }
  
  try {
    let user = null;
    let authType = 'unknown';

    // Try Auth0 first
    log.debug('Attempting Auth0 authentication', { requestId });
    try {
      const session = await getSession(req, new NextResponse());
      if (session?.user) {
        log.debug('Auth0 session found', { 
          requestId,
          userKeys: Object.keys(session.user),
          hasSub: !!session.user.sub,
          hasName: !!session.user.name
        });
        
        // Use Auth0 'sub' field as the user ID (this is the standard Auth0 user identifier)
        const auth0UserId = session.user.sub;
        if (auth0UserId) {
          log.info('Auth0 session found', { 
            requestId,
            auth0UserId: auth0UserId.substring(0, 12) + '...',
            hasName: !!session.user.name
          });
          
          user = await getUserByAuth0Id(auth0UserId, session.user.email, session.user.name);
          authType = 'auth0';
          
          if (user) {
            log.info('User found via Auth0', { 
              requestId,
              userId: user._id,
              llmuserid: user.llmuserid,
              userKeys: Object.keys(user)
            });
          } else {
            log.warn('Auth0 session found but user not in LiteLLM', { 
              requestId,
              auth0UserId: auth0UserId.substring(0, 12) + '...'
            });
          }
        } else {
          log.debug('Auth0 session found but no sub field', { requestId });
        }
      } else {
        log.debug('No Auth0 session found', { requestId });
      }
    } catch (authError) {
      log.debug('Auth0 authentication failed, trying session auth', { 
        requestId,
        error: authError instanceof Error ? authError.message : 'Unknown error'
      });
    }

    // If no Auth0 session, try cookie session
    if (!user) {
      log.debug('Attempting session-based authentication', { requestId });
      const sessionCookie = req.cookies.get('akash-session')?.value;
      
      if (sessionCookie) {
        log.debug('Session cookie found', { 
          requestId,
          sessionId: sessionCookie.substring(0, 8) + '...'
        });
        
        user = await getUserBySession(sessionCookie);
        authType = 'non-auth0';
        
        if (user) {
          log.info('User found via session', { 
            requestId,
            userId: user._id,
            sessionId: sessionCookie.substring(0, 8) + '...'
          });
        } else {
          log.warn('Session cookie found but user not found or session expired', { 
            requestId,
            sessionId: sessionCookie.substring(0, 8) + '...'
          });
        }
      } else {
        log.debug('No session cookie found', { requestId });
      }
    }

    if (!user) {
      log.warn('No authentication found', { 
        requestId,
        checkedAuth0: true,
        checkedSession: true
      });
      
      return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString()
        },
      });
    }

    // Get user's API keys from LiteLLM
    log.info('Fetching user API keys', { 
      requestId,
      userId: user.llmuserid,
      authType
    });
    
    const userInfoWithKeys = await getUserInfoWithKeys(user.llmuserid);
    
    if (!userInfoWithKeys) {
      log.error('Failed to fetch user info with keys', { 
        requestId,
        userId: user.llmuserid
      });
      
      return new NextResponse(JSON.stringify({ message: 'Failed to fetch user data' }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString()
        },
      });
    }
    
    const { user: updatedUserInfo, apiKeys } = userInfoWithKeys;
    
    log.info('API keys fetched', { 
      requestId,
      userId: user.llmuserid,
      keyCount: apiKeys.length,
      activeKeys: apiKeys.filter((k: any) => k.isActive).length,
      keyDetails: apiKeys.map((k: any) => ({
        keyId: k.keyId?.substring(0, 12) + '...',
        name: k.name,
        isActive: k.isActive,
        createdAt: k.createdAt
      }))
    });

    log.debug('Complete user data before response', {
      requestId,
      originalUser: {
        id: user._id,
        authType: user.authType
      },
      updatedUserInfo: {
        id: updatedUserInfo._id,
        authType: updatedUserInfo.authType,
        name: updatedUserInfo.name,
        description: updatedUserInfo.description
      },
      detectedAuthType: authType,
      keyCount: apiKeys.length
    });

    // Remove email from response data for privacy
    const responseData = {
      _id: updatedUserInfo._id,
      name: updatedUserInfo.name,
      description: updatedUserInfo.description,
      authType: updatedUserInfo.authType,
      createdAt: updatedUserInfo.createdAt,
      verifiedEmail: updatedUserInfo.verifiedEmail,
      apiKeys: apiKeys.map((key: any) => ({
        _id: key._id,
        keyId: key.keyId,
        keyPreview: key.keyPreview,
        name: key.name,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
        isActive: key.isActive,
        expiresAt: key.expiresAt
      }))
    };

    log.info('Account info request completed successfully', { 
      requestId,
      userId: updatedUserInfo._id,
      authType: updatedUserInfo.authType,
      keyCount: apiKeys.length
    });

    const nextResponse = new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString()
      },
    });

    // Renew session cookie for non-Auth0 users
    if (authType === 'non-auth0') {
      const sessionCookie = req.cookies.get('akash-session')?.value;
      if (sessionCookie) {
        log.debug('Renewing session cookie', { 
          requestId,
          sessionId: sessionCookie.substring(0, 8) + '...'
        });
        
        nextResponse.cookies.set('akash-session', sessionCookie, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 14 * 24 * 60 * 60 // 14 days
        });
      }
    }

    return nextResponse;
  } catch (error) {
    log.error('Unexpected error in account info request', { requestId, error });
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(rateLimit.resetTime / 1000).toString()
      },
    });
  }
} 