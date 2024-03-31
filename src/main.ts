import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AuthMsLogger } from './common/logger.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('AuthMicroservice');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL],
        queue: 'auth_microservice',
        queueOptions: {
          durable: true,
        },
      },
    },
  );

  app.useGlobalInterceptors(new AuthMsLogger());

  // await app.listen(3000);
  // .finally(() =>
  //   logger.log(`Auth Microservice: EventBus:${process.env.RABBITMQ_URL}`),
  logger.log(`Auth Microservice: EventBus:${process.env.RABBITMQ_URL}`);
  // );
}
bootstrap();
