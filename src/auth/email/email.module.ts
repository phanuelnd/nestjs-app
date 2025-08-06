import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Import HttpModule here
import { EmailService } from './email.service';

@Module({
  imports: [HttpModule], // Add HttpModule to imports
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
