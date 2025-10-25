import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from './model/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Status } from '../status/model/status.entity';
import { MessageStrategy } from '../messageGateway/domain/messageStratergy';
@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private statusCompleted?: Status;
  private isProcessing = false;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,
    @Inject(MessageStrategy.name)
    private readonly messageStrategy: MessageStrategy,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleDigitalProductOrderCron(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn(
        'Skipping cron: previous digital order job still running.',
      );
      return;
    }

    const start = Date.now();
    this.isProcessing = true;
    this.logger.debug('Started digital product order processing task.');

    try {
      await this.ensureCompletedStatusLoaded();

      const digitalOrders = await this.fetchPendingDigitalOrders(10);
      if (!digitalOrders.length) {
        this.logger.debug('No digital orders pending processing.');
        return;
      }

      for (const order of digitalOrders) {
        await this.processDigitalOrder(order);
      }

      const duration = ((Date.now() - start) / 1000).toFixed(2);
      this.logger.log(`Completed digital product order task in ${duration}s`);
    } catch (error) {
      this.logger.error('Error processing digital product orders', error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  private async ensureCompletedStatusLoaded(): Promise<void> {
    if (!this.statusCompleted) {
      this.statusCompleted = await this.statusRepo.findOneBy({
        name: 'completed',
      });
      if (!this.statusCompleted) {
        throw new Error("Status 'completed' not found in database.");
      }
    }
  }

  private fetchPendingDigitalOrders(limit: number): Promise<Order[]> {
    return this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('order.status', 'status')
      .leftJoinAndSelect('item.productVariant', 'productVariant')
      .leftJoinAndSelect('productVariant.product', 'product')
      .where('product.group = :group', { group: 'simple' })
      .andWhere("product.metadata ->> 'productType' = :type", {
        type: 'digital',
      })
      .andWhere('order.isSent = :isSent', { isSent: false })
      .andWhere('status.name = :statusName', { statusName: 'pending' })
      .orderBy('order.created_at', 'ASC')
      .take(limit)
      .getMany();
  }

  private async processDigitalOrder(order: Order): Promise<void> {
    try {
      const productUrl =
        order.items[0]?.productVariant?.product?.metadata?.url ?? null;

      if (!productUrl) {
        this.logger.warn(`Order ${order.id} has no digital URL; skipping.`);
        return;
      }

      await this.messageStrategy.sendMessage({
        number: order.user.phone,
        useCase: 'digitalOrderProcessed',
        name: order.user.username,
        url: productUrl,
      });

      order.isSent = true;
      order.status = this.statusCompleted!;
      await this.orderRepo.save(order);

      this.logger.log(
        `Processed digital order [${order.id}] for user [${order.user.id}]`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to process order [${order.id}]: ${err.message}`,
      );
    }
  }
}
