import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class DocusignHealthIndicator {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const authServer = this.configService.get<string>('docusign.authServer');
    
    try {
      await firstValueFrom(
        this.httpService.get(`${authServer}/.well-known/openid-configuration`).pipe(
          timeout(3000),
        ),
      );
      
      return { [key]: { status: 'up', message: 'DocuSign API is reachable' } };
    } catch (error) {
      throw new HealthCheckError(
        'DocuSign API check failed',
        { [key]: { status: 'down', message: 'Cannot reach DocuSign API' } },
      );
    }
  }
}
