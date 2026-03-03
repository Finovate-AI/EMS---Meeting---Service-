import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface RouteInfo {
  method: string;
  route: string;
  controller: string;
  action: string;
}

@ApiTags('system')
@Controller('system')
export class SystemController {
  @Get('routes')
  @ApiOperation({
    summary: 'Get all routes for this service',
    description:
      'Returns a list of all REST endpoints exposed by the Meeting Service. ' +
      'Typically used by the API Gateway / System Service to discover routes.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of routes returned successfully.',
    schema: {
      example: [
        {
          method: 'GET',
          route: '/meetings',
          controller: 'Meetings',
          action: 'FindAll',
        },
      ],
    },
  })
  getRoutes(): RouteInfo[] {
    return [
      // MeetingsController
      {
        method: 'POST',
        route: '/meetings',
        controller: 'Meetings',
        action: 'Create',
      },
      {
        method: 'GET',
        route: '/meetings',
        controller: 'Meetings',
        action: 'FindAll',
      },
      {
        method: 'GET',
        route: '/meetings/{id}/participants',
        controller: 'Meetings',
        action: 'GetParticipants',
      },
      {
        method: 'GET',
        route: '/meetings/{id}',
        controller: 'Meetings',
        action: 'FindOne',
      },
      {
        method: 'PATCH',
        route: '/meetings/{id}',
        controller: 'Meetings',
        action: 'Update',
      },
      {
        method: 'DELETE',
        route: '/meetings/{id}',
        controller: 'Meetings',
        action: 'Remove',
      },
      {
        method: 'POST',
        route: '/meetings/{id}/cancel',
        controller: 'Meetings',
        action: 'Cancel',
      },
      {
        method: 'POST',
        route: '/meetings/{id}/participants',
        controller: 'Meetings',
        action: 'AddParticipant',
      },
      {
        method: 'PATCH',
        route: '/meetings/{id}/participants/{participantId}',
        controller: 'Meetings',
        action: 'UpdateParticipant',
      },
      {
        method: 'DELETE',
        route: '/meetings/{id}/participants/{participantId}',
        controller: 'Meetings',
        action: 'RemoveParticipant',
      },
      // PermissionsController
      {
        method: 'GET',
        route: '/permissions',
        controller: 'Permissions',
        action: 'GetPermissions',
      },
    ];
  }
}

