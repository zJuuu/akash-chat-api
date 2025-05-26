import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createUser, createUserSession } from '@/app/api/server/litellm-management';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Claim-API-Key] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Claim-API-Key] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Claim-API-Key] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
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

export async function POST(req: NextRequest) {
  const requestId = randomBytes(8).toString('hex');
  log.info('API key claim request started', { requestId });
  
  try {
    const body = await req.json();
    const { email, name, description, acceptToS, acceptCommunications, authType } = body;
    
    // Get Auth0 user ID from header if present
    const auth0UserId = req.headers.get('X-Auth0-User-Id');
    
    log.info('Request details', { 
      requestId,
      email: email || '[empty]',
      name: name || '[empty]',
      authType,
      hasAuth0UserId: !!auth0UserId,
      auth0UserIdPreview: auth0UserId ? auth0UserId.substring(0, 12) + '...' : null,
      hasDescription: !!description,
      acceptToS,
      acceptCommunications
    });

    if (!acceptToS) {
      log.warn('Terms of service not accepted', { requestId, email });
      return new NextResponse(JSON.stringify({ message: 'You have to accept the ToS to use this service' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!acceptCommunications) {
      log.warn('Communications consent not accepted', { requestId, email });
      return new NextResponse(JSON.stringify({ message: 'You must accept communications consent to use this service' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Verify reCAPTCHA for non-Auth0 users
      const recaptchaToken = req.headers.get('x-recaptcha-token');
      log.info('Processing non-auth0 request, checking reCAPTCHA', { 
        requestId,
        hasRecaptchaToken: !!recaptchaToken 
      });
      
      if (!recaptchaToken) {
        log.warn('Missing reCAPTCHA token for non-auth0 request', { requestId });
        return new NextResponse(JSON.stringify({ message: 'reCAPTCHA verification required' }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidRecaptcha) {
        log.warn('Invalid reCAPTCHA verification', { requestId });
        return new NextResponse(JSON.stringify({ message: 'Invalid reCAPTCHA verification' }), {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

    // Handle empty email

    // Create user directly in LiteLLM (this also creates the first API key)
    log.info('Creating user in LiteLLM', { 
      requestId,
      email,
      authType,
      auth0UserId: auth0UserId ? auth0UserId.substring(0, 12) + '...' : null
    });
    
    const user = await createUser(
      email,
      name !== '' ? name : 'No name provided',
      description !== '' ? description : 'No description provided',
      authType,
      auth0UserId || undefined, // Pass Auth0 user ID if available
      acceptToS,
      acceptCommunications,
    );

    if (!user) {
      log.error('Failed to create user in LiteLLM', { 
        requestId,
        email,
        authType 
      });
      return new NextResponse(JSON.stringify({ message: 'Failed to create user' }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    log.info('User created successfully', { 
      requestId,
      userId: user.user_id,
      email,
      hasApiKey: !!user.key
    });

    // Create session for permissionless users
    let sessionId = null;
    if (authType === 'non-auth0') {
      log.info('Creating session for permissionless user', { 
        requestId,
        userId: user.user_id 
      });
      
      sessionId = await createUserSession(email, user.user_id);
      
      if (sessionId) {
        log.info('Session created successfully', { 
          requestId,
          sessionId: sessionId.substring(0, 8) + '...',
          userId: user.user_id
        });
      } else {
        log.warn('Failed to create session for permissionless user', { 
          requestId,
          userId: user.user_id 
        });
      }
    }

    const response = {
      apikey: user.key,
      ...(sessionId && { sessionId })
    };

    const nextResponse = new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Set session cookie for permissionless users
    if (sessionId) {
      log.info('Setting session cookie', { 
        requestId,
        sessionId: sessionId.substring(0, 8) + '...',
        isProduction: process.env.NODE_ENV === 'production'
      });
      
      nextResponse.cookies.set('akash-session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      });
    }

    log.info('API key claim request completed successfully', { 
      requestId,
      userId: user.user_id,
      authType,
      hasSession: !!sessionId,
      keyPreview: user.key.substring(0, 12) + '...'
    });

    return nextResponse;
  } catch (error) {
    log.error('Unexpected error in API key claim', { requestId, error });
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}