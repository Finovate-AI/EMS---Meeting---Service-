import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response, NextFunction } from 'express';
import { firstValueFrom } from 'rxjs';

export interface RequestWithServiceTicket extends Request {
  serviceTicket?: string;
  serviceTicketPayload?: any;
}

@Injectable()
export class ServiceTicketMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ServiceTicketMiddleware.name);

  constructor(private readonly httpService: HttpService) {}

  async use(req: RequestWithServiceTicket, res: Response, next: NextFunction) {
    const ticket =
      (req.headers['x-service-ticket'] as string) ||
      req.header('X-Service-Ticket') ||
      req.header('x-service-ticket');

    // Allow disabling external auth for local testing
    const disableAuth =
      process.env.DISABLE_AUTH === 'true' ||
      process.env.DISABLE_SERVICE_TICKET === 'true';

    if (!ticket) {
      if (disableAuth) {
        return next();
      }
      throw new UnauthorizedException('Missing X-Service-Ticket header');
    }

    // Always expose the raw header value on the request object
    req.serviceTicket = ticket;

    if (disableAuth) {
      return next();
    }

    try {
      const baseUrl = process.env.AUTH_SERVICE_URL || 'http://iamauth.runasp.net';
      const verifyPath = process.env.AUTH_VERIFY_PATH || '/api/ticket/verify';
      const verifyUrl = `${baseUrl.replace(/\/$/, '')}${verifyPath}`;

      const response = await firstValueFrom(
        this.httpService.get(verifyUrl, {
          headers: {
            'X-Service-Ticket': ticket,
          },
        }),
      );

      // Attach verification payload so controllers/guards can use it
      req.serviceTicketPayload = response.data;
      this.logger.debug('X-Service-Ticket verified successfully');
      return next();
    } catch (error: any) {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;

      this.logger.error(
        `Failed to verify X-Service-Ticket (status ${status ?? 'unknown'}): ${message}`,
      );
      throw new UnauthorizedException(
        'Invalid or expired X-Service-Ticket header',
      );
    }
  }
}

