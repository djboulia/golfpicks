import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import dotenv from 'dotenv';
import session from 'express-session';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('GolfPicks')
    .setDescription('The GolfPicks API')
    .setVersion('1.0')
    .addTag('golfpicks')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.use(
    session({
      secret: 'my-secret', // Use an environment variable in production
      resave: false,
      saveUninitialized: false,
    }),
  );

  console.log('CORS settings applied,', process.env.CORS_CLIENT);
  const allowedOrigins = process.env.CORS_CLIENT
    ? process.env.CORS_CLIENT.split(',')
    : [];

  // Enable CORS for all origins with default settings
  app.enableCors({
    origin: allowedOrigins, // Specify allowed origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Specify allowed methods
    allowedHeaders: 'Content-Type, Accept, Authorization', // Specify allowed headers
    credentials: true, // Allow cookies and authentication headers
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
