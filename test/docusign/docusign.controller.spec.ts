import { BadRequestException } from '@nestjs/common';
import { DocusignController } from '../../src/docusign/docusign.controller';
import { AuthConsentService } from '../../src/auth/auth-consent.service';

describe('DocusignController', () => {
  let controller: DocusignController;
  let authService: AuthConsentService;
  let exchangeMock: jest.Mock;

  beforeEach(() => {
    exchangeMock = jest.fn().mockResolvedValue(undefined);
    authService = {
      exchangeAuthorizationCode: exchangeMock,
      buildConsentUrl: jest.fn().mockReturnValue('https://example.com'),
    } as unknown as AuthConsentService;

    controller = new DocusignController(authService);
  });

  it('exchanges authorization code for tokens', async () => {
    const result = await controller.handleCallback('auth-code');

    expect(exchangeMock).toHaveBeenCalledTimes(1);
    expect(exchangeMock).toHaveBeenCalledWith('auth-code');
    expect(result.message).toBeDefined();
  });

  it('exchanges via /auth/docusign/token with code', async () => {
    const result = await controller.exchangeCode('auth-code');

    expect(exchangeMock).toHaveBeenCalledTimes(1);
    expect(exchangeMock).toHaveBeenCalledWith('auth-code');
    expect(result.message).toBeDefined();
  });

  it('rejects when code is missing', async () => {
    await expect(controller.handleCallback(undefined as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns consent url', () => {
    const result = controller.authorize('false');
    expect((result as any).url).toBeDefined();
  });
});
