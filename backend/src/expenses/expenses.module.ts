import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { TreasuryModule } from '../treasury/treasury.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TreasuryModule, NotificationsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
