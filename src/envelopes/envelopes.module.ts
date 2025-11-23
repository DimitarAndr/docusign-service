import { Module } from '@nestjs/common';
import { EnvelopesController } from './envelopes.controller';
import { EnvelopesService } from './envelopes.service';
import { DocusignModule } from '../docusign/docusign.module';

@Module({
  imports: [DocusignModule],
  controllers: [EnvelopesController],
  providers: [EnvelopesService],
})
export class EnvelopesModule {}
