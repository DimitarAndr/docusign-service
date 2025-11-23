import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DocusignHealthIndicator } from './indicators/docusign.health';
import { EnvHealthIndicator } from './indicators/env.health';

@Module({
  imports: [TerminusModule, HttpModule, PrismaModule],
  controllers: [HealthController],
  providers: [DocusignHealthIndicator, EnvHealthIndicator],
})
export class HealthModule {}
