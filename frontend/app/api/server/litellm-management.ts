import { randomBytes } from 'crypto';
import { redisSessionHelpers, testRedisConnection } from '@/lib/redis';

export interface User {
  user_id: string;
  user_email: string;
  user_role: string;
  teams: string[];
  metadata?: {
    name?: string;
    description?: string;
    authType?: 'auth0' | 'non-auth0';
    createdAt?: string;
    acceptedToS?: boolean;
    acceptedCommunications?: boolean;
    tosAcceptedAt?: string;
    communicationsAcceptedAt?: string;
  };
}

export interface ApiKey {
  token: string;
  key_name?: string;
  key_alias?: string;
  user_id: string;
  team_id?: string;
  max_parallel_requests?: number;
  metadata?: {
    name?: string;
    createdAt?: string;
    isActive?: boolean;
  };
  expires?: string;
}

export interface UserSession {
  sessionId: string;
  email: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

// In-memory session storage (fallback for when Redis is not available)
const sessionStore = new Map<string, UserSession>();

// Check if Redis is configured
const isRedisConfigured = () => {
  return !!(process.env.REDIS_HOST && process.env.REDIS_PORT);
};

// Initialize Redis connection check
const ensureRedisConnection = async () => {
  if (!isRedisConfigured()) {
    return false;
  }
  
  try {
    const isConnected = await testRedisConnection();
    if (isConnected) {
      log.info('Redis connection verified and will be used for session storage');
      return true;
    } else {
      log.warn('Redis is configured but connection failed, falling back to in-memory session storage');
      return false;
    }
  } catch (error) {
    log.warn('Failed to test Redis connection, using in-memory storage', { error });
    return false;
  }
};

// Initialize Redis on module load
ensureRedisConnection();

// Logging utility
const log = {
  info: (message: string, data?: any) => {
    console.log(`[LiteLLM-Management] INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[LiteLLM-Management] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[LiteLLM-Management] WARN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[LiteLLM-Management] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

// Create a session for permissionless users
export const createUserSession = async (email: string, userId: string) => {
  const useRedis = await ensureRedisConnection();
  log.info('Creating user session', { email, userId, usingRedis: useRedis });
  
  try {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry
    
    const session: UserSession = {
      sessionId,
      email,
      userId,
      createdAt: new Date(),
      expiresAt
    };
    
    if (useRedis) {
      // Use Redis for session storage
      const success = await redisSessionHelpers.setSession(sessionId, session, 14 * 24 * 60 * 60);
      if (!success) {
        log.error('Failed to store session in Redis, falling back to memory', { sessionId: sessionId.substring(0, 8) + '...' });
        sessionStore.set(sessionId, session);
      }
    } else {
      // Fallback to in-memory storage
      sessionStore.set(sessionId, session);
    }
    
    log.info('User session created successfully', { 
      sessionId: sessionId.substring(0, 8) + '...', 
      email, 
      userId,
      expiresAt: expiresAt.toISOString(),
      totalSessions: useRedis ? 'Redis' : sessionStore.size,
      storageType: useRedis ? 'Redis' : 'Memory'
    });
    
    return sessionId;
  } catch (error) {
    log.error('Error creating session', { email, userId, error });
    return null;
  }
};

// Renew session expiration
export const renewSession = async (sessionId: string): Promise<boolean> => {
  const useRedis = await ensureRedisConnection();
  log.debug('Renewing session', { sessionId: sessionId.substring(0, 8) + '...', usingRedis: useRedis });
  
  try {
    let session: UserSession | null = null;
    
    if (useRedis) {
      session = await redisSessionHelpers.getSession(sessionId);
    } else {
      session = sessionStore.get(sessionId) || null;
    }
    
    if (!session) {
      log.warn('Cannot renew session - session not found', { sessionId: sessionId.substring(0, 8) + '...' });
      return false;
    }
    
    // Update expiration to 14 days from now
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 14);
    
    const updatedSession: UserSession = {
      ...session,
      expiresAt: newExpiresAt
    };
    
    if (useRedis) {
      const success = await redisSessionHelpers.setSession(sessionId, updatedSession, 14 * 24 * 60 * 60);
      if (success) {
        log.info('Session renewed successfully in Redis', { 
          sessionId: sessionId.substring(0, 8) + '...',
          newExpiresAt: newExpiresAt.toISOString()
        });
        return true;
      }
    } else {
      sessionStore.set(sessionId, updatedSession);
      log.info('Session renewed successfully in memory', { 
        sessionId: sessionId.substring(0, 8) + '...',
        newExpiresAt: newExpiresAt.toISOString()
      });
      return true;
    }
    
    return false;
  } catch (error) {
    log.error('Error renewing session', { 
      sessionId: sessionId.substring(0, 8) + '...', 
      error 
    });
    return false;
  }
};

// Get user by session ID
export const getUserBySession = async (sessionId: string) => {
  const useRedis = await ensureRedisConnection();
  log.debug('Getting user by session', { sessionId: sessionId.substring(0, 8) + '...', usingRedis: useRedis });
  
  try {
    let session: UserSession | null = null;
    
    if (useRedis) {
      // Try to get session from Redis
      session = await redisSessionHelpers.getSession(sessionId);
    } else {
      // Fallback to in-memory storage
      session = sessionStore.get(sessionId) || null;
    }
    
    if (!session) {
      log.warn('Session not found', { sessionId: sessionId.substring(0, 8) + '...', storageType: useRedis ? 'Redis' : 'Memory' });
      return null;
    }
    
    // Check if session is expired
    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      log.info('Session expired, removing', { 
        sessionId: sessionId.substring(0, 8) + '...', 
        expiredAt: expiresAt.toISOString(),
        storageType: useRedis ? 'Redis' : 'Memory'
      });
      
      if (useRedis) {
        await redisSessionHelpers.deleteSession(sessionId);
      } else {
        sessionStore.delete(sessionId);
      }
      return null;
    }
    
    log.debug('Valid session found, renewing session and fetching user from LiteLLM', { 
      userId: session.userId,
      email: session.email,
      storageType: useRedis ? 'Redis' : 'Memory'
    });
    
    // Renew session on successful validation
    await renewSession(sessionId);
    
    // Get user from LiteLLM
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_id=${session.userId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    if (!response.ok) {
      log.error('Failed to fetch user from LiteLLM', { 
        userId: session.userId,
        status: response.status,
        statusText: response.statusText
      });
      return null;
    }
    
    const userData = await response.json();
    const userInfo = userData.user_info || userData; // Handle both new and old response formats
    
    log.info('User fetched successfully from LiteLLM', { 
      userId: userInfo.user_id,
      email: userInfo.user_email 
    });
    
    return {
      _id: userInfo.user_id,
      llmuserid: userInfo.user_id,
      name: 'User',
      description: userInfo.metadata?.description || 'No description provided',
      authType: userInfo.metadata?.authType || 'auth0',
      createdAt: userInfo.metadata?.createdAt || userInfo.created_at || new Date().toISOString()
    };
  } catch (error) {
    log.error('Error getting user by session', { 
      sessionId: sessionId.substring(0, 8) + '...', 
      error 
    });
    return null;
  }
};

// Get user by Auth0 user ID
export const getUserByAuth0Id = async (auth0UserId: string, auth0Email?: string, auth0Name?: string) => {
  log.info('Getting user by Auth0 user ID', { auth0UserId });
  
  try {
    // Use Auth0 user ID as the LiteLLM user_id directly
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_id=${auth0UserId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        log.info('User not found in LiteLLM by Auth0 ID', { auth0UserId });
      } else {
        log.error('Failed to fetch user by Auth0 ID from LiteLLM', { 
          auth0UserId,
          status: response.status,
          statusText: response.statusText
        });
      }
      return null;
    }
    
    const userData = await response.json();
    log.debug('Raw LiteLLM response for getUserByAuth0Id', { 
      auth0UserId,
      responseKeys: Object.keys(userData),
      userId: userData.user_id,
      hasUserInfo: !!userData.user_info
    });
    
    // The response structure shows user_id at the top level, not in user_info
    const userId = userData.user_id;
    const userInfo = userData.user_info || {};
    
    log.debug('Processed userInfo from LiteLLM', { 
      auth0UserId,
      extractedUserId: userId,
      userInfoKeys: Object.keys(userInfo),
      userEmail: userInfo.user_email,
      metadata: userInfo.metadata
    });
    
    // Check if user has incomplete metadata and update if needed
    const hasIncompleteMetadata = !userInfo.user_email;
    if (hasIncompleteMetadata && auth0Email && auth0Name) {
      log.info('Auth0 user has incomplete metadata, updating...', { 
        auth0UserId,
        hasEmail: !!userInfo.user_email,
        providedEmail: auth0Email
      });
      
      const updateSuccess = await updateAuth0UserMetadata(auth0UserId, auth0Email, auth0Name);
      if (updateSuccess) {
        // Refetch user data after update
        const updatedResponse = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_id=${auth0UserId}`, {
          headers: {
            "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
          }
        });
        
        if (updatedResponse.ok) {
          const updatedUserData = await updatedResponse.json();
          const updatedUserInfo = updatedUserData.user_info || {};
          
          log.info('User metadata updated successfully, using updated data', { 
            auth0UserId,
            updatedEmail: updatedUserInfo.user_email
          });
          
          return {
            _id: userId,
            llmuserid: userId,
            name: 'Auth0 User',
            description: updatedUserInfo.metadata?.description || 'No description provided',
            authType: updatedUserInfo.metadata?.authType || 'auth0',
            createdAt: updatedUserInfo.metadata?.createdAt || updatedUserInfo.created_at || new Date().toISOString()
          };
        }
      }
    }
    
    log.info('User found by Auth0 ID in LiteLLM', { 
      auth0UserId,
      userId: userId 
    });
    
    return {
      _id: userId,
      llmuserid: userId,
      name: 'Auth0 User',
      description: userInfo.metadata?.description || 'No description provided',
      authType: userInfo.metadata?.authType || 'auth0', // Default to auth0 for Auth0 ID lookups
      createdAt: userInfo.metadata?.createdAt || userInfo.created_at || new Date().toISOString()
    };
  } catch (error) {
    log.error('Error getting user by Auth0 ID', { auth0UserId, error });
    return null;
  }
};

// Get user by email
export const getUserByEmail = async (email: string) => {
  log.info('Getting user by email', { email });
  
  try {
    // LiteLLM doesn't have direct email lookup, so we'll search by user_email
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_email=${email}`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        log.info('User not found in LiteLLM', { email });
      } else {
        log.error('Failed to fetch user by email from LiteLLM', { 
          email,
          status: response.status,
          statusText: response.statusText
        });
      }
      return null;
    }
    
    const userData = await response.json();
    log.debug('Raw LiteLLM response for getUserByEmail', { 
      email,
      responseKeys: Object.keys(userData),
      userId: userData.user_id,
      hasUserInfo: !!userData.user_info
    });
    
    const userInfo = userData.user_info || userData; // Handle both new and old response formats
    
    log.debug('Processed userInfo from LiteLLM', { 
      email,
      userInfoKeys: Object.keys(userInfo),
      userId: userInfo.user_id,
      userEmail: userInfo.user_email,
      metadata: userInfo.metadata
    });
    
    log.info('User found by email in LiteLLM', { 
      email,
      userId: userInfo.user_id 
    });
    
    return {
      _id: userInfo.user_id,
      llmuserid: userInfo.user_id,
      name: 'User',
      description: userInfo.metadata?.description || 'No description provided',
      authType: userInfo.metadata?.authType || 'auth0', // Default to auth0 for email lookups
      createdAt: userInfo.metadata?.createdAt || userInfo.created_at || new Date().toISOString()
    };
  } catch (error) {
    log.error('Error getting user by email', { email, error });
    return null;
  }
};

// Create user (this will be handled by LiteLLM user/new endpoint)
export const createUser = async (
  email: string,
  name: string,
  description: string,
  authType: 'auth0' | 'non-auth0',
  auth0UserId?: string, // Optional Auth0 user ID for Auth0 users
  acceptedToS?: boolean,
  acceptedCommunications?: boolean,
) => {
  // Determine team based on authType
  const teamId = authType === 'auth0' 
    ? (process.env.LITELLM_TEAM_AUTH0 || 'chatapi-auth0')
    : (process.env.LITELLM_TEAM_PERMISSIONLESS || 'chatapi-pless');
  
  log.info('Creating new user in LiteLLM', { 
    email, 
    authType,
    auth0UserId,
    acceptedToS,
    acceptedCommunications,
    userRole: process.env.LITELLM_USER_ROLE,
    teamId: teamId
  });
  
  try {
    const now = new Date().toISOString();
    const requestBody: any = {
      "key_alias": email,
      "user_email": email,
      "user_role": process.env.LITELLM_USER_ROLE,
      "max_parallel_requests": process.env.LITELLM_MAX_PARALLEL_REQUESTS,
      "team_id": teamId,
      "teams": [teamId],
      "metadata": {
        description,
        authType,
        createdAt: now,
        acceptedToS: acceptedToS || false,
        acceptedCommunications: acceptedCommunications || false,
        ...(acceptedToS && { tosAcceptedAt: now }),
        ...(acceptedCommunications && { communicationsAcceptedAt: now }),
        ...(auth0UserId && { auth0UserId }) // Include Auth0 user ID in metadata if provided
      },
      "auto_create_key": true
    };

    // For permissionless users, add expiration to the key
    if (authType === 'non-auth0') {
      // Set via environment variable or use default
      const envExpirationDate = process.env.API_KEY_EXPIRATION_DATE 
        ? new Date(process.env.API_KEY_EXPIRATION_DATE)
        : null;
      
      // Default: 30 days from now
      const defaultExpirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      // Use the more restrictive (earlier) expiration date
      const expirationDate = envExpirationDate && envExpirationDate < defaultExpirationDate
        ? envExpirationDate
        : defaultExpirationDate;
      
      // Calculate duration in seconds from now until expiration
      const durationSeconds = Math.floor((expirationDate.getTime() - Date.now()) / 1000);
      const durationString = `${durationSeconds}s`;
      
      requestBody.duration = durationString;
      
      log.info('Setting expiration for permissionless user key', { 
        email,
        duration: durationString,
        expiresAt: expirationDate.toISOString(),
        usingEnvVariable: !!envExpirationDate && envExpirationDate < defaultExpirationDate
      });
    }

    // For Auth0 users, use their Auth0 user ID as the LiteLLM user_id
    if (authType === 'auth0' && auth0UserId) {
      requestBody.user_id = auth0UserId;
      log.info('Using Auth0 user ID as LiteLLM user_id', { auth0UserId });
    }
    
    log.debug('Sending user creation request to LiteLLM', { requestBody });
    
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('Failed to create user in LiteLLM', { 
        email,
        auth0UserId,
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Failed to create user in LiteLLM: ${response.status} ${response.statusText}`);
    }

    const userData = await response.json();
    log.info('User created successfully in LiteLLM', { 
      email,
      auth0UserId,
      userId: userData.user_id,
      hasKey: !!userData.key,
      teamId: teamId
    });
    
    return {
      insertedId: userData.user_id,
      user_id: userData.user_id,
      key: userData.key
    };
  } catch (error) {
    log.error('Error creating user', { email, authType, auth0UserId, error });
    return null;
  }
};

// Get user's API keys from LiteLLM
export const getUserApiKeys = async (userId: string) => {
  log.info('Fetching API keys for user', { userId });
  
  try {
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_id=${userId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        log.info('No user found', { userId });
        return [];
      } else {
        log.error('Failed to fetch user info from LiteLLM', { 
          userId,
          status: response.status,
          statusText: response.statusText
        });
        return [];
      }
    }
    
    const userData = await response.json();
    const keys = userData.keys || [];
    
    log.info('API keys fetched successfully', { 
      userId,
      keyCount: keys.length 
    });
    
    const processedKeys = keys.map((key: any) => {
      // Use the token field for the actual API key
      const token = key.token || '';
      
      return {
        _id: key.token || key.key_name || `key_${Date.now()}`,
        keyId: key.token || '',
        keyPreview: key.key_name,
        name: key.key_name || key.key_alias || `API Key ${new Date().toLocaleDateString()}`,
        createdAt: key.created_at || new Date().toISOString(),
        lastUsed: key.last_used_at,
        isActive: !key.expires || new Date(key.expires) > new Date(),
        expiresAt: key.expires
      };
    });
    
    log.debug('Processed API keys', { 
      userId,
      keys: processedKeys.map((k: any) => ({ 
        keyPreview: k.keyPreview, 
        name: k.name, 
        isActive: k.isActive,
        hasToken: !!k.keyId
      }))
    });
    
    return processedKeys;
  } catch (error) {
    log.error('Error getting user API keys', { userId, error });
    return [];
  }
};

// Get complete user info with API keys from LiteLLM
export const getUserInfoWithKeys = async (userId: string) => {
  log.info('Fetching complete user info with keys', { userId });
  
  try {
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_id=${userId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        log.info('No user found', { userId });
        return null;
      } else {
        log.error('Failed to fetch user info from LiteLLM', { 
          userId,
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }
    }
    
    const userData = await response.json();
    log.debug('Raw LiteLLM response for getUserInfoWithKeys', { 
      userId,
      responseKeys: Object.keys(userData),
      hasUserInfo: !!(userData.user_info || userData.user_id),
      hasKeys: !!(userData.keys),
      keyCount: userData.keys ? userData.keys.length : 0
    });
    
    const userInfo = userData.user_info || userData;
    const keys = userData.keys || [];
    
    log.debug('Processed userInfo and keys from LiteLLM', { 
      userId,
      userInfoKeys: Object.keys(userInfo),
      userInfoUserId: userInfo.user_id,
      userInfoEmail: userInfo.user_email,
      metadata: userInfo.metadata,
      keyCount: keys.length,
      rawKeys: keys.map((k: any) => ({
        token: k.token?.substring(0, 12) + '...',
        key_name: k.key_name,
        key_alias: k.key_alias,
        user_id: k.user_id,
        created_at: k.created_at,
        expires: k.expires
      }))
    });
    
    log.info('User info with keys fetched successfully', { 
      userId,
      keyCount: keys.length 
    });
    
    const processedKeys = keys.map((key: any) => {
      // Use the token field for the actual API key
      const token = key.token || '';
      
      return {
        _id: key.token || key.key_name || `key_${Date.now()}`,
        keyId: key.token || '',
        keyPreview: key.key_name,
        name: key.key_name || key.key_alias || `API Key ${new Date().toLocaleDateString()}`,
        createdAt: key.created_at || new Date().toISOString(),
        lastUsed: key.last_used_at,
        isActive: !key.expires || new Date(key.expires) > new Date(),
        expiresAt: key.expires
      };
    });
    
    return {
      user: {
        _id: userInfo.user_id,
        llmuserid: userInfo.user_id,
        verifiedEmail: userInfo.metadata?.verifiedEmail,
        name: userInfo.user_id.startsWith('auth0|') ? 'Auth0 User' : 'User',
        description: userInfo.metadata?.description || 'No description provided',
        authType: userInfo.metadata?.authType || 'auth0', // Default to auth0 since this is called for Auth0 users
        createdAt: userInfo.metadata?.createdAt || userInfo.created_at || new Date().toISOString()
      },
      apiKeys: processedKeys
    };
  } catch (error) {
    log.error('Error getting user info with keys', { userId, error });
    return null;
  }
};

// Update API key name in LiteLLM
export const updateApiKeyName = async (userId: string, keyId: string, name: string) => {
  log.info('Updating API key name', { 
    userId, 
    keyPreview: keyId.substring(0, 12) + '...', 
    newName: name 
  });
  
  try {
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/key/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      },
      body: JSON.stringify({
        "key": keyId,
        "key_name": name
      })
    });
    
    if (response.ok) {
      log.info('API key name updated successfully', { 
        userId, 
        keyPreview: keyId.substring(0, 12) + '...', 
        newName: name 
      });
    } else {
      log.error('Failed to update API key name', { 
        userId,
        keyPreview: keyId.substring(0, 12) + '...',
        newName: name,
        status: response.status,
        statusText: response.statusText
      });
    }
    
    return response.ok;
  } catch (error) {
    log.error('Error updating API key name', { 
      userId, 
      keyPreview: keyId.substring(0, 12) + '...', 
      newName: name, 
      error 
    });
    return false;
  }
};

// Deactivate API key in LiteLLM
export const deactivateApiKey = async (userId: string, keyId: string) => {
  log.info('Deactivating API key', { 
    userId, 
    keyPreview: keyId.substring(0, 12) + '...' 
  });
  
  try {
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/key/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      },
      body: JSON.stringify({
        "keys": [keyId]
      })
    });
    
    if (response.ok) {
      log.info('API key deactivated successfully', { 
        userId, 
        keyPreview: keyId.substring(0, 12) + '...' 
      });
    } else {
      log.error('Failed to deactivate API key', { 
        userId,
        keyPreview: keyId.substring(0, 12) + '...',
        status: response.status,
        statusText: response.statusText
      });
    }
    
    return response.ok;
  } catch (error) {
    log.error('Error deactivating API key', { 
      userId, 
      keyPreview: keyId.substring(0, 12) + '...', 
      error 
    });
    return false;
  }
};

// Generate new API key for existing user
export const generateApiKey = async (userId: string, keyName: string) => {
  log.info('Generating new API key for user', { 
    userId, 
    keyName,
    maxParallelRequests: process.env.LITELLM_MAX_PARALLEL_REQUESTS,
    userRole: process.env.LITELLM_USER_ROLE
  });
  
  try {
    // First get the user info to get their email for the key alias
    const userResponse = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_id=${userId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    if (!userResponse.ok) {
      log.error('Failed to fetch user info for key generation', { 
        userId,
        status: userResponse.status,
        statusText: userResponse.statusText
      });
      throw new Error(`Failed to fetch user info: ${userResponse.status} ${userResponse.statusText}`);
    }
    
    const userData = await userResponse.json();
    const userInfo = userData.user_info || userData;
    const userEmail = userInfo.user_email || `${userId}@unknown.com`; // Fallback email if missing
    const authType = userInfo.metadata?.authType || 'auth0'; // Default to auth0 if not specified
    
    // Determine team based on authType
    const teamId = authType === 'auth0' 
      ? (process.env.LITELLM_TEAM_AUTH0 || 'chatapi-auth0')
      : (process.env.LITELLM_TEAM_PERMISSIONLESS || 'chatapi-pless');
    
    // Use the standard key generation endpoint with proper user association
    const timestamp = Date.now().toString(36);
    const randomHash = Math.random().toString(36).substring(2, 8);
    const uniqueKeyAlias = `${userEmail}-${timestamp}-${randomHash}`;
    
    log.debug('Retrieved user info for key generation', { 
      userId,
      email: userEmail,
      keyName,
      uniqueKeyAlias,
      authType,
      teamId,
      existingUserRole: userInfo.user_role,
      existingMaxParallelRequests: userInfo.max_parallel_requests,
      existingTeams: userInfo.teams,
      hasOriginalEmail: !!userInfo.user_email,
      usingFallbackEmail: !userInfo.user_email
    });
    
    const requestBody: any = {
      "user_id": userId, // Ensure this is always the original user ID
      "key_alias": uniqueKeyAlias, // Use unique key alias to avoid conflicts
      "key_name": keyName,
      "user_role": userInfo.user_role || process.env.LITELLM_USER_ROLE,
      "max_parallel_requests": process.env.LITELLM_MAX_PARALLEL_REQUESTS,
      "team_id": teamId,
      "teams": userInfo.teams || [teamId],
      "metadata": {
        createdAt: new Date().toISOString(),
        isActive: true,
        originalEmail: userEmail
      }
    };

    // For permissionless users, add expiration to the key
      // Set via environment variable or use default
      const envExpirationDate = process.env.API_KEY_EXPIRATION_DATE 
        ? new Date(process.env.API_KEY_EXPIRATION_DATE)
        : null;
      
      let defaultExpirationDateNumber = 30;

      if (authType === 'non-auth0') {
        defaultExpirationDateNumber = 5;
      }
      const defaultExpirationDate = new Date(Date.now() + defaultExpirationDateNumber * 24 * 60 * 60 * 1000);
      
      // Use the more restrictive (earlier) expiration date
      const expirationDate = envExpirationDate && envExpirationDate < defaultExpirationDate
        ? envExpirationDate
        : defaultExpirationDate;

      console.log('expirationDate', expirationDate.toISOString());
      
      // Calculate duration in seconds from now until expiration
      const durationSeconds = Math.floor((expirationDate.getTime() - Date.now()) / 1000);
      const durationString = `${durationSeconds}s`;
      
      requestBody.duration = durationString;
      
      log.info('Setting expiration for permissionless user key', { 
        userId,
        keyName,
        duration: durationString,
        expiresAt: expirationDate.toISOString(),
        usingEnvVariable: !!envExpirationDate && envExpirationDate < defaultExpirationDate
      });
    
    log.debug('Generating API key with request body', { userId, requestBody });
    
    // Try the primary key generation endpoint
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/key/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      log.error('Key generation failed', { 
        userId,
        keyName,
        userEmail,
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Failed to generate API key: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const keyData = await response.json();
    log.info('API key generated successfully', { 
      userId,
      keyName,
      userEmail,
      authType,
      teamId,
      keyAlias: uniqueKeyAlias,
      keyPreview: keyData.key ? keyData.key.substring(0, 12) + '...' : 'No key in response',
      keyId: keyData.key_id || keyData.key,
      responseKeys: Object.keys(keyData)
    });
    
    return {
      key: keyData.key,
      key_id: keyData.key_id || keyData.key
    };
  } catch (error) {
    log.error('Error generating API key', { userId, keyName, error });
    return null;
  }
};

// Check if user has any active API keys
export const userHasActiveApiKey = async (userId: string) => {
  log.info('Checking if user has active API keys', { userId });
  
  try {
    const apiKeys = await getUserApiKeys(userId);
    const activeKeys = apiKeys.filter((key: any) => key.isActive);
    
    log.info('Active API key check completed', { 
      userId,
      totalKeys: apiKeys.length,
      activeKeys: activeKeys.length,
      hasActiveKey: activeKeys.length > 0
    });
    
    return activeKeys.length > 0;
  } catch (error) {
    log.error('Error checking for active API keys', { userId, error });
    return false;
  }
};

// Clean up expired sessions
export const cleanupExpiredSessions = async () => {
  const useRedis = await ensureRedisConnection();
  log.info('Starting session cleanup', { 
    storageType: useRedis ? 'Redis' : 'Memory',
    totalSessions: useRedis ? 'Redis' : sessionStore.size 
  });
  
  try {
    let deletedCount = 0;
    
    if (useRedis) {
      // Redis automatically handles expiration, but we can do manual cleanup if needed
      deletedCount = await redisSessionHelpers.cleanupExpiredSessions();
    } else {
      // In-memory cleanup
      const now = new Date();
      
      // Convert to array to avoid iteration issues
      const sessions = Array.from(sessionStore.entries());
      
      for (const [sessionId, session] of sessions) {
        if (session.expiresAt < now) {
          sessionStore.delete(sessionId);
          deletedCount++;
          log.debug('Expired session removed', { 
            sessionId: sessionId.substring(0, 8) + '...',
            email: session.email,
            expiredAt: session.expiresAt.toISOString()
          });
        }
      }
    }
    
    log.info('Session cleanup completed', { 
      deletedCount,
      remainingSessions: useRedis ? 'Redis managed' : sessionStore.size,
      totalProcessed: useRedis ? 'Redis managed' : sessionStore.size + deletedCount,
      storageType: useRedis ? 'Redis' : 'Memory'
    });
    
    return deletedCount;
  } catch (error) {
    log.error('Error cleaning up expired sessions', { error });
    return 0;
  }
};

// Update user metadata for Auth0 users
export const updateAuth0UserMetadata = async (auth0UserId: string, email: string, name: string) => {
  log.info('Updating Auth0 user metadata', { auth0UserId, email });
  
  try {
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      },
      body: JSON.stringify({
        "user_id": auth0UserId,
        "user_email": email,
        "metadata": {
          authType: 'auth0',
          updatedAt: new Date().toISOString()
        }
      })
    });
    
    if (response.ok) {
      log.info('Auth0 user metadata updated successfully', { auth0UserId });
      return true;
    } else {
      log.error('Failed to update Auth0 user metadata', { 
        auth0UserId,
        status: response.status,
        statusText: response.statusText
      });
      return false;
    }
  } catch (error) {
    log.error('Error updating Auth0 user metadata', { auth0UserId, error });
    return false;
  }
};

// Check if user has valid consent for terms and communications
export const checkUserConsent = async (userId: string): Promise<{ 
  hasValidConsent: boolean; 
  missingConsent: string[];
  consentDetails: {
    tosAccepted: boolean;
    tosAcceptedAt?: string;
    communicationsAccepted: boolean;
    communicationsAcceptedAt?: string;
  };
}> => {
  log.info('Checking user consent status', { userId });
  
  try {
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_id=${userId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    if (!response.ok) {
      log.error('Failed to fetch user info for consent check', { 
        userId,
        status: response.status,
        statusText: response.statusText
      });
      return { 
        hasValidConsent: false, 
        missingConsent: ['Unable to verify consent'],
        consentDetails: {
          tosAccepted: false,
          communicationsAccepted: false
        }
      };
    }
    
    const userData = await response.json();
    const userInfo = userData.user_info || userData;
    const metadata = userInfo.metadata || {};
    
    const missingConsent: string[] = [];
    const tosAccepted = !!metadata.acceptedToS;
    const communicationsAccepted = !!metadata.acceptedCommunications;
    
    if (!tosAccepted) {
      missingConsent.push('Terms of Service');
    }
    
    if (!communicationsAccepted) {
      missingConsent.push('Communications consent');
    }
    
    const hasValidConsent = missingConsent.length === 0;
    
    const consentDetails = {
      tosAccepted,
      tosAcceptedAt: metadata.tosAcceptedAt,
      communicationsAccepted,
      communicationsAcceptedAt: metadata.communicationsAcceptedAt
    };
    
    log.info('User consent check completed', { 
      userId,
      hasValidConsent,
      missingConsent,
      consentDetails
    });
    
    return { hasValidConsent, missingConsent, consentDetails };
  } catch (error) {
    log.error('Error checking user consent', { userId, error });
    return { 
      hasValidConsent: false, 
      missingConsent: ['Error checking consent'],
      consentDetails: {
        tosAccepted: false,
        communicationsAccepted: false
      }
    };
  }
};

// Update user consent status
export const updateUserConsent = async (
  userId: string, 
  acceptedToS?: boolean, 
  acceptedCommunications?: boolean
): Promise<boolean> => {
  log.info('Updating user consent', { userId, acceptedToS, acceptedCommunications });
  
  try {
    // First get current user data
    const response = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/info?user_id=${userId}`, {
      headers: {
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      }
    });
    
    if (!response.ok) {
      log.error('Failed to fetch user info for consent update', { 
        userId,
        status: response.status,
        statusText: response.statusText
      });
      return false;
    }
    
    const userData = await response.json();
    const userInfo = userData.user_info || userData;
    const currentMetadata = userInfo.metadata || {};
    
    // Prepare updated metadata
    const now = new Date().toISOString();
    const updatedMetadata = {
      ...currentMetadata,
      ...(acceptedToS !== undefined && { 
        acceptedToS,
        ...(acceptedToS && { tosAcceptedAt: now })
      }),
      ...(acceptedCommunications !== undefined && { 
        acceptedCommunications,
        ...(acceptedCommunications && { communicationsAcceptedAt: now })
      })
    };
    
    // Update user metadata
    const updateResponse = await fetch(`${process.env.LITELLM_API_ENDPOINT}/user/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.LITELLM_ADMIN_KEY}`
      },
      body: JSON.stringify({
        user_id: userId,
        metadata: updatedMetadata
      })
    });
    
    if (!updateResponse.ok) {
      log.error('Failed to update user consent', { 
        userId,
        status: updateResponse.status,
        statusText: updateResponse.statusText
      });
      return false;
    }
    
    log.info('User consent updated successfully', { 
      userId,
      acceptedToS,
      acceptedCommunications
    });
    
    return true;
  } catch (error) {
    log.error('Error updating user consent', { userId, error });
    return false;
  }
};