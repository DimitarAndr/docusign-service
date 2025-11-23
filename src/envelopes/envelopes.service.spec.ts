import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EnvelopesService } from './envelopes.service';
import { DocusignService } from '../docusign/docusign.service';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('EnvelopesService', () => {
  let service: EnvelopesService;
  let docusignService: jest.Mocked<DocusignService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvelopesService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-account-id'),
          },
        },
        {
          provide: DocusignService,
          useValue: {
            request: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnvelopesService>(EnvelopesService);
    docusignService = module.get(DocusignService) as jest.Mocked<DocusignService>;
  });

  describe('sendEnvelope', () => {
    it('should throw NotFoundException for invalid documentId', async () => {
      const dto = {
        documentId: 'invalid-doc',
        recipient: { name: 'John Doe', email: 'john@example.com' },
        subject: 'Test',
        message: 'Test message',
      };

      await expect(service.sendEnvelope(dto)).rejects.toThrow(NotFoundException);
    });

    it('should send envelope successfully', async () => {
      docusignService.request.mockResolvedValue({
        envelopeId: 'env-123',
        status: 'sent',
      });

      const dto = {
        documentId: 'sample-nda',
        recipient: { name: 'John Doe', email: 'john@example.com' },
        subject: 'Please sign',
        message: 'Thank you',
      };

      const result = await service.sendEnvelope(dto);
      expect(result.envelopeId).toBe('env-123');
      expect(result.status).toBe('sent');
      expect(docusignService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: '/v2.1/accounts/test-account-id/envelopes',
        }),
      );
    });
  });
});
