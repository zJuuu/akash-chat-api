'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useUser as useAuth0User } from '@auth0/nextjs-auth0/client';

interface UserContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  authType: 'auth0' | 'session' | null;
  user: any;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom hook for managing authentication state persistence
function useAuthPersistence() {
  const [persistedAuthState, setPersistedAuthState] = useState<{
    isAuthenticated: boolean;
    authType: 'auth0' | 'session' | null;
    user: any;
  } | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('akash-auth-state');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Only restore if it's recent (within 7 days to match session expiration)
          if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
            setPersistedAuthState(parsed.state);
          } else {
            sessionStorage.removeItem('akash-auth-state');
          }
        }
      } catch (error) {
        console.error('Failed to load persisted auth state:', error);
        sessionStorage.removeItem('akash-auth-state');
      }
    }
  }, []);

  // Save state to sessionStorage
  const persistAuthState = useCallback((state: {
    isAuthenticated: boolean;
    authType: 'auth0' | 'session' | null;
    user: any;
  }) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('akash-auth-state', JSON.stringify({
          state,
          timestamp: Date.now()
        }));
        setPersistedAuthState(state);
      } catch (error) {
        console.error('Failed to persist auth state:', error);
      }
    }
  }, []);

  // Clear persisted state
  const clearPersistedState = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('akash-auth-state');
      setPersistedAuthState(null);
    }
  }, []);

  return { persistedAuthState, persistAuthState, clearPersistedState };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: auth0User, isLoading: auth0Loading, error: auth0Error } = useAuth0User();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const checkAuthRef = useRef<AbortController | null>(null);
  const { persistedAuthState, persistAuthState, clearPersistedState } = useAuthPersistence();
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  // Clear any previous auth check when component unmounts or auth changes
  useEffect(() => {
    return () => {
      if (checkAuthRef.current) {
        checkAuthRef.current.abort();
      }
    };
  }, []);

  const checkAuth = useCallback(async (isRetry = false) => {
    // If Auth0 user exists, don't check session
    if (auth0User) {
      setSessionLoading(false);
      setSessionUser(null);
      setError(null);
      return;
    }

    // Cancel any previous request
    if (checkAuthRef.current) {
      checkAuthRef.current.abort();
    }

    // Create new abort controller
    checkAuthRef.current = new AbortController();

    try {
      setError(null);
      
      const response = await fetch('/api/account/me', {
        signal: checkAuthRef.current.signal,
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setSessionUser(userData);
        setRetryCount(0); // Reset retry count on success
      } else if (response.status === 401) {
        // Not authenticated - this is expected, not an error
        setSessionUser(null);
        setRetryCount(0);
        clearPersistedState(); // Clear any stale persisted state
      } else {
        throw new Error(`Authentication check failed: ${response.status}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was aborted, don't update state
        return;
      }

      console.error('Auth check error:', error);
      
      // Only retry if it's not a manual retry and we haven't exceeded max retries
      if (!isRetry && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          checkAuth(true);
        }, retryDelay * (retryCount + 1)); // Exponential backoff
        return;
      }

      // Set error state
      setError(error.message || 'Authentication check failed');
      setSessionUser(null);
      clearPersistedState(); // Clear any stale persisted state
    } finally {
      setSessionLoading(false);
    }
  }, [auth0User, retryCount, clearPersistedState]);

  const logout = useCallback(async () => {
    try {
      setError(null);
      
      if (auth0User) {
        // For Auth0 users, redirect directly to Auth0 logout
        const baseUrl = window.location.origin; // Use current origin
        const logoutUrl = `/api/auth/logout?returnTo=${encodeURIComponent(baseUrl)}`;
        window.location.href = logoutUrl;
        return;
      }

      // For session users, call the logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Trigger cross-tab logout if supported
        if (data.crossTabLogout && typeof window !== 'undefined') {
          localStorage.setItem('akash-logout', Date.now().toString());
          // Remove the flag after a short delay to allow other tabs to detect it
          setTimeout(() => {
            localStorage.removeItem('akash-logout');
          }, 1000);
        }
        
        // Clear session user state
        setSessionUser(null);
        clearPersistedState();
        // Redirect to home page
        window.location.href = '/';
      } else {
        throw new Error('Logout failed');
      }
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
      
      // Even if logout API fails, clear local state and redirect
      setSessionUser(null);
      clearPersistedState();
      
      // Still trigger cross-tab logout for session users
      if (!auth0User && typeof window !== 'undefined') {
        localStorage.setItem('akash-logout', Date.now().toString());
        setTimeout(() => {
          localStorage.removeItem('akash-logout');
        }, 1000);
      }
      
      window.location.href = '/';
    }
  }, [auth0User, clearPersistedState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial auth check when Auth0 loading completes
  useEffect(() => {
    if (!auth0Loading) {
      if (auth0User) {
        // Auth0 user found, clear session state and ensure user exists in LiteLLM
        setSessionUser(null);
        setSessionLoading(false);
        setError(null);
        
        // Ensure Auth0 user exists in LiteLLM
        ensureAuth0UserInLiteLLM(auth0User);
      } else {
        // No Auth0 user, check for session
        checkAuth();
      }
    }
  }, [auth0User, auth0Loading, checkAuth]);

  // Function to ensure Auth0 user exists in LiteLLM
  const ensureAuth0UserInLiteLLM = useCallback(async (user: any) => {
    if (!user?.sub) {
      return;
    }

    try {
      // Check if user exists by trying to fetch their data
      const response = await fetch('/api/account/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
      } else {
        console.error('Unexpected response when checking Auth0 user:', response.status);
      }
    } catch (error) {
      console.error('[UserProvider] Error ensuring Auth0 user in LiteLLM:', error);
    }
  }, [checkAuth]);

  // Handle Auth0 errors
  useEffect(() => {
    if (auth0Error) {
      console.error('Auth0 error:', auth0Error);
      setError(auth0Error.message || 'Authentication error');
    }
  }, [auth0Error]);

  // Periodic session validation (every 5 minutes)
  useEffect(() => {
    if (!auth0User && sessionUser) {
      const interval = setInterval(() => {
        checkAuth();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [auth0User, sessionUser, checkAuth]);

  // Listen for storage events (for cross-tab logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'akash-logout') {
        // Another tab logged out, clear local state
        setSessionUser(null);
        setError(null);
        clearPersistedState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearPersistedState]);

  // Listen for page visibility changes to refresh auth state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !auth0User && sessionUser) {
        // Page became visible, check if session is still valid
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [auth0User, sessionUser, checkAuth]);

  // Computed values
  const isAuthenticated = !!auth0User || !!sessionUser;
  const isLoading = auth0Loading || sessionLoading;
  const authType = auth0User ? 'auth0' : sessionUser ? 'session' : null;
  const user = auth0User || sessionUser;

  // Persist authentication state when it changes
  useEffect(() => {
    if (!isLoading) {
      persistAuthState({
        isAuthenticated,
        authType,
        user
      });
    }
  }, [isAuthenticated, authType, user, isLoading, persistAuthState]);

  // Use persisted state during initial loading if available
  const effectiveIsAuthenticated = isLoading && persistedAuthState ? persistedAuthState.isAuthenticated : isAuthenticated;
  const effectiveAuthType = isLoading && persistedAuthState ? persistedAuthState.authType : authType;
  const effectiveUser = isLoading && persistedAuthState ? persistedAuthState.user : user;

  const contextValue = {
    isAuthenticated: effectiveIsAuthenticated,
    isLoading,
    authType: effectiveAuthType,
    user: effectiveUser,
    checkAuth: () => checkAuth(),
    logout,
    error,
    clearError,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useAppUser must be used within a UserProvider');
  }
  return context;
} 