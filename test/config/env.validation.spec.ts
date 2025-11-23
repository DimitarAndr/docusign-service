import configuration from '../../src/config/configuration';
import { envSchema } from '../../src/config/env.validation';

const baseEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/docusign?schema=public',
  DOCUSIGN_INTEGRATION_KEY: 'integration-key',
  DOCUSIGN_USER_ID: 'user-id',
  DOCUSIGN_PRIVATE_KEY_PATH: './keys/private.pem',
  DOCUSIGN_ACCOUNT_ID: 'account-id',
};

const withEnv = (env: Record<string, string>, fn: () => void) => {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env };
  try {
    fn();
  } finally {
    process.env = originalEnv;
  }
};

describe('envSchema', () => {
  it('parses required fields and applies defaults', () => {
    const result = envSchema.parse(baseEnv);

    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe('3000');
    expect(result.DOCUSIGN_AUTH_SERVER).toBe('https://account-d.docusign.com');
    expect(result.DOCUSIGN_API_BASE).toBe('https://demo.docusign.net/restapi');
    expect(result.DOCUSIGN_SCOPES).toBe('signature impersonation');
    expect(result.DOCUSIGN_TOKEN_EXPIRATION).toBe('3600');
    expect(result.DOCUSIGN_REDIRECT_URI).toBe('http://localhost:3000/auth/docusign/callback');
  });

  it('throws when a required variable is missing', () => {
    const { DOCUSIGN_INTEGRATION_KEY: _ignored, ...missingKeyEnv } = baseEnv;
    void _ignored;

    expect(() => envSchema.parse(missingKeyEnv)).toThrow();
  });
});

describe('configuration', () => {
  it('maps environment values into typed config', () => {
    const env = {
      ...baseEnv,
      NODE_ENV: 'production',
      PORT: '4001',
      DOCUSIGN_AUTH_SERVER: 'https://account.docusign.com',
      DOCUSIGN_API_BASE: 'https://api.docusign.net/restapi',
      DOCUSIGN_CLIENT_SECRET: 'client-secret',
      DOCUSIGN_REDIRECT_URI: 'http://localhost:3000/auth/docusign/callback',
      DOCUSIGN_SCOPES: 'signature impersonation extended',
      DOCUSIGN_TOKEN_EXPIRATION: '7200',
      DOCUSIGN_ACCOUNT_ID: 'account-123',
    };

    withEnv(env, () => {
      const config = configuration();

      expect(config.port).toBe(4001);
      expect(config.database.url).toBe(env.DATABASE_URL);
      expect(config.docusign.integrationKey).toBe(env.DOCUSIGN_INTEGRATION_KEY);
      expect(config.docusign.userId).toBe(env.DOCUSIGN_USER_ID);
      expect(config.docusign.authServer).toBe(env.DOCUSIGN_AUTH_SERVER);
      expect(config.docusign.apiBase).toBe(env.DOCUSIGN_API_BASE);
      expect(config.docusign.clientSecret).toBe(env.DOCUSIGN_CLIENT_SECRET);
      expect(config.docusign.redirectUri).toBe(env.DOCUSIGN_REDIRECT_URI);
      expect(config.docusign.scopes).toEqual(['signature', 'impersonation', 'extended']);
      expect(config.docusign.privateKeyPath).toBe(env.DOCUSIGN_PRIVATE_KEY_PATH);
      expect(config.docusign.tokenExpiration).toBe(7200);
    });
  });
});
