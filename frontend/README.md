# Akash Chat API Frontend

This is the frontend application for the Akash Chat API, built with Next.js and TypeScript. It provides a user interface for generating API keys and accessing documentation for the Akash Chat API service.

## Prerequisites

- Node.js >= 20.0.0
- npm, yarn, or pnpm package manager
- Docker (optional, for containerized deployment)

## Local Development

1. Clone the repository:

```bash
git clone https://github.com/akash-network/akash-chat-api
cd frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env.local` file in the root directory with the following variables:

```plaintext
MONGODB_URI=your_mongodb_connection_string
LITELLM_API_ENDPOINT=your_litellm_api_endpoint
LITELLM_ADMIN_KEY=your_litellm_admin_key
LITELLM_USER_ROLE=your_user_role
LITELLM_MAX_PARALLEL_REQUESTS=your_max_requests
LITELLM_TEAM_ID=your_team_id
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

To start the production server:

```bash
npm run start
# or
yarn start
# or
pnpm start
```

## Docker Deployment

1. Build the Docker image:

```bash
docker build -t chat-api-frontend .
```

2. Run the container:

```bash
docker run -p 3000:3000 --env-file .env.local chat-api-frontend
```

Alternatively, use Docker Compose:

```bash
docker compose up
```

The application will be available at `http://localhost:3000`.

## Project Structure

- `/app` - Next.js 13+ app directory containing pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and shared code
- `/public` - Static assets