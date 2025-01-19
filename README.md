# Akash Chat API

A comprehensive solution for LLM integration and API key generation, deployed on the Akash Network.

## Overview

This repository contains the complete codebase and deployment instructions for the Akash Chat API service. The project consists of two main components:

1. A frontend application for API key generation
2. A backend service for LLM (Large Language Model) load balancing

## Components

### Frontend

- **Purpose**: User interface for API key generation
- **Live Version**: [chatapi.akash.network](https://chatapi.akash.network)
- **Location**: `/frontend` directory
- **Requirements**:
  - MongoDB instance running on port 27017 for user data storage
  - A running instance of the LiteLLM backend

### Backend

- **Technology**: [LiteLLM](https://github.com/BerriAI/litellm/)
- **Features**: 
  - Intelligent load balancing across multiple LLM providers
  - Unified API interface for various LLM services
  - Redis caching for prompt caching
- **Requirements**:
  - A working LiteLLM configuration file - example can be found in the `deployment/config.yaml` file

## Deployment

- Deployment configuration is available in the `deployment` directory
- Use `deploy.yml` for deploying the service to Akash Network
- Additional configuration options can be found in `deployment/config.yaml`

## Getting Started

Please refer to the respective directories for detailed setup instructions:
- Frontend setup: See `/frontend/README.md`
- Deployment guide: Check the files in `/deployment`