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
   * clears the cached token via the auth interceptor (by evicting headers)
   * and retries once. If the second attempt fails, the error is bubbled up.
   */
  async request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    try {
      const { data } = await this.http.request<T>(config);
      return data;
    } catch (error: any) {
      const status = error?.response?.status;
      const errData = error?.response?.data;
      const isInvalidToken =
        status === 401 ||
        (typeof errData === 'object' && errData?.error === 'invalid_token');

      if (!isInvalidToken) {
        throw error;
      }

      // Clear cached auth header to force interceptor to fetch a new token.
      delete this.http.defaults.headers.common?.Authorization;

      try {
        const { data } = await this.http.request<T>(config);
        return data;
      } catch (retryError) {
        throw retryError instanceof Error
          ? retryError
          : new InternalServerErrorException('DocuSign request failed after retry');
      }
    }
  }
}
