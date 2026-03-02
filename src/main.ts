import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Meeting Service API')
    .setDescription(
      'REST API for managing meetings in a microservices architecture. ' +
      'Create meetings, add participants and organizers, manage agenda items, meeting minutes, and action items. ' +
      'All endpoints (except Swagger UI) require the **x-secret-key** header for authentication via Auth Service.',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-secret-key',
        in: 'header',
        description: 'Secret key for authentication. Obtain from Auth Service. Required for all /meetings endpoints.',
      },
      'x-secret-key',
    )
    .addTag('meetings', 'Create, read, update, and manage meetings. Organizers can update/cancel; participants can respond to invitations.')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Meeting Service is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();
