import { BadRequestException, Controller, Get, Query, Header } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthConsentService } from '../auth/auth-consent.service';

@ApiTags('Auth')
@Controller('auth/docusign')
export class DocusignController {
  constructor(
    private readonly authConsentService: AuthConsentService,
  ) {}

  @Get('authorize')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Get DocuSign consent URL (redirects by default)' })
  @ApiQuery({ name: 'redirect', required: false, description: 'Set to false to return JSON URL instead of redirecting' })
  @ApiOkResponse({ description: 'Redirects to DocuSign or returns { url } if redirect=false' })
  authorize(@Query('redirect') redirect?: string) {
    const url = this.authConsentService.buildConsentUrl();
    if (redirect === 'false') {
      return { url };
    }
    return `<html><body>Redirecting to DocuSign...<script>window.location.href='${url}'</script></body></html>`;
  }

  @Get('callback')
  @ApiOperation({ summary: 'DocuSign OAuth callback (authorization code grant)' })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'error', required: false })
  @ApiOkResponse({ description: 'Persists token and confirms readiness to use the API' })
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
  @ApiOperation({ summary: 'Manually exchange an authorization code for tokens' })
  @ApiQuery({ name: 'code', required: true })
  @ApiOkResponse({ description: 'Persists token and confirms readiness to use the API' })
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
