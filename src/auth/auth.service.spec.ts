import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('private-key'),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('jwt-assertion'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { docusignToken: { findFirst: jest.Mock; create: jest.Mock } };
  let httpService: { axiosRef: { post: jest.Mock } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({
              integrationKey: 'test-key',
              userId: 'test-user',
              accountId: 'test-account',
              authServer: 'https://account-d.docusign.com',
              apiBase: 'https://demo.docusign.net/restapi',
              scopes: ['signature', 'impersonation'],
              privateKeyPath: './test-key.pem',
              clientSecret: 'test-secret',
              tokenExpiration: 3600,
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              post: jest.fn(),
            },
          },
        },
        {
          provide: PrismaService,
          useValue: {
            docusignToken: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as any;
    httpService = module.get(HttpService) as any;
  });

  describe('getAccessToken', () => {
    it('should return cached token if valid', async () => {
      const futureDate = new Date(Date.now() + 120_000);
      prisma.docusignToken.findFirst.mockResolvedValue({
        id: 1,
        accessToken: 'cached-token',
        refreshToken: 'refresh-token',
        expiresAt: futureDate,
        createdAt: new Date(),
      });

      const token = await service.getAccessToken();
      expect(token).toBe('cached-token');
      expect(httpService.axiosRef.post).not.toHaveBeenCalled();
    });

    it('should fetch new token if no cached token exists', async () => {
      prisma.docusignToken.findFirst.mockResolvedValue(null);
      httpService.axiosRef.post.mockResolvedValue({
        data: {
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        },
      });

      const token = await service.getAccessToken();
      expect(token).toBe('new-token');
      expect(prisma.docusignToken.create).toHaveBeenCalled();
    });

    it('should throw error if token fetch fails', async () => {
      prisma.docusignToken.findFirst.mockResolvedValue(null);
      httpService.axiosRef.post.mockRejectedValue(new Error('Network error'));

      await expect(service.getAccessToken()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('saveTokenFromCallback', () => {
    it('should save token to database', async () => {
      const tokenResponse = {
        access_token: 'callback-token',
        refresh_token: 'callback-refresh',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      await service.saveTokenFromCallback(tokenResponse);
      expect(prisma.docusignToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accessToken: 'callback-token',
          refreshToken: 'callback-refresh',
        }),
      });
    });
  });
});
