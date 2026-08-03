import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('summary')
  summary() {
    return this.analyticsService.summary();
  }

  @Get('margin-by-category')
  marginByCategory() {
    return this.analyticsService.marginByCategory();
  }

  @Get('revenue-over-time')
  revenueOverTime() {
    return this.analyticsService.revenueOverTime();
  }

  @Get('stock-rotation')
  stockRotation() {
    return this.analyticsService.stockRotation();
  }

  @Get('channel-performance')
  channelPerformance() {
    return this.analyticsService.channelPerformance();
  }

  @Get('visits-daily')
  visitsDaily() {
    return this.analyticsService.visitsDaily();
  }

  @Get('visits-weekly')
  visitsWeekly() {
    return this.analyticsService.visitsWeekly();
  }

  @Get('visits-monthly')
  visitsMonthly() {
    return this.analyticsService.visitsMonthly();
  }
}
