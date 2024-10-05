import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';
import session from 'express-session';
import passport from 'passport';
import 'reflect-metadata';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:5173',
    credentials: true,
  });
  app.setGlobalPrefix('api');

  const port = process.env.PORT;

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const config = new DocumentBuilder()
    .setTitle('Nanalmoa API')
    .setDescription('나날모아 서비스 개발을 위한 API 문서입니다.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Swagger JSON 파일 생성
  // 생성된 Swagger 문서를 JSON 형식으로 변환하여 파일로 저장
  fs.writeFileSync('./swagger.json', JSON.stringify(document));

  SwaggerModule.setup('api', app, document);

  await app.listen(port);

  console.log(
    `*** ${process.env.NODE_ENV} 환경에서 포트 ${port}번 대기 중입니다.`,
  );

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
