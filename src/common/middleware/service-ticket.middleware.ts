import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export const SERVICE_TICKET_HEADER = 'x-service-ticket';

/** Attached to request after successful verification */
export interface ServiceTicketRequest extends Request {
  serviceTicket?: string;
}

function isExcludedPath(path: string): boolean {
  const clean = path.split('?')[0];
  if (clean.startsWith('/api')) return true; // Swagger UI & docs
  if (clean === '/api-json') return true;
  return false;
}

@Injectable()
export class ServiceTicketMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ServiceTicketMiddleware.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const path = req.url || req.path || '';
    if (isExcludedPath(path)) {
      return next();
    }

    const ticket = this.getTicketFromHeader(req);

    if (!ticket) {
      throw new UnauthorizedException('X-Service-Ticket header is required');
    }

    // Master service ticket key (bypasses remote validation and does not expire)
    const masterKey = this.configService.get<string>('SERVICE_TICKET_KEY');
    if (masterKey && ticket === masterKey) {
      (req as ServiceTicketRequest).serviceTicket = ticket;
      return next();
    }

    const verifyUrl =
      this.configService.get<string>('TICKET_VERIFY_URL') ||
      'http://iamauth.runasp.net/api/ticket/verify';

    try {
      // The IAM service expects a POST request to /api/ticket/verify.
      const response = await firstValueFrom(
        this.httpService.post(
          verifyUrl,
          {},
          {
            headers: {
              [SERVICE_TICKET_HEADER]: ticket,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
            validateStatus: (status) => status >= 200 && status < 300,
          },
        ),
      );

      if (response.status >= 200 && response.status < 300) {
        (req as ServiceTicketRequest).serviceTicket = ticket;
        next();
      } else {
        throw new UnauthorizedException('Service ticket verification failed');
      }
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(
        `Ticket verify error: ${error?.message || 'Unknown'}. URL: ${verifyUrl}`,
      );
      throw new UnauthorizedException(
        error?.response?.data?.message || 'Service ticket verification failed',
      );
    }
  }

  private getTicketFromHeader(req: Request): string | undefined {
    const raw =
      req.headers[SERVICE_TICKET_HEADER] ?? req.headers['x-service-ticket'];
    if (typeof raw === 'string') return raw.trim() || undefined;
    if (Array.isArray(raw) && raw.length) return String(raw[0]).trim() || undefined;
    return undefined;
  }
}

