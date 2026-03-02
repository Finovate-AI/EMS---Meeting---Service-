import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddParticipantDto {
  @ApiProperty({ description: 'User ID of the participant to add (from Auth Service)', example: 'user-uuid-789' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
