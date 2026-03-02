import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface AuthResponse {
  userId: string;
  roles: string[];
  departmentId: string;
}

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001';
  }

  async verifySecretKey(secretKey: string): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthResponse>(
          `${this.authServiceUrl}/verify`,
          {},
          {
            headers: {
              'x-secret-key': secretKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new UnauthorizedException('Invalid secret key');
      }
      throw new UnauthorizedException('Failed to verify secret key');
    }
  }
}
