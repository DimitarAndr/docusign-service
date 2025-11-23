import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { DocusignAuthService } from '../../src/docusign/docusign-auth.service';
import { DocusignConfig } from '../../src/auth/auth.types';

describe('DocusignAuthService', () => {
  const docusignConfig: DocusignConfig = {
    integrationKey: 'integration-key',
    userId: 'user-id',
    authServer: 'https://account-d.docusign.com',
    apiBase: 'https://demo.docusign.net/restapi',
    scopes: ['signature', 'impersonation'],
    privateKeyPath: './keys/private.pem',
    tokenExpiration: 3600,
    clientSecret: 'client-secret',
    redirectUri: 'http://localhost:3000/auth/docusign/callback',
    accountId: 'account-123',
  };

  let service: DocusignAuthService;
  let postMock: jest.Mock;

  beforeEach(() => {
    postMock = jest.fn().mockResolvedValue({
      data: { access_token: 'token', expires_in: 3600 },
    });

    const configService = {
      get: jest.fn().mockReturnValue(docusignConfig),
    } as unknown as ConfigService;

    const httpService = {
      axiosRef: { post: postMock },
    } as unknown as HttpService;

    const authService = {
      saveTokenFromCallback: jest.fn(),
    } as any;

    service = new DocusignAuthService(configService, httpService, authService);
  });

  it('builds consent url', () => {
    const url = service.buildConsentUrl();
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=integration-key');
    expect(url).toContain(encodeURIComponent(docusignConfig.redirectUri));
  });

  it('exchanges code for token', async () => {
    await service.exchangeAuthorizationCode('auth-code');

    expect(postMock).toHaveBeenCalledTimes(1);
    const [url, body, options] = postMock.mock.calls[0];
    expect(url).toBe(`${docusignConfig.authServer}/oauth/token`);

    const params = new URLSearchParams(body as string);
    expect(params.get('grant_type')).toBe('authorization_code');
    expect(params.get('code')).toBe('auth-code');
    expect(params.get('redirect_uri')).toBe(docusignConfig.redirectUri);
    expect(options.headers.Authorization).toContain('Basic');
  });
});
