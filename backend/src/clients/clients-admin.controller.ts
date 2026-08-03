import { Controller, Get, Param, Post } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('clients')
export class ClientsAdminController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  findAll() {
    return this.clientsService.findAllForStaff();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOneForStaff(id);
  }

  @Post(':id/impersonate')
  impersonate(@Param('id') id: string) {
    return this.clientsService.impersonate(id);
  }

  @Post('view-as-client')
  viewAsClient(@CurrentUser() user: AuthenticatedUser) {
    return this.clientsService.viewAsClient(user.userId);
  }
}
