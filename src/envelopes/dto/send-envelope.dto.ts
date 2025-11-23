import { ApiProperty } from '@nestjs/swagger';

class RecipientDto {
  @ApiProperty({ example: 'Jane Doe' })
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiProperty({
    required: false,
    description: 'Provide clientUserId to enable embedded signing for this recipient.',
    example: 'internal-recipient-id',
  })
  clientUserId?: string;
}

export class SendEnvelopeDto {
  @ApiProperty({
    description: 'Identifier of the predefined document stored server-side (e.g., NDA template id).',
    example: 'sample-nda',
  })
  documentId!: string;

  @ApiProperty({ type: RecipientDto })
  recipient!: RecipientDto;

  @ApiProperty({ example: 'Please sign the NDA', required: false })
  subject?: string;

  @ApiProperty({ example: 'Hi, please sign this when you can.', required: false })
  message?: string;
}
