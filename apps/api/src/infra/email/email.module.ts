import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

// Global so any service can inject EmailService without re-importing the
// module everywhere. Matches the pattern used by Prisma / Redis / Storage.
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
