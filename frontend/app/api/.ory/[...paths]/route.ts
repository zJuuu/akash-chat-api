// @ory/integrations offers a package for integrating with Next.js in development. It is not needed in production.
// @ory/integrations works in a similar way as ory tunnel, read more about it what it does:
// https://www.ory.sh/docs/guides/cli/proxy-and-tunnel
import { createApiHandler } from "@ory/integrations/next-edge-app"

// Create the API handler
const handler = createApiHandler({
  fallbackToPlayground: true,
  dontUseTldForCookieDomain: true,
})

// Export the handler functions
export const GET = handler.GET
export const POST = handler.POST 