import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AuthMsLogger } from './common/logger.interceptor';
import * as http from 'http';

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

  // /* This is because Render requires http port binding for deployment */
  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.end('This is a placeholder HTTP response');
  });

  server.listen(5001);

  await app
    .listen()
    .finally(() =>
      logger.log(`Auth Microservice: EventBus:${process.env.RABBITMQ_URL}`),
    );
}
bootstrap();
