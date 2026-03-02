import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ZoomService } from './zoom.service';

@Module({
  imports: [HttpModule],
  providers: [ZoomService],
  exports: [ZoomService],
})
export class ZoomModule {}
