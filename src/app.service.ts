import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  constructor(
    @Inject('KLICKUM_PROCESS_SERVICE') private readonly client: ClientProxy,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }
  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('✅ Successfully connected to RabbitMQ');
    } catch (err) {
      this.logger.error('❌ Failed to connect to RabbitMQ', err);
    }
  }
}
