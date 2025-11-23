import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DocusignService } from '../docusign/docusign.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EnvelopesPoller {
  private readonly logger = new Logger(EnvelopesPoller.name);
  private readonly terminalStatuses = new Set(['completed', 'declined', 'voided']);

  constructor(
    private readonly prisma: PrismaService,
    private readonly docusignService: DocusignService,
    private readonly configService: ConfigService,
  ) {}

   @Cron(CronExpression.EVERY_30_MINUTES)
  async pollEnvelopes() {
    const accountId = this.configService.get<string>('docusign.accountId');
    if (!accountId) {
      this.logger.warn('DocuSign accountId not configured, skipping polling');
      return;
    }

    const pending = await this.prisma.sentEnvelope.findMany({
      where: {
        status: { notIn: Array.from(this.terminalStatuses) },
      },
      orderBy: { lastStatusCheckAt: 'asc' },
      take: 50,
    });

    if (pending.length === 0) {
      this.logger.debug('Poll tick: no pending envelopes');
      return;
    }

    this.logger.log(`Polling ${pending.length} envelopes for status updates`);

    for (const envelope of pending) {
      try {
        const data = await this.docusignService.request<{ status?: string }>({
          method: 'get',
          url: `/v2.1/accounts/${accountId}/envelopes/${envelope.envelopeId}`,
        });

        const apiStatus = typeof data.status === 'string' ? data.status.toLowerCase() : envelope.status;
        const statusChanged = apiStatus !== envelope.status;

        await this.prisma.sentEnvelope.update({
          where: { id: envelope.id },
          data: {
            status: apiStatus,
            lastStatus: statusChanged ? envelope.status : envelope.lastStatus,
            lastStatusCheckAt: new Date(),
            errorMessage: null,
            rawResponse: data as Prisma.InputJsonValue,
          },
        });
      } catch (err: any) {
        const message = err?.response?.data ? JSON.stringify(err.response.data) : err?.message;
        this.logger.warn(`Failed to poll envelope ${envelope.envelopeId}: ${message}`);
        await this.prisma.sentEnvelope.update({
          where: { id: envelope.id },
          data: {
            lastStatusCheckAt: new Date(),
            errorMessage: message,
          },
        });
      }
    }
  }
}
