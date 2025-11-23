import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('token')
  @ApiExcludeEndpoint()
  async getToken() {
    try {
      const accessToken = await this.authService.getAccessToken();
      return { accessToken };
    } catch (error) {
      throw error;
    }
  }
}
