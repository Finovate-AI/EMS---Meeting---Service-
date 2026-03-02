import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMinutesDto {
  @ApiPropertyOptional({ description: 'Meeting notes and discussion summary', example: 'Team reviewed progress. All milestones on track.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Decisions made during the meeting', example: 'Approved budget increase. Next review in two weeks.' })
  @IsString()
  @IsOptional()
  decisions?: string;
}
