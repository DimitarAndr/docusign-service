import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthConsentService } from './auth-consent.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, HttpModule, PrismaModule],
  providers: [AuthService, AuthConsentService],
  controllers: [AuthController],
  exports: [AuthService, AuthConsentService],
})
export class AuthModule {}
