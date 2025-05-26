import { NextRequest, NextResponse } from 'next/server';
import { getUserBySession, getUserByAuth0Id, deactivateApiKey, generateApiKey, checkUserConsent } from '@/app/api/server/litellm-management';
import { getSession } from '@auth0/nextjs-auth0';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Regenerate-Key] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Regenerate-Key] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Regenerate-Key] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Regenerate-Key] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
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
        emailVerified: session.user.email_verified,
        name: session.user.name
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
  log.info('API key regeneration request started', { requestId });
  
  try {
    const { user, auth0Session } = await getCurrentUser(req);
    
    if (!user) {
      log.warn('Unauthenticated key regeneration attempt', { requestId });
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
        log.warn('Auth0 user attempted key regeneration with unverified email', { 
          requestId,
          userId: user._id,
          auth0UserId: auth0Session.user.sub.substring(0, 12) + '...'
        });
        return new NextResponse(JSON.stringify({ 
          message: 'Email verification required. Please verify your email address before regenerating an API key.' 
        }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
      
      log.info('Auth0 user email verification confirmed for regeneration', { 
        requestId,
        userId: user._id,
        auth0UserId: auth0Session.user.sub.substring(0, 12) + '...'
      });
    }

    log.info('User authenticated for key regeneration', { 
      requestId,
      userId: user._id,
      authType: user.authType
    });

    // Check user consent before proceeding
    log.info('Checking user consent for key regeneration', { 
      requestId,
      userId: user.llmuserid
    });
    
    const consentCheck = await checkUserConsent(user.llmuserid);
    
    if (!consentCheck.hasValidConsent) {
      log.warn('User lacks required consent for key regeneration', { 
        requestId,
        userId: user.llmuserid,
        missingConsent: consentCheck.missingConsent,
        consentDetails: consentCheck.consentDetails
      });
      
      return new NextResponse(JSON.stringify({ 
        message: `Missing required consent: ${consentCheck.missingConsent.join(', ')}. Please accept the terms of service and communications consent before regenerating an API key.`,
        missingConsent: consentCheck.missingConsent,
        consentDetails: consentCheck.consentDetails
      }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    log.info('User consent validated for key regeneration', { 
      requestId,
      userId: user.llmuserid,
      consentDetails: consentCheck.consentDetails
    });

    const body = await req.json();
    const { keyId, keyName } = body;

    log.info('Key regeneration request details', { 
      requestId,
      userId: user._id,
      keyPreview: keyId ? keyId.substring(0, 12) + '...' : '[missing]',
      keyName: keyName || '[missing]'
    });

    if (!keyId || !keyName) {
      log.warn('Missing required fields for key regeneration', { 
        requestId,
        hasKeyId: !!keyId,
        hasKeyName: !!keyName
      });
      
      return new NextResponse(JSON.stringify({ message: 'Missing keyId or keyName' }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Verify reCAPTCHA for all users (both Auth0 and non-Auth0)
    const recaptchaToken = req.headers.get('x-recaptcha-token');
    log.info('Checking reCAPTCHA for key regeneration', { 
      requestId,
      hasRecaptchaToken: !!recaptchaToken,
      authType: user.authType
    });
    
    if (!recaptchaToken) {
      log.warn('Missing reCAPTCHA token for key regeneration', { requestId, authType: user.authType });
      return new NextResponse(JSON.stringify({ message: 'reCAPTCHA verification required' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
    if (!isValidRecaptcha) {
      log.warn('Invalid reCAPTCHA verification for key regeneration', { requestId, authType: user.authType });
      return new NextResponse(JSON.stringify({ message: 'Invalid reCAPTCHA verification' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Step 1: Deactivate the old API key
    log.info('Deactivating old API key', { 
      requestId,
      userId: user.llmuserid,
      keyPreview: keyId.substring(0, 12) + '...'
    });

    const deactivateSuccess = await deactivateApiKey(user.llmuserid, keyId);

    if (!deactivateSuccess) {
      log.error('Failed to deactivate old API key', { 
        requestId,
        userId: user.llmuserid,
        keyPreview: keyId.substring(0, 12) + '...'
      });
      
      return new NextResponse(JSON.stringify({ message: 'Failed to deactivate old API key' }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    log.info('Generating new API key', { 
      requestId,
      userId: user.llmuserid,
      keyName: keyName
    });
    
    const newKey = await generateApiKey(user.llmuserid, keyName);

    if (!newKey) {
      log.error('Failed to generate new API key', { 
        requestId,
        userId: user.llmuserid,
        keyName: keyName
      });
      
      return new NextResponse(JSON.stringify({ message: 'Failed to generate new API key' }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    log.info('API key regenerated successfully', { 
      requestId,
      userId: user.llmuserid,
      keyName: keyName,
      newKeyPreview: newKey.key.substring(0, 12) + '...',
      newKeyId: newKey.key_id
    });

    return new NextResponse(JSON.stringify({ 
      apikey: newKey.key,
      message: 'API key regenerated successfully'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    log.error('Unexpected error in API key regeneration', { requestId, error });
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
} 