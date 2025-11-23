import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { ConfigService } from '@nestjs/config';
import { SendEnvelopeDto } from './dto/send-envelope.dto';
import { DocusignService } from '../docusign/docusign.service';

@Injectable()
export class EnvelopesService {
  private readonly logger = new Logger(EnvelopesService.name);
  private readonly documentMap: Record<string, string> = {
    'sample-nda': join(process.cwd(), 'documents', 'sample-nda.html'),
  };

  constructor(
    private readonly docusignService: DocusignService,
    private readonly configService: ConfigService,
  ) {}

  async sendEnvelope(dto: SendEnvelopeDto) {
    const accountId = this.configService.get<string>('docusign.accountId');
    if (!accountId) {
      throw new InternalServerErrorException('DocuSign accountId not configured');
    }

    const documentPath = this.documentMap[dto.documentId];
    if (!documentPath) {
      throw new NotFoundException(`Document not found for id: ${dto.documentId}`);
    }

    let document: Buffer;
    try {
      document = await fs.readFile(documentPath);
    } catch (error) {
      this.logger.error(`Failed to read document: ${dto.documentId}`);
      throw new InternalServerErrorException('Failed to read document file');
    }
    const documentBase64 = document.toString('base64');
    const fileExtension = extname(documentPath).replace('.', '') || 'html';
    const emailSubject = dto.subject || 'Please sign the document';

    this.logger.log(
      `Preparing envelope: account=${accountId}, document=${dto.documentId}, recipient=${dto.recipient.email}`,
    );

    const payload = {
      emailSubject,
      emailBlurb: dto.message || '',
      documents: [
        {
          documentBase64,
          name: dto.documentId,
          fileExtension,
          documentId: '1',
        },
      ],
      recipients: {
        signers: [
          {
            email: dto.recipient.email,
            name: dto.recipient.name,
            recipientId: '1',
            routingOrder: '1',
            ...(dto.recipient.clientUserId ? { clientUserId: dto.recipient.clientUserId } : {}),
          },
        ],
      },
      status: 'sent',
    };

    const result = await this.docusignService.request<{
      envelopeId: string;
      status: string;
    }>({
      method: 'post',
      url: `/v2.1/accounts/${accountId}/envelopes`,
      data: payload,
    });

    this.logger.log(`Envelope sent to ${dto.recipient.email}: ${result.envelopeId}`);

    try {
      return {
        envelopeId: result.envelopeId,
        status: result.status,
        recipient: dto.recipient.email,
        documentId: dto.documentId,
      };
    } catch (error) {
      throw error;
    }
  }
}
