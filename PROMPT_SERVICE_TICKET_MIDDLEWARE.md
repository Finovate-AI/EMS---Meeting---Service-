# Prompt: Implement X-Service-Ticket Middleware (Copy This to Your Other Service)

Use the following instructions in your **other NestJS service** to implement the same X-Service-Ticket middleware. There is **no x-secret-key** and **no AuthGuard**—only this middleware.

---

## What to implement

1. **A single middleware** that:
   - Reads the **X-Service-Ticket** header from every incoming request.
   - If the header is missing or empty → return **401 Unauthorized** with message: `"X-Service-Ticket header is required"`.
   - If present → call an external **ticket verification API** (POST) with that ticket in the header.
   - If verification returns **2xx** → attach the ticket to `request.serviceTicket` and call `next()`.
   - If verification fails (4xx/5xx or network error) → return **401** with message: `"Service ticket verification failed"` (or the error message from the API response).
   - **Exclude** certain paths from this check (e.g. Swagger UI and docs) so those routes do not require the header.

2. **App module**: Register the middleware for all routes (`forRoutes('*')`), and ensure `HttpModule` and `ConfigModule` are available so the middleware can be injected.

3. **Swagger**: Add an API Key security scheme named **X-Service-Ticket** (in header) so users can click "Authorize" in Swagger and the value is sent with every request.

4. **Environment**: Support a configurable verify URL via `TICKET_VERIFY_URL` in `.env` (default: `http://iamauth.runasp.net/api/ticket/verify`).

---

## File 1: Middleware

**Path:** `src/common/middleware/service-ticket.middleware.ts`

Create this file with the exact content below. Adjust the `src/common` path if your project uses a different structure (e.g. `src/middleware/service-ticket.middleware.ts`).

```typescript
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

    const verifyUrl =
      this.configService.get<string>('TICKET_VERIFY_URL') ||
      'http://iamauth.runasp.net/api/ticket/verify';

    try {
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
```

- **Verify API contract:** `POST` to `TICKET_VERIFY_URL`, body `{}`, header `X-Service-Ticket: <ticket>`. On success the IAM returns 2xx; on failure 4xx/5xx.
- **Excluded paths:** Any path starting with `/api` or equal to `/api-json` skips the middleware (so Swagger UI and OpenAPI JSON work without a ticket). Add more paths inside `isExcludedPath()` if needed (e.g. `/health`, `/permissions`, `/system/routes`).

---

## File 2: App module

- Implement **NestModule** and in `configure(consumer: MiddlewareConsumer)` apply `ServiceTicketMiddleware` to all routes: `consumer.apply(ServiceTicketMiddleware).forRoutes('*')`.
- Add **ServiceTicketMiddleware** to the module **providers** (so Nest can inject `ConfigService` and `HttpService` into it).
- Ensure **HttpModule** and **ConfigModule.forRoot({ isGlobal: true })** are in the module **imports**.

Example:

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ServiceTicketMiddleware } from './common/middleware/service-ticket.middleware';
// ... your other imports

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    // ... your other modules
  ],
  providers: [ServiceTicketMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ServiceTicketMiddleware).forRoutes('*');
  }
}
```

---

## File 3: Swagger (main.ts or wherever you build the document)

Add the API Key security scheme so Swagger shows an "Authorize" button and sends the header on every request:

```typescript
import { DocumentBuilder } from '@nestjs/swagger';

// Inside your bootstrap, when building the Swagger config:
const config = new DocumentBuilder()
  .setTitle('Your API')
  .setVersion('1.0')
  .addApiKey(
    {
      type: 'apiKey',
      name: 'X-Service-Ticket',
      in: 'header',
      description:
        'Service ticket issued by Authentication Gateway (sent as X-Service-Ticket header).',
    },
    'x-service-ticket',
  )
  .build();
```

Optional: On controllers or routes that require the ticket, add so the lock icon appears in Swagger:

```typescript
import { ApiSecurity } from '@nestjs/swagger';

@ApiSecurity('x-service-ticket')
@Controller('your-resource')
export class YourController { ... }
```

---

## File 4: Environment

In **.env** and **.env.example** add:

```env
# Service ticket verification (X-Service-Ticket middleware).
# Default used if not set: http://iamauth.runasp.net/api/ticket/verify
TICKET_VERIFY_URL=http://iamauth.runasp.net/api/ticket/verify
```

---

## Dependencies

- **@nestjs/axios** and **axios** (for `HttpService`).
- **@nestjs/config** (for `ConfigService`).
- **rxjs** (for `firstValueFrom`).

If not already present, install:

```bash
npm i @nestjs/axios axios
npm i @nestjs/config
```

---

## Summary

- **No x-secret-key, no AuthGuard.** Only the X-Service-Ticket middleware.
- **Header:** `X-Service-Ticket` (or `x-service-ticket`). Must be sent on all non-excluded paths.
- **Verify:** POST to `TICKET_VERIFY_URL` with body `{}` and header `X-Service-Ticket: <value>`.
- **Excluded paths:** Paths starting with `/api` and `/api-json` (customize `isExcludedPath` for your service).
- **After success:** `request.serviceTicket` is set; you can use it in controllers or add a small decorator to read it.
- **Swagger:** Use `addApiKey` for `X-Service-Ticket` and optionally `@ApiSecurity('x-service-ticket')` on controllers.

Implement the above in my NestJS project exactly as described, creating the middleware file, wiring it in AppModule, adding the Swagger API key, and the env variable.
