import { IsString, IsNotEmpty, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActionItemDto {
  @ApiProperty({ description: 'Title of the action item', example: 'Send weekly report to stakeholders' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'User ID of the person assigned (from Auth Service)', example: 'user-uuid-456' })
  @IsString()
  @IsNotEmpty()
  assignedToUserId: string;

  @ApiPropertyOptional({ description: 'Due date (ISO 8601)', example: '2026-02-25T17:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Action item status', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], example: 'PENDING' })
  @IsOptional()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
  status?: string;
}
