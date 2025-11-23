import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { DocusignHealthIndicator } from './docusign.health';
import { HealthCheckError } from '@nestjs/terminus';
import { of, throwError } from 'rxjs';

describe('DocusignHealthIndicator', () => {
  let indicator: DocusignHealthIndicator;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocusignHealthIndicator,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('https://account-d.docusign.com'),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    indicator = module.get<DocusignHealthIndicator>(DocusignHealthIndicator);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
  });

  it('should return up status when DocuSign API is reachable', async () => {
    httpService.get.mockReturnValue(of({ data: {}, status: 200 } as any));

    const result = await indicator.isHealthy('docusign');
    expect(result).toEqual({
      docusign: { status: 'up', message: 'DocuSign API is reachable' },
    });
  });

  it('should throw HealthCheckError when DocuSign API is unreachable', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('Network error')));

    await expect(indicator.isHealthy('docusign')).rejects.toThrow(HealthCheckError);
  });
});
