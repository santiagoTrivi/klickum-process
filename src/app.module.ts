import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MessageGatewayModule } from './messageGateway/message.gateway.module';
import { OrderModule } from './order/order.module';
import { RmqModule } from './rabbitmq/rmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [typeorm] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        configService.get('typeorm') as TypeOrmModuleOptions,
      inject: [ConfigService],
    }),
    MessageGatewayModule,
    OrderModule,
    RmqModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
