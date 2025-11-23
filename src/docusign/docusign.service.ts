import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { DOCUSIGN_HTTP_CLIENT } from './docusign.constants';

@Injectable()
export class DocusignService {
  constructor(
    @Inject(DOCUSIGN_HTTP_CLIENT)
    private readonly http: AxiosInstance,
  ) {}

  /**
   * Performs a DocuSign API request. If a 401/invalid_token is returned,
   * retries once with a fresh token. Uses request-level config to avoid
   * race conditions with concurrent requests.
   */
  async request<T = unknown>(config: AxiosRequestConfig, isRetry = false): Promise<T> {
    try {
      const { data } = await this.http.request<T>(config);
      return data;
    } catch (error: unknown) {
      const status = (error as any)?.response?.status;
      const errData = (error as any)?.response?.data;
      const isInvalidToken =
        status === 401 ||
        (typeof errData === 'object' && errData?.error === 'invalid_token');

      if (!isInvalidToken || isRetry) {
        if (error instanceof Error) {
          throw error;
        }
        throw new InternalServerErrorException('DocuSign request failed');
      }

      // Retry with fresh token by removing Authorization header
      const retryConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: undefined,
        },
      };
      return this.request<T>(retryConfig, true);
    }
  }
}
