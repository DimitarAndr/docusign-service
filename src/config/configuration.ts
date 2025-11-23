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
      scopes: env.DOCUSIGN_SCOPES.split(' '),
      privateKeyPath: env.DOCUSIGN_PRIVATE_KEY_PATH,
      tokenExpiration: parseInt(env.DOCUSIGN_TOKEN_EXPIRATION, 10),
    },
  };
};
