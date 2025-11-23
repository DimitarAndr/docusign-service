import { ConfigService } from '@nestjs/config';
import { AxiosRequestConfig } from 'axios';
import { AuthService } from '../../src/auth/auth.service';
import { createDocusignHttpClient } from '../../src/docusign/docusign.provider';

describe('createDocusignHttpClient', () => {
  it('attaches bearer token via interceptor', async () => {
    const authService = {
      getAccessToken: jest.fn().mockResolvedValue('docusign-token'),
    } as unknown as AuthService;

    const configService = {
      get: jest.fn().mockReturnValue('https://demo.docusign.net/restapi'),
    } as unknown as ConfigService;

    const client = await createDocusignHttpClient(authService, configService);

    const adapter = jest.fn().mockImplementation((config: AxiosRequestConfig) =>
      Promise.resolve({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    );

    await client.get('/accounts', { adapter });

    expect(adapter).toHaveBeenCalledTimes(1);
    const calledConfig = adapter.mock.calls[0][0] as AxiosRequestConfig;
    expect(calledConfig.headers?.Authorization).toBe('Bearer docusign-token');
    expect(calledConfig.baseURL).toBe('https://demo.docusign.net/restapi');
    expect(authService.getAccessToken).toHaveBeenCalled();
  });
});
