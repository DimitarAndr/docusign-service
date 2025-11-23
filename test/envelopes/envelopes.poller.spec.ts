import { ConfigService } from '@nestjs/config';
import { EnvelopesPoller } from '../../src/envelopes/envelopes.poller';
import { PrismaService } from '../../src/prisma/prisma.service';
import { DocusignService } from '../../src/docusign/docusign.service';

describe('EnvelopesPoller', () => {
  let poller: EnvelopesPoller;
  let prisma: {
    sentEnvelope: {
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let docusignService: { request: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    prisma = {
      sentEnvelope: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    docusignService = { request: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('account-123') };

    poller = new EnvelopesPoller(
      prisma as unknown as PrismaService,
      docusignService as unknown as DocusignService,
      configService as unknown as ConfigService,
    );
  });

  it('skips when no account id', async () => {
    configService.get.mockReturnValue(undefined);
    await poller.pollEnvelopes();

    expect(prisma.sentEnvelope.findMany).not.toHaveBeenCalled();
  });

  it('updates envelope status when changed', async () => {
    prisma.sentEnvelope.findMany.mockResolvedValue([
      {
        id: 1,
        envelopeId: 'env-123',
        status: 'sent',
        lastStatus: null,
      },
    ]);
    docusignService.request.mockResolvedValue({ status: 'completed' });

    await poller.pollEnvelopes();

    expect(prisma.sentEnvelope.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        status: 'completed',
        lastStatus: 'sent',
        errorMessage: null,
      }),
    });
  });
});
