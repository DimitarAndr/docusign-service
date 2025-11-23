import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { DocusignConfig, TokenResponse } from './auth.types';
import { AuthService } from './auth.service';

/**
 * DocuSign OAuth Consent Service
 * 
 * Handles OAuth 2.0 Authorization Code flow for initial user consent.
 * This is required ONCE before JWT authentication can work.
 * 
 * Flow:
 * 1. User visits /auth/docusign/authorize
 * 2. Redirected to DocuSign login
 * 3. User grants consent
 * 4. DocuSign redirects back with auth code
 * 5. Exchange code for access + refresh tokens
 * 6. Save tokens to DB via AuthService
 * 
 * After consent, AuthService handles all subsequent authentication automatically.
 */
@Injectable()
export class AuthConsentService {
  private readonly logger = new Logger(AuthConsentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Build OAuth consent URL for user authorization
   */
  buildConsentUrl(): string {
    const config = this.getConfig();
    const params = new URLSearchParams({
      response_type: 'code',
      scope: config.scopes.join(' '),
      client_id: config.integrationKey,
      redirect_uri: config.redirectUri || '',
    });
    return `${config.authServer.replace(/\/+$/, '')}/oauth/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   * Saves tokens to DB for future use
   */
  async exchangeAuthorizationCode(code: string): Promise<void> {
    const config = this.getConfig(true);
    if (!config.redirectUri) {
      throw new InternalServerErrorException('DocuSign redirect URI not configured');
    }
    if (!config.clientSecret) {
      throw new BadRequestException('DOCUSIGN_CLIENT_SECRET is required for code exchange');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    });

    const tokenEndpoint = `${config.authServer.replace(/\/+$/, '')}/oauth/token`;
    const basicAuth = Buffer.from(`${config.integrationKey}:${config.clientSecret}`).toString(
      'base64',
    );

    const { data } = await this.httpService.axiosRef.post<TokenResponse>(
      tokenEndpoint,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
      },
    );

    this.logger.log('DocuSign tokens acquired, saving to database');
    await this.authService.saveTokenFromCallback(data);
  }

  private getConfig(requireSecret = false): DocusignConfig {
    const cfg = this.configService.get<DocusignConfig>('docusign');
    if (!cfg) {
      throw new InternalServerErrorException('DocuSign configuration not loaded');
    }
    if (requireSecret && !cfg.clientSecret) {
      throw new BadRequestException('DOCUSIGN_CLIENT_SECRET is required for code exchange');
    }
    return cfg;
  }
}
