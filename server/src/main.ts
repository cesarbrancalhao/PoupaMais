import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const requiredEnvs = ['JWT_SECRET', 'DB_HOST', 'DB_PASSWORD'];
  requiredEnvs.forEach(variable => {
    if (!process.env[variable]) {
      throw new Error(`Variável de ambiente ${variable} não definida`);
    }
  });

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('PoupaMais API')
    .setDescription('API de Gerenciamento de Finanças Pessoais')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  
  try {
    await app.listen(port);
    logger.log(`Aplicação rodando em: http://localhost:${port}`);
    logger.log(`Documentação Swagger disponível em: http://localhost:${port}/api/docs`);
  } catch (error) {
    logger.error('Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
}
bootstrap();
