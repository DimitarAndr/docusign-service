import { BadRequestException, Controller, Get, Query, Header } from '@nestjs/common';
import { ApiExcludeController, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthConsentService } from '../auth/auth-consent.service';

@ApiExcludeController()
@Controller('auth/docusign')
export class DocusignController {
  constructor(
    private readonly authConsentService: AuthConsentService,
  ) {}

  @Get('authorize')
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/html')
  authorize(@Query('redirect') redirect?: string) {
    const url = this.authConsentService.buildConsentUrl();
    if (redirect === 'false') {
      return { url };
    }
    return `<html><body>Redirecting to DocuSign...<script>window.location.href='${url}'</script></body></html>`;
  }

  @Get('callback')
  @ApiExcludeEndpoint()
  async handleCallback(
    @Query('code') code?: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      throw new BadRequestException(`DocuSign returned error: ${error}`);
    }
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }

    await this.authConsentService.exchangeAuthorizationCode(code);
    return {
      message: 'Token saved successfully. You can now use the API.',
    };
  }

  @Get('token')
  @ApiExcludeEndpoint()
  async exchangeCode(@Query('code') code?: string) {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }
    await this.authConsentService.exchangeAuthorizationCode(code);
    return {
      message: 'Token saved successfully. You can now use the API.',
    };
  }
}
