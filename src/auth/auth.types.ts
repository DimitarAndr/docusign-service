export interface DocusignConfig {
  integrationKey: string;
  userId: string;
  authServer: string;
  apiBase: string;
  scopes: string[];
  privateKeyPath: string;
  tokenExpiration: number;
  clientSecret?: string;
  redirectUri?: string;
  accountId: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}
