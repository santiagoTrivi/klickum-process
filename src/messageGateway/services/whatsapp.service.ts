import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MessageStrategy } from '../domain/messageStratergy';
import { MessagePayload, useCase } from '../domain/messagePayload';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

@Injectable()
export class WhatsappService implements MessageStrategy {
  private readonly logger = new Logger(WhatsappService.name);
  private apikey;
  private apiUrl;
  private instance;
  constructor(private readonly configService: ConfigService) {
    this.apikey = this.configService.get<string>('EVOLUTION_API_KEY');
    this.apiUrl = this.configService.get<string>('EVOLUTION_API_URL');
    this.instance = this.configService.get<string>('EVOLUTION_API_INSTANCE');
    this.logger.log(
      `WhatsappService initialized with apiUrl: ${this.apiUrl}, instance: ${this.instance}`,
    );
  }
  async exists({ number }: MessagePayload): Promise<boolean> {
    const url = `${this.apiUrl}/chat/whatsappNumbers/${this.instance}`;

    const headers = this.getHeader();

    this.logger.log(
      JSON.stringify({
        event: 'exists',
        message: 'Checking if number exists via WhatsappService',
        stratergy: WhatsappService.name,
      }),
    );
    const body = {
      numbers: [number],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (Array.isArray(result) && result.length > 0) {
        const exists = result[0].exists;

        return exists;
      }
    } catch (error) {
      this.logger.error('Error sending message', JSON.stringify(error));
      throw error;
    }
  }

  private getHeader() {
    return {
      'Content-Type': 'application/json',
      apikey: this.apikey,
    };
  }

  private getBaseUrl() {
    return `${this.apiUrl}/message/sendText/${this.instance}`;
  }
  async sendMessage({
    number,
    name,
    useCase,
    url,
  }: MessagePayload): Promise<void> {
    const base_url = this.getBaseUrl();
    const headers = this.getHeader();

    this.logger.log(
      JSON.stringify({
        event: 'sendMessage',
        message: 'Sending message via WhatsappService',
        stratergy: WhatsappService.name,
      }),
    );
    const body = {
      number: number,
      linkPreview: false,
      text: this.getMessageText(useCase, name, url),
    };

    try {
      const response = await fetch(base_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as any;

      if (result.status === 'PENDING') {
        this.logger.log(
          JSON.stringify({
            event: 'sendMessage',
            message: 'Message sent successfully',
            stratergy: WhatsappService.name,
            response: result,
          }),
        );
      } else {
        this.logger.error(
          JSON.stringify({
            event: 'sendMessage',
            message: 'Failed to send message',
            stratergy: WhatsappService.name,
            response: result,
          }),
        );
        throw new BadRequestException('Failed to send message');
      }
    } catch (error) {
      this.logger.error('Error sending message', JSON.stringify(error));
      throw error;
    }
  }

  private getMessageText(
    useCase: useCase,
    name?: string,
    url?: string,
  ): string {
    switch (useCase) {
      case 'register':
        return `Hola 👋 ${
          name || ''
        }, Tu registro se ha completado con éxito. ¡Bienvenido(a)!`;
      case 'successPurchase':
        return `🛒 Tu compra se ha realizado exitosamente. Gracias por tu confianza.`;
      case 'balanceUpdate':
        return `Tu saldo ha sido actualizado correctamente. 👍 `;
      case 'purchaseUpdate':
        return `El estado de tu pedido ha sido actualizado. 🛒`;
      case 'digitalOrderProcessed':
        return `Hola ${
          name || ''
        }, tu pedido digital ha sido procesado con éxito ✅.\nPuedes descargar tu producto aquí ${url}`;
      default:
        return `Hola ${
          name || ''
        }, gracias por contactarnos. Nos pondremos en contacto contigo lo antes posible.`;
    }
  }
}
