# AkashChat API

A comprehensive solution for LLM integration and API key generation, deployed on the Akash Network.

## Overview

This repository contains the complete codebase and deployment instructions for the AkashChat API service. The project consists of two main components:

1. A frontend application for API key generation and account management
2. A backend service for LLM (Large Language Model) load balancing

## Components

### Frontend

- **Purpose**: User interface for API key generation and account management
- **Live Version**: [chatapi.akash.network](https://chatapi.akash.network)
- **Location**: `/frontend` directory
- **Requirements**:
  - A running instance of the LiteLLM backend

### Backend

- **Technology**: [LiteLLM](https://github.com/BerriAI/litellm/)
- **Features**: 
  - Intelligent load balancing across multiple LLM providers
  - Unified API interface for various LLM services
  - Built-in user and API key management
  - PostgreSQL database for user/key storage
  - Redis caching for prompt caching
- **Requirements**:
  - A working LiteLLM configuration file - example can be found in the `deployment/config.yaml` file

## Architecture

```
Frontend (Next.js) 
    ↓ API calls
LiteLLM Proxy (User & Key management)
    ↓
PostgreSQL (User/key storage)
    ↓
Redis (Caching & routing)
    ↓
LLM Providers (Akash Network models)
```

### Key Features:

- **Simplified Backend**: Single LiteLLM instance handles all user management, API keys, and LLM routing
- **Permissionless Access**: Users can generate API keys without account creation
- **Extended Access**: Auth0 integration for enhanced features
- **Account Management**: Full dashboard for API key management
- **Session Management**: Secure temporary sessions for permissionless users

## Deployment

- Deployment configuration is available in the `deployment` directory
- Use `deploy.yml` for deploying the service to Akash Network
- Additional configuration options can be found in `deployment/config.yaml`

## Getting Started

Please refer to the respective directories for detailed setup instructions:
- Frontend setup: See `/frontend/README.md`
- Deployment guide: Check the files in `/deployment`

## Environment Variables

The application requires the following key environment variables:

- `LITELLM_API_ENDPOINT` - LiteLLM proxy server URL
- `LITELLM_ADMIN_KEY` - LiteLLM admin/master key
- `LITELLM_USER_ROLE` - Default user role
- `LITELLM_MAX_PARALLEL_REQUESTS` - Rate limiting
- `LITELLM_TEAM_ID` - Default team ID (legacy, kept for backward compatibility)
- `LITELLM_TEAM_AUTH0` - Team ID for Auth0 authenticated users (default: "chatapi-auth0")
- `LITELLM_TEAM_PERMISSIONLESS` - Team ID for permissionless users (default: "chatapi-pless")
- `RECAPTCHA_SECRET_KEY` - reCAPTCHA protection
- `AUTH0_*` - Auth0 configuration (optional)

### Team Configuration

The application now supports different teams based on authentication type:
- **Auth0 users**: Assigned to `chatapi-auth0` team with no key expiration
- **Permissionless users**: Assigned to `chatapi-pless` team with 5-day key expiration

## Support

For issues and questions:
- Check the [LiteLLM documentation](https://docs.litellm.ai/)
- Open an issue on this GitHub repository
- Join the Akash Network Discord for community support