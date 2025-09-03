import { NestApplication, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app/app.module';
import swaggerInit from './swagger';
import { join } from 'path';

async function bootstrap() {
  const app: NestApplication = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
  });

  app.useStaticAssets(join(__dirname, '..', 'public'));


  await swaggerInit(app);

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
