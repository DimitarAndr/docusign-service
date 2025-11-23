import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EnvelopesService } from './envelopes.service';
import { SendEnvelopeDto } from './dto/send-envelope.dto';

@ApiTags('Envelopes')
@Controller('envelopes')
export class EnvelopesController {
  constructor(private readonly envelopesService: EnvelopesService) {}

  @Post()
  @ApiOperation({ summary: 'Send an envelope with a predefined document to a recipient' })
  @ApiResponse({
    status: 200,
    description: 'Envelope created and sent (stubbed until DocuSign integration is wired).',
    schema: {
      example: {
        envelopeId: '8c9641f8-5e40-4f5b-b8aa-7a3ab2a0b7ef',
        status: 'created',
        recipient: 'jane@example.com',
        documentId: 'sample-nda',
      },
    },
  })
  async sendEnvelope(@Body() body: SendEnvelopeDto) {
    return this.envelopesService.sendEnvelope(body);
  }
}
