import { Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { NestApplication } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

export default async function (app: NestApplication) {
  const logger = new Logger('Swagger');

  const documentBuild = new DocumentBuilder()
    .setTitle('Exam API')
    .setDescription('The Exam API documentation')
    .setVersion('1.0')
    .addServer('/')
    .build();

  const document = SwaggerModule.createDocument(app, documentBuild, {
    deepScanRoutes: true,
  });

  writeFileSync('./data/swagger.json', JSON.stringify(document));
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: '/swagger.json',
    yamlDocumentUrl: '/swagger.yaml',
    explorer: true,
    customSiteTitle: 'Exam API',
    swaggerOptions: {
      docExpansion: 'none',
      tryItOutEnabled: true,
      displayOperationId: true,
      filter: true,
      tagSorter: 'alpha',
      deepLinking: true,
    },
  });

  logger.log('========================================================');
  logger.log('===Access Documentation on: http://localhost:3000/api===');
  logger.log('========================================================');
}
