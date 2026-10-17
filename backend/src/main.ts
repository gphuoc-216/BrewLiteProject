import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('BrewLiteBootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Cấu hình tiền tố toàn cục /api
  app.setGlobalPrefix('api');

  // 2. Cấu hình CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Validation Pipe toàn cục (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 4. Exception Filter & Response Interceptor toàn cục
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 5. Cấu hình Swagger OpenAPI tại /api/docs
  const config = new DocumentBuilder()
    .setTitle('BrewLite API Specification')
    .setDescription(
      'Tài liệu đặc tả toàn diện các REST API cho hệ thống đặt cà phê không tiền mặt BrewLite (Công nghệ Phần mềm - ĐH Sài Gòn)',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'BrewLite API Docs',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 BrewLite Backend API is running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger OpenAPI documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
