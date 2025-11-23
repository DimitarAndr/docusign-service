import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EnvHealthIndicator } from './env.health';
import { HealthCheckError } from '@nestjs/terminus';

describe('EnvHealthIndicator', () => {
  let indicator: EnvHealthIndicator;
  let configService: jest.Mocked<ConfigService>;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvHealthIndicator,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    indicator = module.get<EnvHealthIndicator>(EnvHealthIndicator);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should return up status when all env vars are present', async () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    process.env.DOCUSIGN_INTEGRATION_KEY = 'integration-key';
    process.env.DOCUSIGN_USER_ID = 'user-id';
    process.env.DOCUSIGN_ACCOUNT_ID = 'account-id';
    process.env.DOCUSIGN_PRIVATE_KEY_PATH = './keys/private.pem';

    const result = await indicator.isHealthy('environment');
    expect(result).toEqual({
      environment: { status: 'up', message: 'All required env vars present' },
    });
  });

  it('should throw HealthCheckError when env vars are missing', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(indicator.isHealthy('environment')).rejects.toThrow(HealthCheckError);
  });
});
