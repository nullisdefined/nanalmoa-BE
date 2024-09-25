import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import fs from 'fs';

async function generateSwaggerJson() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });

  const config = new DocumentBuilder()
    .setTitle('Nanalmoa API')
    .setDescription('나날모아 서비스 개발을 위한 API 문서입니다.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./swagger.json', JSON.stringify(document));

  await app.close();
  console.log('Swagger JSON 파일이 생성되었습니다');
}

generateSwaggerJson();
