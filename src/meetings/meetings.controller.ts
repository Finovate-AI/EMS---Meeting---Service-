import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  AddParticipantDto,
  MeetingResponseDto,
} from './dto';
import {
  CurrentServiceUser,
  ServiceUserContext,
} from '../common/decorators/service-user.decorator';

@ApiTags('meetings')
@ApiSecurity('x-service-ticket')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new meeting',
    description: 'Creates a meeting with optional participants and organizers. The authenticated user is automatically added as an organizer. Status defaults to DRAFT.',
  })
  @ApiResponse({ status: 201, description: 'Meeting created successfully', type: MeetingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid x-secret-key' })
  @ApiBody({
    type: CreateMeetingDto,
    examples: {
      minimal: {
        summary: 'Minimal',
        value: { title: 'Team Standup', startTime: '2026-02-20T10:00:00.000Z', endTime: '2026-02-20T10:15:00.000Z' },
      },
      full: {
        summary: 'With participants & organizers',
        value: {
          title: 'Weekly Sync',
          description: 'Q1 review and planning',
          startTime: '2026-02-20T10:00:00.000Z',
          endTime: '2026-02-20T11:00:00.000Z',
          status: 'SCHEDULED',
          participants: [{ userId: 'user-123' }, { userId: 'user-456' }],
          organizers: [{ userId: 'user-789' }],
        },
      },
    },
  })
  async create(
    @Body() createMeetingDto: CreateMeetingDto,
    @CurrentServiceUser() user?: ServiceUserContext,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.create(createMeetingDto, user?.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get meetings for current service user',
    description: 'Returns meetings created by the configured service user (SERVICE_TICKET_USER_ID). Optional filter by status. Ordered by start time (newest first).',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SCHEDULED', 'CANCELLED'], description: 'Filter by meeting status' })
  @ApiResponse({ status: 200, description: 'List of meetings', type: [MeetingResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentServiceUser() user?: ServiceUserContext,
  ): Promise<MeetingResponseDto[]> {
    return this.meetingsService.findAll(user?.id);
  }

  @Get(':id/participants')
  @ApiOperation({
    summary: 'Get meeting participants',
    description: 'Returns list of participants for a meeting. User must have access to the meeting.',
  })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'List of participants' })
  @ApiResponse({ status: 403, description: 'No access to this meeting' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getParticipants(
    @Param('id') id: string,
    @CurrentServiceUser() user?: ServiceUserContext,
  ) {
    return this.meetingsService.getParticipants(id, user?.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get meeting by ID',
    description: 'Returns full meeting details including participants, organizers, agenda, minutes, and action items. User must be creator, participant, or organizer.',
  })
  @ApiParam({ name: 'id', description: 'Meeting UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Meeting details', type: MeetingResponseDto })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 403, description: 'No access to this meeting' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @CurrentServiceUser() user?: ServiceUserContext,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.findOne(id, user?.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update meeting',
    description: 'Update title, description, times, or status. Only meeting organizers can update.',
  })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'Meeting updated', type: MeetingResponseDto })
  @ApiResponse({ status: 403, description: 'Only organizers can update' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    type: UpdateMeetingDto,
    examples: { update: { summary: 'Update example', value: { title: 'Updated Title', status: 'SCHEDULED' } } },
  })
  async update(
    @Param('id') id: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
    @CurrentServiceUser() user?: ServiceUserContext,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.update(id, updateMeetingDto, user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete meeting',
    description: 'Permanently delete a meeting. Only organizers can delete. All related data (participants, etc.) is removed.',
  })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 204, description: 'Meeting deleted' })
  @ApiResponse({ status: 403, description: 'Only organizers can delete' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Param('id') id: string,
    @CurrentServiceUser() user?: ServiceUserContext,
  ): Promise<void> {
    return this.meetingsService.remove(id, user?.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel meeting',
    description: 'Sets meeting status to CANCELLED. Only organizers can cancel. Returns 400 if already cancelled.',
  })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'Meeting cancelled', type: MeetingResponseDto })
  @ApiResponse({ status: 403, description: 'Only organizers can cancel' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  @ApiResponse({ status: 400, description: 'Meeting already cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancel(@Param('id') id: string): Promise<void> {
    return this.meetingsService.cancel(id);
  }

  @Post(':id/participants')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add participant',
    description: 'Invite a user to the meeting. Only organizers can add participants. Returns 400 if user is already a participant.',
  })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 201, description: 'Participant added', type: MeetingResponseDto })
  @ApiResponse({ status: 403, description: 'Only organizers can add participants' })
  @ApiResponse({ status: 400, description: 'Participant already added' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: AddParticipantDto, examples: { add: { summary: 'Add user', value: { userId: 'user-uuid-789' } } } })
  async addParticipant(
    @Param('id') id: string,
    @Body() addParticipantDto: AddParticipantDto,
    @CurrentServiceUser() user?: ServiceUserContext,
  ): Promise<MeetingResponseDto> {
    return this.meetingsService.addParticipant(id, addParticipantDto, user?.id);
  }

  @Delete(':id/participants/:participantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove participant',
    description: 'Remove a participant from the meeting. Only organizers can remove participants.',
  })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiParam({ name: 'participantId', description: 'Participant record UUID' })
  @ApiResponse({ status: 204, description: 'Participant removed' })
  @ApiResponse({ status: 403, description: 'Only organizers can remove participants' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
    @CurrentServiceUser() user?: ServiceUserContext,
  ): Promise<void> {
    return this.meetingsService.removeParticipant(id, participantId, user?.id);
  }
}
