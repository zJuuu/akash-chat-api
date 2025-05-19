import { Configuration, FrontendApi } from "@ory/client"

// For local development
export const baseUrl = process.env.NEXT_PUBLIC_ORY_SDK_URL || "https://playground.projects.oryapis.com"

// The URL of your application
const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"

// Create a new Ory Frontend API client
export const ory = new FrontendApi(
  new Configuration({
    basePath: baseUrl,
    baseOptions: {
      withCredentials: true,
    },
  })
)

// Helper to get the user's name from their identity
export const getUserName = (identity: any) =>
  identity?.traits.email || identity?.traits.username || "user"
  
// Create a login URL with return_to set to the dashboard
export const createLoginUrl = (returnTo = "/dashboard") => {
  return `${baseUrl}/ui/login?return_to=${encodeURIComponent(appUrl + returnTo)}`
}

// Create a registration URL with return_to set to the dashboard
export const createRegistrationUrl = (returnTo = "/dashboard") => {
  return `${baseUrl}/ui/registration?return_to=${encodeURIComponent(appUrl + returnTo)}`
} 