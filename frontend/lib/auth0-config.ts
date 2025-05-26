export const auth0Config = {
  clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
  domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
  redirectUri: process.env.NEXT_PUBLIC_AUTH0_REDIRECT_URI || 'http://localhost:3000',
  audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '',
  scope: 'openid profile email',
};

export const getAuth0Config = () => {
  if (!auth0Config.clientId || !auth0Config.domain) {
    throw new Error('Auth0 configuration is missing. Please check your environment variables.');
  }
  return auth0Config;
}; 