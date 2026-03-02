import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get permissions for Meeting Service',
    description:
      'Returns the list of permission keys exposed by the Meeting Service. ' +
      'This is typically used by the central Auth/Permission Service to seed or validate permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions list returned successfully.',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Request processed successfully.',
        data: {
          total: 10,
          permissions: [
            'Meetings.Create',
            'Meetings.List',
            'Meetings.View',
            'Meetings.Update',
            'Meetings.Delete',
            'Meetings.Cancel',
            'Meetings.Participants.Add',
            'Meetings.Participants.UpdateResponse',
            'Meetings.Participants.List',
            'Meetings.Participants.Remove',
          ],
        },
      },
    },
  })
  getPermissions() {
    const data = this.permissionsService.getPermissions();
    return {
      success: true,
      statusCode: 200,
      message: 'Request processed successfully.',
      data,
    };
  }
}

