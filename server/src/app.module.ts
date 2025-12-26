import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoursesModule } from './courses/courses.module';
import { ConfigModule } from '@nestjs/config';
import { LogsModule } from './logs/logs.module';
import { GamersModule } from './gamers/gamers.module';
import { GamesModule } from './games/games.module';
import { EventsModule } from './events/events.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist', 'browser'),
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere without repeated imports
    }),
    CoursesModule,
    LogsModule,
    GamersModule,
    GamesModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
