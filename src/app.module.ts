import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MeetingsModule } from './meetings/meetings.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthGuard } from './auth/auth.guard';
import { ServiceTicketMiddleware } from './common/middleware/service-ticket.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    PrismaModule,
    AuthModule,
    MeetingsModule,
    PermissionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ServiceTicketMiddleware).forRoutes('*');
  }
}

