# AkashChat API Frontend

This is the frontend application for the AkashChat API, built with Next.js and TypeScript. It provides a user interface for generating API keys and accessing documentation for the AkashChat API service.

## Features

- **LiteLLM-only Architecture**: No MongoDB dependency, uses LiteLLM's PostgreSQL backend
- **Dual Authentication**: Supports both permissionless access and Auth0 extended access
- **Redis Session Storage**: Optional Redis support for scalable session management
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Health Monitoring**: Built-in health checks for all services
- **One API Key Policy**: Users can only have one active API key at a time

## Environment Variables

### Required Variables

```bash
# LiteLLM Configuration
LITELLM_API_ENDPOINT=http://localhost:4000
LITELLM_ADMIN_KEY=your-admin-key
LITELLM_USER_ROLE=internal_user_viewer
LITELLM_MAX_PARALLEL_REQUESTS=3
LITELLM_TEAM_ID=your-team-id
LITELLM_TEAM_AUTH0=chatapi-auth0
LITELLM_TEAM_PERMISSIONLESS=chatapi-pless

# reCAPTCHA Configuration (for permissionless signup)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

### Optional Variables

```bash
# Auth0 Configuration (for extended access)
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Redis Configuration (for session storage)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Development Settings
NODE_ENV=development
LOG_LEVEL=DEBUG
```

## Redis Setup for Development

### Option 1: Using Docker Compose (Recommended)

The project includes a Redis service in `docker-compose.yml`. To start Redis:

```bash
# Start Redis only
docker-compose up redis -d

# Or start all services
docker-compose up -d
```

### Option 2: Local Redis Installation

#### macOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Windows
Download and install from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)

### Verifying Redis Connection

You can test Redis connectivity using the health endpoint:

```bash
curl http://localhost:3000/api/admin/health
```

Look for the `services.redis.status` field in the response.

## Session Storage

The application supports two session storage modes:

1. **Redis Storage** (Production recommended)
   - Scalable across multiple instances
   - Persistent across application restarts
   - Automatic expiration handling

2. **In-Memory Storage** (Development fallback)
   - Used when Redis is not available
   - Lost on application restart
   - Single instance only

The system automatically detects Redis availability and falls back to in-memory storage if Redis is not accessible.

## Authentication State Persistence

The application now includes improved authentication state persistence to ensure users remain logged in across page refreshes and navigation. Here's how it works:

### Key Features

1. **Dual Authentication Support**
   - Auth0 SSO for extended access users
   - Session-based authentication for permissionless users

2. **State Persistence**
   - Authentication state is persisted in sessionStorage
   - Automatic restoration on page refresh (within 7 days to match session expiration)
   - Cross-tab logout synchronization

3. **Robust Error Handling**
   - Automatic retry with exponential backoff
   - Graceful fallback for network errors
   - Error boundary for React errors

4. **Session Management**
   - Periodic session validation (every 5 minutes)
   - Automatic cleanup of expired sessions
   - Page visibility-based refresh

### Implementation Details

#### UserProvider Improvements

The `UserProvider` component now includes:

- **Request Cancellation**: Prevents race conditions with AbortController
- **Retry Logic**: Automatic retry with exponential backoff for failed requests
- **State Persistence**: Saves authentication state to sessionStorage
- **Cross-tab Sync**: Listens for storage events to sync logout across tabs
- **Visibility Handling**: Refreshes auth state when page becomes visible

#### Session Storage

Authentication state is stored in sessionStorage with:
- 7-day expiration to match actual session expiration
- Automatic cleanup of stale data
- Fallback to fresh authentication check

#### Error Recovery

- Network errors trigger automatic retry (up to 3 attempts)
- React errors are caught by ErrorBoundary
- Users can manually retry failed operations

### Usage

The authentication state is available throughout the app via the `useAppUser` hook:

```typescript
const { 
  isAuthenticated, 
  isLoading, 
  authType, 
  user, 
  error, 
  logout, 
  checkAuth,
  clearError 
} = useAppUser();
```

### Benefits

1. **Better UX**: Users stay logged in across page refreshes
2. **Reliability**: Automatic error recovery and retry logic
3. **Security**: Proper session expiration and cleanup
4. **Performance**: Reduced unnecessary authentication checks
5. **Consistency**: Synchronized state across browser tabs

## Development

### Prerequisites

- Node.js 20+
- npm or yarn
- Redis (optional, but recommended)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start Redis (if using Docker)
docker-compose up redis -d

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
```

## Architecture

### LiteLLM Integration

The application uses LiteLLM as the primary backend for:
- User management
- API key generation and management
- Authentication and authorization
- Usage tracking

### Session Management

- **Permissionless Users**: Sessions stored in Redis/memory with 7-day expiration
- **Auth0 Users**: Sessions managed by Auth0, no local storage needed

### API Key Policy

- Users can only have one active API key at a time
- Must deactivate existing key before generating a new one
- Clear UI feedback about the policy

## Monitoring

### Health Checks

The application provides comprehensive health monitoring at `/api/admin/health`:

```json
{
  "status": "healthy",
  "services": {
    "litellm": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "frontend": { "status": "healthy" }
  },
  "sessions": {
    "storageType": "Redis",
    "cleanedExpiredSessions": 0
  }
}
```

### Logging

All operations are logged with structured data:
- Request tracking with unique IDs
- Performance metrics
- Error details with context
- Security events

## Deployment

### Docker

```bash
# Build and start all services
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Notes

- **Development**: Redis is optional, falls back to in-memory storage
- **Production**: Redis is highly recommended for session persistence
- **Scaling**: Multiple frontend instances require Redis for shared sessions

## Troubleshooting

### Common Issues

1. **Invalid User Role Error (422)**
   - Ensure `LITELLM_USER_ROLE` is a valid LiteLLM role
   - Valid roles: `internal_user_viewer`, `internal_user`, `proxy_admin_viewer`, `proxy_admin`

2. **Redis Connection Issues**
   - Check Redis is running: `redis-cli ping`
   - Verify environment variables: `REDIS_HOST`, `REDIS_PORT`
   - Check Docker container: `docker-compose logs redis`

3. **Session Issues**
   - Check health endpoint for session storage type
   - Verify Redis connectivity if using Redis
   - Clear browser cookies if needed

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development
LOG_LEVEL=DEBUG
```

This will show detailed logs for all operations including Redis connections and session management.

## Support

For issues and questions:
- Check the [LiteLLM documentation](https://docs.litellm.ai/)
- Monitor application logs for detailed error information
- Use the health check endpoint to verify system status
- Open an issue on the GitHub repository
- Join the Akash Network Discord for community support

## Auth0 Flow Testing

The Auth0 authentication flow has been improved with the following features:

### 🔧 **Auth0 Flow Features**

1. **Automatic User Creation**: Auth0 users are automatically created in LiteLLM upon first login
2. **Smart API Key Generation**: 
   - If user exists and has API keys → redirect to account page
   - If user exists but no API keys → generate new API key
   - If user doesn't exist → create user and API key
3. **Proper Logout Handling**: Auth0 logout redirects to Auth0's logout endpoint
4. **Seamless Integration**: Works alongside permissionless authentication

### 🧪 **Testing the Auth0 Flow**

1. **Setup Auth0 Environment Variables**:
   ```bash
   AUTH0_SECRET=your-auth0-secret
   AUTH0_BASE_URL=http://localhost:3000
   AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   ```

2. **Test Login Flow**:
   - Go to homepage
   - Click "Get Started"
   - Switch to "Extended" tab
   - Click "Sign up with Extended Access"
   - Complete Auth0 login
   - Should automatically create user in LiteLLM and redirect to account page

3. **Test API Key Generation**:
   - After login, if no API key exists, generate one from account page
   - If API key exists, should show existing keys

4. **Test Logout**:
   - Click logout button
   - Should redirect to Auth0 logout and then back to homepage

### 🔍 **Auth0 Flow Debugging**

Check browser console for detailed logs:
- `[UserProvider]` logs for authentication state
- `[Auth0-*]` logs for Auth0-specific operations
- Network tab for API calls to `/api/account/me` and `/api/users/*`

### 🚨 **Common Auth0 Issues**

1. **Missing Environment Variables**: Check that all Auth0 env vars are set
2. **Email Not Available**: Ensure Auth0 app requests email scope
3. **User Creation Fails**: Check LiteLLM configuration and logs
4. **Logout Issues**: Verify AUTH0_BASE_URL matches your domain
