import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import * as jwt from 'jsonwebtoken';
import { DocusignConfig, TokenResponse } from './auth.types';
import { PrismaService } from '../prisma/prisma.service';

/**
 * DocuSign JWT Authentication Service
 * 
 * Handles server-to-server authentication using JWT Bearer tokens.
 * Manages token lifecycle: retrieval, caching, refresh, and storage.
 * 
 * Flow:
 * 1. Check DB for valid cached token
 * 2. If expired, try refresh token
 * 3. If no refresh token, use JWT assertion
 * 4. Store new token in DB with TTL
 * 
 * Note: Requires initial user consent via AuthConsentService before JWT works.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly docusignConfig: DocusignConfig;
  private readonly privateKeyPromise: Promise<string>;
  private readonly expiryBufferMs = 60_000;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {
    try {
      const config = this.configService.get<DocusignConfig>('docusign');
      if (!config) {
        throw new InternalServerErrorException('DocuSign configuration not loaded');
      }
      this.docusignConfig = config;
      this.privateKeyPromise = readFile(this.docusignConfig.privateKeyPath, 'utf8');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get valid DocuSign access token
   * Returns cached token if valid, refreshes if expired, or fetches new via JWT
   */
  async getAccessToken(): Promise<string> {
    const token = await this.prisma.docusignToken.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        accessToken: true,
        refreshToken: true,
        expiresAt: true,
      },
    });

    const now = Date.now();
    if (token && token.expiresAt.getTime() - this.expiryBufferMs > now) {
      return token.accessToken;
    }

    if (token?.refreshToken) {
      try {
        return await this.refreshAccessToken(token.refreshToken);
      } catch (error) {
        this.logger.warn('Token refresh failed, fetching new token');
      }
    }

    return await this.fetchNewToken();
  }

  /**
   * Save token received from OAuth callback
   * Called by AuthConsentService after user grants consent
   */
  async saveTokenFromCallback(tokenResponse: TokenResponse): Promise<void> {
    const now = Date.now();
    const expiresAt = new Date(now + tokenResponse.expires_in * 1000);
    await this.prisma.docusignToken.create({
      data: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
      },
    });
    this.logger.log('Token saved to database');
  }

  private async refreshAccessToken(refreshToken: string): Promise<string> {
    this.logger.debug('Refreshing access token');
    const endpoint = this.buildTokenEndpoint();
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const basicAuth = Buffer.from(
      `${this.docusignConfig.integrationKey}:${this.docusignConfig.clientSecret}`,
    ).toString('base64');

    const { data } = await this.httpService.axiosRef.post<TokenResponse>(
      endpoint,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
      },
    );

    const now = Date.now();
    const expiresAt = new Date(now + data.expires_in * 1000);
    await this.prisma.docusignToken.create({
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt,
      },
    });

    return data.access_token;
  }

  private async fetchNewToken(): Promise<string> {
    const tokenResponse = await this.fetchAccessToken();
    const expiresAt = new Date(
      Date.now() + (tokenResponse.expires_in ?? this.docusignConfig.tokenExpiration) * 1000,
    );
    await this.prisma.docusignToken.create({
      data: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
      },
    });
    return tokenResponse.access_token;
  }

  private async fetchAccessToken(): Promise<TokenResponse> {
    this.logger.debug('Requesting DocuSign access token via JWT assertion');
    const jwtAssertion = await this.buildJwtAssertion();
    const endpoint = this.buildTokenEndpoint();
    const params = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtAssertion,
    });

    try {
      const { data } = await this.httpService.axiosRef.post<TokenResponse>(
        endpoint,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return data;
    } catch (error: any) {
      const resp = error?.response;
      const status = resp?.status;
      this.logger.error(
        `DocuSign token request failed${status ? ` (status ${status})` : ''}`,
      );
      throw new InternalServerErrorException('Failed to obtain DocuSign access token');
    }
  }

  private async buildJwtAssertion(): Promise<string> {
    const { integrationKey, userId, authServer, scopes, tokenExpiration } = this.docusignConfig;
    const now = Math.floor(Date.now() / 1000);
    const payload: jwt.JwtPayload = {
      iss: integrationKey,
      sub: userId,
      aud: authServer,
      scope: scopes.join(' '),
      iat: now,
      exp: now + tokenExpiration,
    };

    const privateKey = await this.privateKeyPromise;
    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  }

  private buildTokenEndpoint(): string {
    return `${this.docusignConfig.authServer.replace(/\/+$/, '')}/oauth/token`;
  }
}
