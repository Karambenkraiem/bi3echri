import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { RestockArticleDto } from './dto/restock-article.dto';
import { CreateSaleDto } from '../sales/dto/create-sale.dto';
import { SalesService } from '../sales/sales.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { photoUploadOptions } from './multer.config';
import { MAX_PHOTOS_PER_ARTICLE } from '../common/uploads.constants';

@Controller('articles')
export class ArticlesController {
  constructor(
    private articlesService: ArticlesService,
    private salesService: SalesService,
  ) {}

  @Get()
  findAll(@Query() query: QueryArticleDto) {
    return this.articlesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.articlesService.create(dto, user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.articlesService.publish(id);
  }

  @Post(':id/restock')
  restock(
    @Param('id') id: string,
    @Body() dto: RestockArticleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.articlesService.restock(id, dto, user.userId);
  }

  @Post(':id/sell')
  sell(
    @Param('id') id: string,
    @Body() dto: CreateSaleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salesService.sellArticle(id, dto, user.userId);
  }

  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('files', MAX_PHOTOS_PER_ARTICLE, photoUploadOptions))
  addPhotos(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.articlesService.addPhotos(id, files ?? []);
  }

  @Delete(':id/photos/:photoId')
  removePhoto(@Param('id') id: string, @Param('photoId') photoId: string) {
    return this.articlesService.removePhoto(id, photoId);
  }
}
