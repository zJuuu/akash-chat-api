import { NextRequest, NextResponse } from 'next/server';
import { getUserBySession, getUserByAuth0Id, updateUserConsent } from '@/app/api/server/litellm-management';
import { getSession } from '@auth0/nextjs-auth0';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Update-Consent] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Update-Consent] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Update-Consent] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Update-Consent] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

async function getCurrentUser(req: NextRequest) {
  let user = null;
  let auth0Session = null;

  // Try Auth0 first
  try {
    const session = await getSession(req, new NextResponse());
    if (session?.user?.sub) {
      auth0Session = session;
      user = await getUserByAuth0Id(session.user.sub, session.user.email, session.user.name);
    }
  } catch (authError) {
    log.debug('Auth0 authentication failed, trying session auth', { error: authError });
  }

  // If no Auth0 session, try cookie session
  if (!user) {
    const sessionCookie = req.cookies.get('akash-session')?.value;
    if (sessionCookie) {
      user = await getUserBySession(sessionCookie);
    }
  }

  return { user, auth0Session };
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  log.info('User consent update request started', { requestId });
  
  try {
    const { user } = await getCurrentUser(req);
    
    if (!user) {
      log.warn('Unauthenticated consent update attempt', { requestId });
      return new NextResponse(JSON.stringify({ message: 'Not authenticated' }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const body = await req.json();
    const { acceptedToS, acceptedCommunications } = body;

    log.info('Consent update request details', { 
      requestId,
      userId: user._id,
      acceptedToS,
      acceptedCommunications,
      hasToSUpdate: acceptedToS !== undefined,
      hasCommunicationsUpdate: acceptedCommunications !== undefined
    });

    if (acceptedToS === undefined && acceptedCommunications === undefined) {
      log.warn('No consent values provided for update', { requestId });
      return new NextResponse(JSON.stringify({ 
        message: 'No consent values provided. Please specify at least one consent to update.' 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Update user consent
    const success = await updateUserConsent(user.llmuserid, acceptedToS, acceptedCommunications);

    if (!success) {
      log.error('Failed to update user consent', { 
        requestId,
        userId: user.llmuserid
      });
      
      return new NextResponse(JSON.stringify({ message: 'Failed to update consent' }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Create a more informative success message
    const updatedItems = [];
    if (acceptedToS !== undefined) {
      updatedItems.push(`Terms of Service: ${acceptedToS ? 'accepted' : 'revoked'}`);
    }
    if (acceptedCommunications !== undefined) {
      updatedItems.push(`Communications consent: ${acceptedCommunications ? 'accepted' : 'revoked'}`);
    }

    log.info('User consent updated successfully', { 
      requestId,
      userId: user.llmuserid,
      acceptedToS,
      acceptedCommunications,
      updatedItems
    });

    return new NextResponse(JSON.stringify({ 
      message: 'Consent updated successfully',
      updated: updatedItems
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    log.error('Unexpected error in consent update', { requestId, error });
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
} 