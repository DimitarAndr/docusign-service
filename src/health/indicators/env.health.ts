import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvHealthIndicator {
  private readonly requiredEnvVars = [
    'DATABASE_URL',
    'DOCUSIGN_INTEGRATION_KEY',
    'DOCUSIGN_USER_ID',
    'DOCUSIGN_ACCOUNT_ID',
    'DOCUSIGN_PRIVATE_KEY_PATH',
  ];

  constructor(private readonly configService: ConfigService) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const missing: string[] = [];

    for (const envVar of this.requiredEnvVars) {
      const value = process.env[envVar];
      if (!value || value.trim() === '') {
        missing.push(envVar);
      }
    }

    if (missing.length > 0) {
      throw new HealthCheckError(
        'Environment variables check failed',
        { [key]: { status: 'down', missing } },
      );
    }

    return { [key]: { status: 'up', message: 'All required env vars present' } };
  }
}
