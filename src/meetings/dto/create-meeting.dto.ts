import { IsString, IsNotEmpty, IsDateString, IsOptional, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateParticipantDto {
  @ApiProperty({ description: 'User ID of the participant (from Auth Service)', example: 'user-uuid-123' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CreateOrganizerDto {
  @ApiProperty({ description: 'User ID of the organizer (from Auth Service)', example: 'user-uuid-456' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class CreateMeetingDto {
  @ApiProperty({ description: 'Meeting title', example: 'Weekly Team Sync' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Meeting description or agenda summary', example: 'Discuss Q1 goals and blockers' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Meeting start time (ISO 8601)', example: '2026-02-20T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'Meeting end time (ISO 8601)', example: '2026-02-20T11:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ description: 'List of participants to invite', type: [CreateParticipantDto], example: [{ userId: 'user-uuid-123' }] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants?: CreateParticipantDto[];

  @ApiPropertyOptional({ description: 'List of organizers (creator is added automatically)', type: [CreateOrganizerDto], example: [{ userId: 'user-uuid-456' }] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrganizerDto)
  organizers?: CreateOrganizerDto[];
}
