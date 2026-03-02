import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsService {
  // Static list of permissions exposed by this Meeting Service
  private readonly permissions: string[] = [
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
  ];

  getPermissions(): { total: number; permissions: string[] } {
    return {
      total: this.permissions.length,
      permissions: this.permissions,
    };
  }
}

