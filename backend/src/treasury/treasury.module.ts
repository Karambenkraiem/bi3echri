import { Module } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TreasuryController],
  providers: [TreasuryService],
  exports: [TreasuryService],
})
export class TreasuryModule {}
