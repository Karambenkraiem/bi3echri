import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { SalesModule } from '../sales/sales.module';
import { TreasuryModule } from '../treasury/treasury.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SalesModule, TreasuryModule, NotificationsModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
