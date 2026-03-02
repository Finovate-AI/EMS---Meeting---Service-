import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateParticipantDto {
  @ApiPropertyOptional({ description: 'Response to the meeting invitation', enum: ['ACCEPTED', 'DECLINED', 'TENTATIVE'], example: 'ACCEPTED' })
  @IsOptional()
  @IsIn(['ACCEPTED', 'DECLINED', 'TENTATIVE'])
  response?: string;
}
