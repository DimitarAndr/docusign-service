import { validateEnv } from './env.validation';

export default () => {
  const env = validateEnv();
  
  return {
    port: parseInt(env.PORT, 10),
    database: {
      url: env.DATABASE_URL,
    },
    docusign: {
      integrationKey: env.DOCUSIGN_INTEGRATION_KEY,
      userId: env.DOCUSIGN_USER_ID,
      authServer: env.DOCUSIGN_AUTH_SERVER,
      apiBase: env.DOCUSIGN_API_BASE,
      scopes: env.DOCUSIGN_SCOPES.split(' '),
      privateKeyPath: env.DOCUSIGN_PRIVATE_KEY_PATH,
      tokenExpiration: parseInt(env.DOCUSIGN_TOKEN_EXPIRATION, 10),
      clientSecret: env.DOCUSIGN_CLIENT_SECRET,
      redirectUri: env.DOCUSIGN_REDIRECT_URI,
      accountId: env.DOCUSIGN_ACCOUNT_ID,
    },
  };
};
