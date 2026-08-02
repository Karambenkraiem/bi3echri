import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findForCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findForUser(user.userId);
  }
}
