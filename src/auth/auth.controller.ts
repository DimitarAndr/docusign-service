import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('token')
  @ApiOperation({
    summary: 'Fetch DocuSign access token (JWT grant)',
    description: 'Dev/ops helper endpoint. Do not expose publicly in production.',
  })
  @ApiOkResponse({
    description: 'Returns a DocuSign access token from JWT grant',
    schema: { example: { accessToken: 'eyJhbGciOi...' } },
  })
  async getToken() {
    const accessToken = await this.authService.getAccessToken();
    return { accessToken };
  }
}
