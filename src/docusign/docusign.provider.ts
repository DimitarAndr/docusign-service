import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import axios, { AxiosInstance } from 'axios';

export async function createDocusignHttpClient(
  authService: AuthService,
  configService: ConfigService,
): Promise<AxiosInstance> {
  const baseURL =
    configService.get<string>('docusign.apiBase') || 'https://demo.docusign.net/restapi';

  const client = axios.create({
    baseURL,
    headers: {
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use(async (config) => {
    const token = await authService.getAccessToken();
    config.headers = (config.headers || {}) as any;
    (config.headers as Record<string, unknown>)['Authorization'] = `Bearer ${token}`;
    return config;
  });

  return client;
}
