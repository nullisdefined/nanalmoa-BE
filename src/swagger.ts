import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import fs from 'fs';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { GroupModule } from './modules/group/group.module';

class MinimalAppModule {}

async function generateSwaggerJson() {
  const app = await NestFactory.create(MinimalAppModule, { logger: ['error'] });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Nanalmoa API')
    .setDescription('나날모아 서비스 개발을 위한 API 문서입니다.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [AuthModule, UsersModule, SchedulesModule, GroupModule],
  });

  fs.writeFileSync('./swagger.json', JSON.stringify(document));

  await app.close();
  console.log('Swagger JSON 파일이 생성되었습니다');
}

generateSwaggerJson();
