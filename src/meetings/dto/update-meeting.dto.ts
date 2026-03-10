import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeetingDto {
  @ApiPropertyOptional({ description: 'Updated meeting title', example: 'Weekly Team Sync - Updated' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Updated meeting description', example: 'Revised agenda for Q1 review' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Updated start time (ISO 8601)', example: '2026-02-20T10:30:00.000Z' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Updated end time (ISO 8601)', example: '2026-02-20T11:30:00.000Z' })
  @IsDateString()
  @IsOptional()
  endTime?: string;
}
