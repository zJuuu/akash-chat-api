import { NextRequest, NextResponse } from 'next/server';
import { getUserBySession, getUserByAuth0Id, generateApiKey, userHasActiveApiKey, checkUserConsent } from '@/app/api/server/litellm-management';
import { getSession } from '@auth0/nextjs-auth0';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Generate-Key] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Generate-Key] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Generate-Key] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Generate-Key] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

async function verifyRecaptcha(token: string) {
  log.info('Verifying reCAPTCHA token');
  
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
  });

  const data = await response.json();
  
  if (data.success) {
    log.info('reCAPTCHA verification successful');
  } else {
    log.warn('reCAPTCHA verification failed', { errorCodes: data['error-codes'] });
  }
  
  return data.success;
}

async function getCurrentUser(req: NextRequest) {
  let user = null;
  let auth0Session = null;

  // Try Auth0 first
  log.debug('Attempting Auth0 authentication');
  try {
    const session = await getSession(req, new NextResponse());
    
    if (session?.user?.sub) {
      auth0Session = session;
      log.debug('Auth0 session found', { 
        auth0UserId: session.user.sub.substring(0, 12) + '...',
        hasEmailVerified: session.user.email_verified !== undefined,
        emailVerified: session.user.email_verified
      });
      user = await getUserByAuth0Id(session.user.sub, session.user.email, session.user.name);
      if (user) {
        log.debug('User found via Auth0', { userId: user._id });
      }
    }
  } catch (authError) {
    log.debug('Auth0 authentication failed, trying session auth', { error: authError });
  }

  // If no Auth0 session, try cookie session
  if (!user) {
    log.debug('Attempting session-based authentication');
    const sessionCookie = req.cookies.get('akash-session')?.value;
    if (sessionCookie) {
      log.debug('Session cookie found', { sessionId: sessionCookie.substring(0, 8) + '...' });
      user = await getUserBySession(sessionCookie);
      if (user) {
        log.debug('User found via session', { userId: user._id });
      }
    }
  }

  return { user, auth0Session };
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  log.info('New API key generation request started', { requestId });
  
  try {
    const { user, auth0Session } = await getCurrentUser(req);
    
    if (!user) {
      log.warn('Unauthenticated key generation attempt', { requestId });
      return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check email verification for Auth0 users
    if (auth0Session && user.authType === 'auth0') {
      if (!auth0Session.user.email_verified) {
        log.warn('Auth0 user attempted key generation with unverified email', { 
          requestId,
          userId: user._id,
          auth0UserId: auth0Session.user.sub.substring(0, 12) + '...'
        });
        return new NextResponse(JSON.stringify({ 
          message: 'Email verification required. Please verify your email address before generating an API key.' 
        }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      
      log.info('Auth0 user email verification confirmed', { 
        requestId,
        userId: user._id,
        auth0UserId: auth0Session.user.sub.substring(0, 12) + '...'
      });
    }

    log.info('User authenticated for key generation', { 
      requestId,
      userId: user._id,
      llmuserid: user.llmuserid,
      authType: user.authType,
      userKeys: Object.keys(user)
    });

    // Check user consent before proceeding
    log.info('Checking user consent for key generation', { 
      requestId,
      userId: user.llmuserid
    });
    
    const consentCheck = await checkUserConsent(user.llmuserid);
    
    if (!consentCheck.hasValidConsent) {
      log.warn('User lacks required consent for key generation', { 
        requestId,
        userId: user.llmuserid,
        missingConsent: consentCheck.missingConsent,
        consentDetails: consentCheck.consentDetails
      });
      
      return new NextResponse(JSON.stringify({ 
        message: `Missing required consent: ${consentCheck.missingConsent.join(', ')}. Please accept the terms of service and communications consent before generating an API key.`,
        missingConsent: consentCheck.missingConsent,
        consentDetails: consentCheck.consentDetails
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    log.info('User consent validated for key generation', { 
      requestId,
      userId: user.llmuserid,
      consentDetails: consentCheck.consentDetails
    });

    const body = await req.json();
    const { name } = body;

    log.info('Key generation request details', { 
      requestId,
      userId: user._id,
      keyName: name || '[missing]'
    });

    if (!name || name.trim() === '') {
      log.warn('Missing or empty key name', { 
        requestId,
        providedName: name
      });
      
      return new NextResponse(JSON.stringify({ message: 'API key name is required' }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Verify reCAPTCHA for all users (both Auth0 and non-Auth0)
    const recaptchaToken = req.headers.get('x-recaptcha-token');
    log.info('Checking reCAPTCHA for key generation', { 
      requestId,
      hasRecaptchaToken: !!recaptchaToken,
      authType: user.authType
    });
    
    if (!recaptchaToken) {
      log.warn('Missing reCAPTCHA token for key generation', { requestId, authType: user.authType });
      return new NextResponse(JSON.stringify({ message: 'reCAPTCHA verification required' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
    if (!isValidRecaptcha) {
      log.warn('Invalid reCAPTCHA verification for key generation', { requestId, authType: user.authType });
      return new NextResponse(JSON.stringify({ message: 'Invalid reCAPTCHA verification' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Check if user already has an active API key
    log.info('Checking for existing active API keys', { 
      requestId,
      userId: user.llmuserid,
      userIdType: typeof user.llmuserid,
      userIdValue: user.llmuserid
    });
    
    const hasActiveKey = await userHasActiveApiKey(user.llmuserid);
    
    if (hasActiveKey) {
      log.warn('User already has an active API key', { 
        requestId,
        userId: user.llmuserid
      });
      
      return new NextResponse(JSON.stringify({ 
        message: 'You already have an active API key. Please deactivate your existing key before generating a new one.' 
      }), {
        status: 409, // Conflict
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Generate new API key using LiteLLM
    log.info('Generating new API key in LiteLLM', { 
      requestId,
      userId: user.llmuserid,
      keyName: name.trim()
    });
    
    const newKey = await generateApiKey(user.llmuserid, name.trim());

    if (!newKey) {
      log.error('Failed to generate API key in LiteLLM', { 
        requestId,
        userId: user.llmuserid,
        keyName: name.trim()
      });
      
      return new NextResponse(JSON.stringify({ message: 'Failed to generate API key' }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    log.info('API key generated successfully', { 
      requestId,
      userId: user.llmuserid,
      keyName: name.trim(),
      keyPreview: newKey.key.substring(0, 12) + '...',
      keyId: newKey.key_id
    });

    return new NextResponse(JSON.stringify({ 
      apikey: newKey.key,
      message: 'API key generated successfully'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    log.error('Unexpected error in API key generation', { requestId, error });
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
} 