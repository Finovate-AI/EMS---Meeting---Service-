import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as jwt from 'jsonwebtoken';

export interface ZoomMeetingResponse {
  id: string;
  join_url: string;
  start_url: string;
  password?: string;
}

export interface CreateZoomMeetingDto {
  topic: string;
  type: number; // 1 = instant, 2 = scheduled
  start_time?: string; // ISO 8601
  duration?: number; // minutes
  timezone?: string;
  password?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
  };
}

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly accountId?: string;
  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Support both ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET (Server-to-Server OAuth) 
    // and ZOOM_API_KEY/ZOOM_API_SECRET (legacy JWT)
    this.clientId =
      this.configService.get<string>('ZOOM_CLIENT_ID') ||
      this.configService.get<string>('ZOOM_API_KEY') ||
      '';
    this.clientSecret =
      this.configService.get<string>('ZOOM_CLIENT_SECRET') ||
      this.configService.get<string>('ZOOM_API_SECRET') ||
      '';
    this.accountId = this.configService.get<string>('ZOOM_ACCOUNT_ID');

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('Zoom credentials not configured. Zoom integration will be disabled.');
    } else {
      this.logger.log('Zoom credentials loaded successfully');
    }
  }

  /**
   * Generate JWT token for Zoom API (used by JWT / legacy Zoom apps)
   */
  private getJwtToken(): string {
    const payload = {
      iss: this.clientId,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };
    return jwt.sign(payload, this.clientSecret);
  }

  /**
   * Get OAuth access token for Zoom API
   * Tries Server-to-Server OAuth first; falls back to JWT if OAuth fails (e.g. JWT app credentials)
   */
  private async getAccessToken(): Promise<string> {
    // Check if token is still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 300000) {
      return this.accessToken;
    }

    // If we have accountId, try Server-to-Server OAuth first
    if (this.accountId) {
      const tokenUrl = 'https://zoom.us/oauth/token';
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      try {
        const response = await firstValueFrom(
          this.httpService.post(
            tokenUrl,
            `grant_type=account_credentials&account_id=${this.accountId}`,
            {
              headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            },
          ),
        );

        this.accessToken = response.data.access_token;
        this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000;
        this.logger.log('Zoom OAuth token obtained successfully');
        return this.accessToken;
      } catch (oauthError) {
        const status = oauthError.response?.status;
        const code = oauthError.response?.data?.error;
        // 400/invalid_client often means credentials are for JWT app, not OAuth
        if (status === 400 || code === 'invalid_client' || code === 'invalid_grant') {
          this.logger.warn('Zoom OAuth failed, falling back to JWT (credentials may be from JWT app)');
        } else {
          this.logger.error('Zoom OAuth error:', JSON.stringify(oauthError.response?.data || oauthError.message));
          throw new Error(
            `Zoom auth failed: ${oauthError.response?.data?.error_description || oauthError.response?.data?.error || oauthError.message}`,
          );
        }
      }
    }

    // Use JWT (for JWT app credentials or when OAuth not configured)
    try {
      this.accessToken = this.getJwtToken();
      this.tokenExpiresAt = Date.now() + 3600000;
      this.logger.log('Zoom JWT token generated');
      return this.accessToken;
    } catch (error) {
      this.logger.error('JWT generation failed:', error.message);
      throw new Error('Zoom JWT token generation failed. Install jsonwebtoken.');
    }
  }

  /**
   * Create a Zoom meeting
   */
  async createMeeting(createZoomDto: CreateZoomMeetingDto): Promise<ZoomMeetingResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Zoom credentials not configured');
    }

    try {
      const token = await this.getAccessToken();
      const userId = this.configService.get<string>('ZOOM_USER_ID') || 'me'; // 'me' for account owner

      const response = await firstValueFrom(
        this.httpService.post(
          `https://api.zoom.us/v2/users/${userId}/meetings`,
          createZoomDto,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        id: response.data.id.toString(),
        join_url: response.data.join_url,
        start_url: response.data.start_url,
        password: response.data.password,
      };
    } catch (error) {
      this.logger.error('Failed to create Zoom meeting:', error.response?.data || error.message);
      throw new Error(`Failed to create Zoom meeting: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete a Zoom meeting
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    if (!this.clientId || !this.clientSecret) {
      return; // Silently fail if Zoom not configured
    }

    try {
      const token = await this.getAccessToken();

      await firstValueFrom(
        this.httpService.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    } catch (error) {
      this.logger.warn(`Failed to delete Zoom meeting ${meetingId}:`, error.message);
      // Don't throw - meeting might already be deleted or not exist
    }
  }
}
