import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgendaItemDto {
  @ApiProperty({ description: 'Title of the agenda item', example: 'Review Q1 Budget' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes', minimum: 1, example: 15 })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'User ID of the person responsible for this item (from Auth Service)', example: 'user-uuid-123' })
  @IsString()
  @IsOptional()
  ownerUserId?: string;
}
