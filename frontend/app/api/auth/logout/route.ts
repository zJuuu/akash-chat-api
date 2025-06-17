import { NextRequest, NextResponse } from 'next/server';
import { handleLogout } from '@auth0/nextjs-auth0';

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[Logout] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Logout] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Logout] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Handle Auth0 logout (GET request)
export async function GET(req: NextRequest, context: { params: {} }) {
  const requestId = Math.random().toString(36).substring(7);
  log.info('Auth0 logout request started', { requestId });
  
  try {
    return await handleLogout(req, context);
  } catch (error) {
    log.error('Auth0 logout error', { requestId, error });
    // Fallback to manual redirect
    const returnTo = req.nextUrl.searchParams.get('returnTo') || req.nextUrl.origin;
    return NextResponse.redirect(returnTo);
  }
}

// Handle session logout (POST request)
export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  log.info('Session logout request started', { requestId });
  
  try {
    const sessionCookie = req.cookies.get('akash-session')?.value;
    
    if (sessionCookie) {
      log.info('Clearing session cookie', { 
        requestId,
        sessionId: sessionCookie.substring(0, 8) + '...'
      });
    } else {
      log.info('No session cookie found to clear', { requestId });
    }

    // Create response that clears the session cookie
    const response = new NextResponse(JSON.stringify({ 
      message: 'Logged out successfully',
      crossTabLogout: true // Flag to indicate cross-tab logout should be triggered
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Clear the session cookie
    response.cookies.set('akash-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Expire immediately
      path: '/'
    });

    log.info('Session logout completed successfully', { requestId });
    return response;
  } catch (error) {
    log.error('Unexpected error in session logout', { requestId, error });
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
} 