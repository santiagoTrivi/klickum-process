import { RmqOptions, Transport } from '@nestjs/microservices';

export const rabbitMQConfig = (): RmqOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
    queue: process.env.RABBITMQ_QUEUE || 'klickum_process_queue',
    queueOptions: {
      durable: process.env.RABBITMQ_DURABLE === 'true',
    },
  },
});
