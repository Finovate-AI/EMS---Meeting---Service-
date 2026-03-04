import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    roles: string[];
    departmentId: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.url;

    // Skip authentication for:
    // - Swagger UI paths (/api, /api-json, etc.) but NOT /api/meetings
    // - Public utility endpoints: /permissions and /system
    if (
      (path.startsWith('/api') && !path.startsWith('/api/meetings')) ||
      path.startsWith('/permissions') ||
      path.startsWith('/system')
    ) {
      return true;
    }

    // Disable auth for testing (set DISABLE_AUTH=true in .env)
    const disableAuth =
      this.configService.get<string>('DISABLE_AUTH') === 'true' ||
      process.env.DISABLE_AUTH === 'true';
    if (disableAuth) {
      const secretKey = (request.headers['x-secret-key'] as string) || 'test-key';
      const mockUserId = secretKey === 'test-key' ? 'test-user-id' : secretKey;
      (request as AuthenticatedRequest).user = {
        userId: mockUserId,
        roles: ['user'],
        departmentId: 'test-department-id',
      };
      return true;
    }

    const secretKey = request.headers['x-secret-key'] as string;

    if (!secretKey) {
      throw new UnauthorizedException('Missing x-secret-key header');
    }

    try {
      const authResponse = await this.authService.verifySecretKey(secretKey);
      
      // Attach user info to request object
      (request as AuthenticatedRequest).user = {
        userId: authResponse.userId,
        roles: authResponse.roles,
        departmentId: authResponse.departmentId,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
