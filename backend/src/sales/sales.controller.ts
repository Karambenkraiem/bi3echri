import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.salesService.updateSale(id, dto);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelSaleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salesService.cancelSale(id, dto, user.userId);
  }
}
