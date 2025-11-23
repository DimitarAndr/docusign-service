import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  
  // DocuSign JWT Config
  DOCUSIGN_INTEGRATION_KEY: z.string(),
  DOCUSIGN_USER_ID: z.string(),
  DOCUSIGN_AUTH_SERVER: z.string().default('https://account-d.docusign.com'),
  DOCUSIGN_API_BASE: z.string().default('https://demo.docusign.net/restapi'),
  DOCUSIGN_SCOPES: z.string().default('signature impersonation'),
  DOCUSIGN_PRIVATE_KEY_PATH: z.string(),
  DOCUSIGN_TOKEN_EXPIRATION: z.string().default('3600'),
  DOCUSIGN_CLIENT_SECRET: z.string().optional(),
  DOCUSIGN_REDIRECT_URI: z.string().default('http://localhost:3000/auth/docusign/callback'),
  DOCUSIGN_ACCOUNT_ID: z.string().nonempty(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  return envSchema.parse(process.env);
}
