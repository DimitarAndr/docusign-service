import { Module } from '@nestjs/common';
import { EnvelopesController } from './envelopes.controller';
import { EnvelopesService } from './envelopes.service';
import { DocusignModule } from '../docusign/docusign.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EnvelopesPoller } from './envelopes.poller';

@Module({
  imports: [DocusignModule, PrismaModule],
  controllers: [EnvelopesController],
  providers: [EnvelopesService, EnvelopesPoller],
})
export class EnvelopesModule {}
