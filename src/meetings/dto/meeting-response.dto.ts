import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParticipantResponseDto {
  @ApiProperty({ example: 'uuid-participant-1' })
  id: string;
  @ApiProperty({ example: 'uuid-meeting-1' })
  meetingId: string;
  @ApiProperty({ description: 'User ID from Auth Service', example: 'user-uuid-123' })
  userId: string;
  @ApiPropertyOptional({ enum: ['ACCEPTED', 'DECLINED', 'TENTATIVE'], example: 'ACCEPTED' })
  response?: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class OrganizerResponseDto {
  @ApiProperty({ example: 'uuid-organizer-1' })
  id: string;
  @ApiProperty({ example: 'uuid-meeting-1' })
  meetingId: string;
  @ApiProperty({ description: 'User ID from Auth Service', example: 'user-uuid-456' })
  userId: string;
  @ApiProperty()
  createdAt: Date;
}

export class AgendaItemResponseDto {
  @ApiProperty({ example: 'uuid-agenda-1' })
  id: string;
  @ApiProperty({ example: 'uuid-meeting-1' })
  meetingId: string;
  @ApiProperty({ example: 'Review Q1 Budget' })
  title: string;
  @ApiPropertyOptional({ example: 15 })
  durationMinutes?: number;
  @ApiPropertyOptional({ example: 'user-uuid-123' })
  ownerUserId?: string;
  @ApiProperty({ description: 'Display order', example: 0 })
  order: number;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class MinutesResponseDto {
  @ApiProperty({ example: 'uuid-minutes-1' })
  id: string;
  @ApiProperty({ example: 'uuid-meeting-1' })
  meetingId: string;
  @ApiPropertyOptional({ example: 'Team reviewed progress.' })
  notes?: string;
  @ApiPropertyOptional({ example: 'Approved budget.' })
  decisions?: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class ActionItemResponseDto {
  @ApiProperty({ example: 'uuid-action-1' })
  id: string;
  @ApiProperty({ example: 'uuid-meeting-1' })
  meetingId: string;
  @ApiProperty({ example: 'Send weekly report' })
  title: string;
  @ApiProperty({ example: 'user-uuid-456' })
  assignedToUserId: string;
  @ApiPropertyOptional()
  dueDate?: Date;
  @ApiProperty({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], example: 'PENDING' })
  status: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}

export class MeetingResponseDto {
  @ApiProperty({ example: 'uuid-meeting-1' })
  id: string;
  @ApiProperty({ example: 'Weekly Team Sync' })
  title: string;
  @ApiPropertyOptional({ example: 'Discuss Q1 goals' })
  description?: string;
  @ApiProperty({ example: '2026-02-20T10:00:00.000Z' })
  startTime: Date;
  @ApiProperty({ example: '2026-02-20T11:00:00.000Z' })
  endTime: Date;
  @ApiProperty({ description: 'Creator user ID', example: 'user-uuid-creator' })
  createdBy: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiPropertyOptional({ description: 'Zoom meeting ID', example: '123456789' })
  zoomMeetingId?: string;
  @ApiPropertyOptional({ description: 'Zoom join URL for participants', example: 'https://zoom.us/j/123456789' })
  zoomJoinUrl?: string;
  @ApiPropertyOptional({ description: 'Zoom start URL for host', example: 'https://zoom.us/s/123456789?zak=...' })
  zoomStartUrl?: string;
  @ApiPropertyOptional({ description: 'Zoom meeting password', example: '123456' })
  zoomPassword?: string;
  @ApiPropertyOptional({ type: [ParticipantResponseDto] })
  participants?: ParticipantResponseDto[];
  @ApiPropertyOptional({ type: [OrganizerResponseDto] })
  organizers?: OrganizerResponseDto[];
  @ApiPropertyOptional({ type: [AgendaItemResponseDto] })
  agendaItems?: AgendaItemResponseDto[];
  @ApiPropertyOptional({ type: MinutesResponseDto })
  minutes?: MinutesResponseDto;
  @ApiPropertyOptional({ type: [ActionItemResponseDto] })
  actionItems?: ActionItemResponseDto[];
}
