import { AuthService } from '../../src/auth/auth.service';
import { DocusignConfig } from '../../src/auth/auth.types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { readFile } from 'fs/promises';
import * as jwt from 'jsonwebtoken';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('AuthService', () => {
  const docusignConfig: DocusignConfig = {
    integrationKey: 'integration-key',
    userId: 'user-id',
    authServer: 'https://account-d.docusign.com',
    apiBase: 'https://demo.docusign.net/restapi',
    scopes: ['signature', 'impersonation'],
    privateKeyPath: './keys/private.pem',
    tokenExpiration: 3600,
    accountId: 'account-123',
  };

  let configService: ConfigService;
  let httpService: HttpService;
  let postMock: jest.Mock;

  beforeEach(() => {
    (readFile as jest.Mock).mockResolvedValue('private-key');
    (jwt.sign as jest.Mock).mockReturnValue('jwt-assertion');
    postMock = jest.fn().mockResolvedValue({
      data: { access_token: 'new-token', expires_in: 3600 },
    });
    configService = {
      get: jest.fn().mockReturnValue(docusignConfig),
    } as unknown as ConfigService;
    httpService = {
      axiosRef: { post: postMock },
    } as unknown as HttpService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached token when cache is still valid', async () => {
    const prismaService = {
      docusignToken: {
        findFirst: jest.fn().mockResolvedValue({
          accessToken: 'cached-token',
          expiresAt: new Date(Date.now() + 120_000),
        }),
        create: jest.fn(),
      },
    } as any;
    const service = new AuthService(configService, httpService, prismaService);

    const token = await service.getAccessToken();

    expect(token).toBe('cached-token');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('fetches a new token when cache is expired', async () => {
    const prismaService = {
      docusignToken: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    } as any;
    const service = new AuthService(configService, httpService, prismaService);

    const token = await service.getAccessToken();

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        iss: docusignConfig.integrationKey,
        sub: docusignConfig.userId,
        aud: docusignConfig.authServer,
      }),
      'private-key',
      expect.objectContaining({ algorithm: 'RS256' }),
    );

    expect(postMock).toHaveBeenCalledTimes(1);
    const [url, body] = postMock.mock.calls[0];
    expect(url).toBe(`${docusignConfig.authServer}/oauth/token`);
    const params = new URLSearchParams(body as string);
    expect(params.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    expect(params.get('assertion')).toBe('jwt-assertion');

    expect(token).toBe('new-token');
  });
});
