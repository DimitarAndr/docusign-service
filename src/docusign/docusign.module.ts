import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DOCUSIGN_HTTP_CLIENT } from './docusign.constants';
import { createDocusignHttpClient } from './docusign.provider';
import { DocusignService } from './docusign.service';
import { DocusignController } from './docusign.controller';

@Module({
  imports: [ConfigModule, AuthModule, HttpModule, PrismaModule],
  providers: [
    {
      provide: DOCUSIGN_HTTP_CLIENT,
      useFactory: createDocusignHttpClient,
      inject: [AuthService, ConfigService],
    },
    DocusignService,
  ],
  controllers: [DocusignController],
  exports: [DocusignService],
})
export class DocusignModule {}
