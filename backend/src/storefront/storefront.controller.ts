import { Controller, Get, Param, Query } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { QueryPublicProductsDto } from './dto/query-public-products.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('public')
export class StorefrontController {
  constructor(private storefrontService: StorefrontService) {}

  @Public()
  @Get('categories')
  categories() {
    return this.storefrontService.findCategories();
  }

  @Public()
  @Get('products')
  products(@Query() query: QueryPublicProductsDto) {
    return this.storefrontService.findProducts(query);
  }

  @Public()
  @Get('products/:id')
  product(@Param('id') id: string) {
    return this.storefrontService.findProduct(id);
  }
}
