import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TreasuryService } from './treasury.service';
import { AdjustTreasuryDto } from './dto/adjust-treasury.dto';
import { InvestTreasuryDto } from './dto/invest-treasury.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { BalanceOverTimeQueryDto } from './dto/balance-over-time-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('treasury')
export class TreasuryController {
  constructor(private treasuryService: TreasuryService) {}

  @Get('balance')
  getBalance() {
    return this.treasuryService.getBalance();
  }

  @Get('balance-by-method')
  getBalanceByMethod() {
    return this.treasuryService.getBalanceByMethod();
  }

  @Get('balance-total')
  getTotalBalance() {
    return this.treasuryService.getTotalBalance();
  }

  @Get('balance-over-time')
  balanceOverTime(@Query() query: BalanceOverTimeQueryDto) {
    return this.treasuryService.balanceOverTime(query.granularity ?? 'day', query.from, query.to);
  }

  @Get('movements')
  history() {
    return this.treasuryService.history();
  }

  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles(Role.VENDEUR, Role.ADMIN)
  adjust(@Body() dto: AdjustTreasuryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.treasuryService.manualAdjust(dto, user.userId);
  }

  @Post('invest')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  invest(@Body() dto: InvestTreasuryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.treasuryService.invest(dto, user.userId);
  }

  @Patch('movements/:id')
  updateMovement(
    @Param('id') id: string,
    @Body() dto: UpdateMovementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.treasuryService.updateMovement(id, dto, user);
  }

  @Delete('movements/:id')
  removeMovement(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.treasuryService.removeMovement(id, user);
  }

  @Patch('movements/:id/comment')
  @UseGuards(RolesGuard)
  @Roles(Role.VENDEUR, Role.ADMIN)
  updateComment(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.treasuryService.updateComment(id, dto.comment);
  }
}
