import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from './prisma/prisma.module';
import { MeetingsModule } from './meetings/meetings.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SystemModule } from './system/system.module';
import { ServiceTicketMiddleware } from './common/middleware/service-ticket.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    PrismaModule,
    MeetingsModule,
    PermissionsModule,
    SystemModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ServiceTicketMiddleware).forRoutes('*');
  }
}
