# AkashChat API Frontend

This is the frontend application for the AkashChat API, built with Next.js and TypeScript. It provides documentation and information about the AkashChat API service.

## Features

- **LiteLLM-only Architecture**: No MongoDB dependency, uses LiteLLM's PostgreSQL backend
- **Redis Session Storage**: Optional Redis support for scalable session management
- **Comprehensive Logging**: Detailed logging for monitoring and debugging
- **Health Monitoring**: Built-in health checks for all services

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
```

### Optional Variables

```bash
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
