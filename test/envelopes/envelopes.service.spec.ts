import { ConfigService } from '@nestjs/config';
import { EnvelopesService } from '../../src/envelopes/envelopes.service';
import { DocusignService } from '../../src/docusign/docusign.service';
import { SendEnvelopeDto } from '../../src/envelopes/dto/send-envelope.dto';
import { PrismaService } from '../../src/prisma/prisma.service';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from('sample document')),
  },
}));

describe('EnvelopesService', () => {
  let service: EnvelopesService;
  let requestMock: jest.Mock;
  let prismaCreateMock: jest.Mock;

  beforeEach(() => {
    requestMock = jest.fn().mockResolvedValue({
      envelopeId: 'env-123',
      status: 'sent',
    });

    prismaCreateMock = jest.fn().mockResolvedValue({ id: 1 });

    const docusignService = {
      request: requestMock,
    } as unknown as DocusignService;

    const configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'docusign.accountId') return 'account-123';
        return undefined;
      }),
    } as unknown as ConfigService;

    const prismaService = {
      sentEnvelope: {
        create: prismaCreateMock,
      },
    } as unknown as PrismaService;

    service = new EnvelopesService(docusignService, configService, prismaService);
  });

  it('sends an envelope via DocuSign API', async () => {
    const dto: SendEnvelopeDto = {
      documentId: 'sample-nda',
      recipient: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      subject: 'Please sign',
      message: 'Thanks!',
    };

    const result = await service.sendEnvelope(dto);

    expect(requestMock).toHaveBeenCalledTimes(1);
    const [config] = requestMock.mock.calls[0];
    expect(config.url).toContain('/v2.1/accounts/account-123/envelopes');

    expect(result.envelopeId).toBe('env-123');
    expect(result.recipient).toBe(dto.recipient.email);
    expect(prismaCreateMock).toHaveBeenCalled();
  });
});
