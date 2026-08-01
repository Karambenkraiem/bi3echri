import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MessageSender } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ClientDecisionDto } from './dto/client-decision.dto';
import { Public } from '../auth/decorators/public.decorator';
import { OptionalClientAuthGuard } from '../clients/guards/client-auth.guard';
import { CurrentClient } from '../clients/decorators/current-client.decorator';
import type { AuthenticatedClient } from '../clients/strategies/client-jwt.strategy';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Public()
  @UseGuards(OptionalClientAuthGuard)
  @Post('public/orders')
  createPublic(@Body() dto: CreateOrderDto, @CurrentClient() client: AuthenticatedClient | null) {
    return this.ordersService.createPublic(dto, client?.clientId ?? null);
  }

  @Public()
  @Get('public/orders/:id')
  getPublicOrder(@Param('id') id: string) {
    return this.ordersService.getPublicOrder(id);
  }

  @Public()
  @Get('public/orders/:id/messages')
  getPublicMessages(@Param('id') id: string) {
    return this.ordersService.getMessages(id);
  }

  @Public()
  @UseGuards(OptionalClientAuthGuard)
  @Post('public/orders/:id/messages')
  addPublicMessage(@Param('id') id: string, @Body() dto: CreateMessageDto) {
    return this.ordersService.addMessage(id, MessageSender.CLIENT, dto.body);
  }

  @Public()
  @Post('public/orders/:id/decision')
  applyClientDecision(@Param('id') id: string, @Body() dto: ClientDecisionDto) {
    return this.ordersService.applyClientDecision(id, dto);
  }

  @Get('orders')
  findAll(@Query() query: QueryOrderDto) {
    return this.ordersService.findAll(query);
  }

  @Get('orders/pending-count')
  pendingCount() {
    return this.ordersService.countPending().then((count) => ({ count }));
  }

  @Get('orders/:id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('orders/:id/messages')
  getMessages(@Param('id') id: string) {
    return this.ordersService.getMessages(id);
  }

  @Post('orders/:id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.addMessage(id, MessageSender.STAFF, dto.body, user.userId);
  }

  @Patch('orders/:id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Post('orders/:id/renew')
  renew(@Param('id') id: string) {
    return this.ordersService.renew(id);
  }
}
