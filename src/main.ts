import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  setupSwagger(app);
  await app.listen(process.env.PORT || 3000);
}

bootstrap().catch((error: unknown) => {
  const errorMessage = error instanceof Error 
    ? error.message.replace(/[\r\n\t]/g, ' ').substring(0, 200)
    : 'Unknown error';
  console.error('Failed to start application:', errorMessage);
  process.exit(1);
});
