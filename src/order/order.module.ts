import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './model/order.entity';
import { Status } from '../status/model/status.entity';
import { MessageGatewayModule } from '../messageGateway/message.gateway.module';
import { RmqModule } from '../rabbitmq/rmq.module';

@Module({
  imports: [
    MessageGatewayModule,
    TypeOrmModule.forFeature([Order, Status]),
    RmqModule,
  ],
  providers: [OrderService],
  exports: [],
})
export class OrderModule {}
