import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZoomService } from '../zoom/zoom.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  AddParticipantDto,
  UpdateParticipantDto,
  MeetingResponseDto,
} from './dto';
// Enums converted to string constants for SQL Server compatibility
const MeetingStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
} as const;

@Injectable()
export class MeetingsService {
  private readonly logger = new Logger(MeetingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly zoomService: ZoomService,
  ) {}

  private getDefaultUserId(): string {
    return process.env.SERVICE_TICKET_USER_ID || 'system';
  }

  async create(createMeetingDto: CreateMeetingDto): Promise<MeetingResponseDto> {
    const { participants, organizers, ...meetingData } = createMeetingDto;

    const defaultUserId = this.getDefaultUserId();

    // Ensure at least one organizer exists (no auth, so we don't track current user)
    const meetingOrganizers = organizers || [];
    if (meetingOrganizers.length === 0) {
      meetingOrganizers.push({ userId: defaultUserId });
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        ...meetingData,
        createdBy: defaultUserId,
        status: meetingData.status || 'DRAFT',
        participants: participants
          ? {
              create: participants.map((p) => ({
                userId: p.userId,
              })),
            }
          : undefined,
        organizers: {
          create: meetingOrganizers.map((o) => ({
            userId: o.userId,
          })),
        },
      },
      include: {
        participants: true,
        organizers: true,
        agendaItems: true,
        minutes: true,
        actionItems: true,
      },
    });

    // Create Zoom meeting if status is SCHEDULED
    if (meeting.status === 'SCHEDULED') {
      try {
        const durationMinutes = Math.round(
          (new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 60000,
        );

        const zoomMeeting = await this.zoomService.createMeeting({
          topic: meeting.title,
          type: 2, // Scheduled meeting
          start_time: meeting.startTime.toISOString(),
          duration: durationMinutes,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: false,
            waiting_room: false,
          },
        });

        // Update meeting with Zoom data
        const updatedMeeting = await this.prisma.meeting.update({
          where: { id: meeting.id },
          data: {
            zoomMeetingId: zoomMeeting.id,
            zoomJoinUrl: zoomMeeting.join_url,
            zoomStartUrl: zoomMeeting.start_url,
            zoomPassword: zoomMeeting.password,
          },
          include: {
            participants: true,
            organizers: true,
            agendaItems: true,
            minutes: true,
            actionItems: true,
          },
        });

        this.logger.log(`Zoom meeting created for meeting ${meeting.id}: ${zoomMeeting.id}`);
        return this.mapToResponseDto(updatedMeeting);
      } catch (error) {
        this.logger.error(`Failed to create Zoom meeting for ${meeting.id}:`, error.message);
        // Continue without Zoom - meeting is still created
        // You can optionally throw or handle differently
      }
    }

    return this.mapToResponseDto(meeting);
  }

  async findAll(status?: string): Promise<MeetingResponseDto[]> {
    const where: any = {};
    if (status && ['DRAFT', 'SCHEDULED', 'CANCELLED'].includes(status)) {
      where.status = status;
    }
    const meetings = await this.prisma.meeting.findMany({
      where,
      include: {
        participants: true,
        organizers: true,
        agendaItems: true,
        minutes: true,
        actionItems: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return meetings.map((meeting) => this.mapToResponseDto(meeting));
  }

  async findOne(id: string): Promise<MeetingResponseDto> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        participants: true,
        organizers: true,
        agendaItems: true,
        minutes: true,
        actionItems: true,
      },
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    return this.mapToResponseDto(meeting);
  }

  async update(
    id: string,
    updateMeetingDto: UpdateMeetingDto,
  ): Promise<MeetingResponseDto> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { organizers: true },
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    // Check if status is being changed to SCHEDULED and meeting doesn't have Zoom meeting yet
    const oldStatus = meeting.status;
    const newStatus = updateMeetingDto.status;
    const shouldCreateZoom =
      newStatus === 'SCHEDULED' &&
      oldStatus !== 'SCHEDULED' &&
      !meeting.zoomMeetingId;

    const updatedMeeting = await this.prisma.meeting.update({
      where: { id },
      data: updateMeetingDto,
      include: {
        participants: true,
        organizers: true,
        agendaItems: true,
        minutes: true,
        actionItems: true,
      },
    });

    // Create Zoom meeting if status changed to SCHEDULED
    if (shouldCreateZoom) {
      try {
        const durationMinutes = Math.round(
          (new Date(updatedMeeting.endTime).getTime() -
            new Date(updatedMeeting.startTime).getTime()) /
            60000,
        );

        const zoomMeeting = await this.zoomService.createMeeting({
          topic: updatedMeeting.title,
          type: 2, // Scheduled meeting
          start_time: updatedMeeting.startTime.toISOString(),
          duration: durationMinutes,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: false,
            waiting_room: false,
          },
        });

        // Update meeting with Zoom data
        const meetingWithZoom = await this.prisma.meeting.update({
          where: { id },
          data: {
            zoomMeetingId: zoomMeeting.id,
            zoomJoinUrl: zoomMeeting.join_url,
            zoomStartUrl: zoomMeeting.start_url,
            zoomPassword: zoomMeeting.password,
          },
          include: {
            participants: true,
            organizers: true,
            agendaItems: true,
            minutes: true,
            actionItems: true,
          },
        });

        this.logger.log(`Zoom meeting created for meeting ${id}: ${zoomMeeting.id}`);
        return this.mapToResponseDto(meetingWithZoom);
      } catch (error) {
        this.logger.error(`Failed to create Zoom meeting for ${id}:`, error.message);
        // Continue without Zoom - meeting is still updated
      }
    }

    return this.mapToResponseDto(updatedMeeting);
  }

  async cancel(id: string): Promise<MeetingResponseDto> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { organizers: true },
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }

    if (meeting.status === 'CANCELLED') {
      throw new BadRequestException('Meeting is already cancelled');
    }

    const updatedMeeting = await this.prisma.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        participants: true,
        organizers: true,
        agendaItems: true,
        minutes: true,
        actionItems: true,
      },
    });

    return this.mapToResponseDto(updatedMeeting);
  }

  async addParticipant(
    meetingId: string,
    addParticipantDto: AddParticipantDto,
  ): Promise<MeetingResponseDto> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { organizers: true },
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
    }

    // Check if participant already exists
    const existingParticipant = await this.prisma.meetingParticipant.findUnique({
      where: {
        meetingId_userId: {
          meetingId,
          userId: addParticipantDto.userId,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('Participant already added to this meeting');
    }

    await this.prisma.meetingParticipant.create({
      data: {
        meetingId,
        userId: addParticipantDto.userId,
      },
    });

    return this.findOne(meetingId);
  }

  async updateParticipant(
    meetingId: string,
    participantId: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<MeetingResponseDto> {
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${participantId} not found`);
    }

    if (participant.meetingId !== meetingId) {
      throw new BadRequestException('Participant does not belong to this meeting');
    }

    await this.prisma.meetingParticipant.update({
      where: { id: participantId },
      data: updateParticipantDto,
    });

    return this.findOne(meetingId);
  }

  async getParticipants(meetingId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { participants: true, organizers: true },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${meetingId} not found`);
    }
    return meeting.participants.map((p) => ({
      id: p.id,
      meetingId: p.meetingId,
      userId: p.userId,
      response: p.response,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async removeParticipant(
    meetingId: string,
    participantId: string,
  ): Promise<void> {
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { id: participantId },
      include: { meeting: { include: { organizers: true } } },
    });
    if (!participant || participant.meetingId !== meetingId) {
      throw new NotFoundException('Participant not found');
    }
    await this.prisma.meetingParticipant.delete({
      where: { id: participantId },
    });
  }

  async remove(id: string): Promise<void> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { organizers: true },
    });
    if (!meeting) {
      throw new NotFoundException(`Meeting with ID ${id} not found`);
    }
    // Delete Zoom meeting if exists
    if (meeting.zoomMeetingId) {
      try {
        await this.zoomService.deleteMeeting(meeting.zoomMeetingId);
        this.logger.log(`Zoom meeting ${meeting.zoomMeetingId} deleted for meeting ${id}`);
      } catch (error) {
        this.logger.warn(`Failed to delete Zoom meeting ${meeting.zoomMeetingId}:`, error.message);
        // Continue with meeting deletion even if Zoom deletion fails
      }
    }

    await this.prisma.meeting.delete({
      where: { id },
    });
  }

  private mapToResponseDto(meeting: any): MeetingResponseDto {
    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      status: meeting.status,
      createdBy: meeting.createdBy,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
      zoomMeetingId: meeting.zoomMeetingId,
      zoomJoinUrl: meeting.zoomJoinUrl,
      zoomStartUrl: meeting.zoomStartUrl,
      zoomPassword: meeting.zoomPassword,
      participants: meeting.participants?.map((p: any) => ({
        id: p.id,
        meetingId: p.meetingId,
        userId: p.userId,
        response: p.response,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      organizers: meeting.organizers?.map((o: any) => ({
        id: o.id,
        meetingId: o.meetingId,
        userId: o.userId,
        createdAt: o.createdAt,
      })),
      agendaItems: meeting.agendaItems?.map((a: any) => ({
        id: a.id,
        meetingId: a.meetingId,
        title: a.title,
        durationMinutes: a.durationMinutes,
        ownerUserId: a.ownerUserId,
        order: a.order,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      minutes: meeting.minutes
        ? {
            id: meeting.minutes.id,
            meetingId: meeting.minutes.meetingId,
            notes: meeting.minutes.notes,
            decisions: meeting.minutes.decisions,
            createdAt: meeting.minutes.createdAt,
            updatedAt: meeting.minutes.updatedAt,
          }
        : undefined,
      actionItems: meeting.actionItems?.map((a: any) => ({
        id: a.id,
        meetingId: a.meetingId,
        title: a.title,
        assignedToUserId: a.assignedToUserId,
        dueDate: a.dueDate,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
    };
  }
}
