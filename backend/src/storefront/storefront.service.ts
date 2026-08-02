import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { QueryPublicProductsDto } from './dto/query-public-products.dto';

const NEW_PRODUCT_WINDOW_DAYS = 14;

const PRODUCT_INCLUDE = {
  category: { include: { parent: true } },
  photos: { orderBy: { order: 'asc' as const } },
};

type ArticleWithRelations = Prisma.ArticleGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

function toPublicProduct(article: ArticleWithRelations) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - NEW_PRODUCT_WINDOW_DAYS);

  return {
    id: article.id,
    name: article.name,
    description: article.description,
    category: {
      id: article.category.id,
      name: article.category.name,
      parent: article.category.parent
        ? { id: article.category.parent.id, name: article.category.parent.name }
        : null,
    },
    condition: article.condition,
    price: article.expectedSalePrice,
    quantity: article.quantity,
    specs: article.specs,
    photos: article.photos.map((p) => ({ id: p.id, url: p.url })),
    isNew: article.createdAt >= cutoff,
    createdAt: article.createdAt,
  };
}

@Injectable()
export class StorefrontService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
  ) {}

  findCategories() {
    return this.categoriesService.findAll();
  }

  private eligibleWhere(query: QueryPublicProductsDto): Prisma.ArticleWhereInput {
    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.EN_STOCK,
      expectedSalePrice: { not: null },
      readyForPublication: true,
    };
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.isNew === 'true') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - NEW_PRODUCT_WINDOW_DAYS);
      where.createdAt = { gte: cutoff };
    }
    return where;
  }

  async findProducts(query: QueryPublicProductsDto) {
    const articles = await this.prisma.article.findMany({
      where: this.eligibleWhere(query),
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return articles.map(toPublicProduct);
  }

  async findProduct(id: string) {
    const article = await this.prisma.article.findFirst({
      where: {
        id,
        status: ArticleStatus.EN_STOCK,
        expectedSalePrice: { not: null },
        readyForPublication: true,
      },
      include: PRODUCT_INCLUDE,
    });
    if (!article) {
      throw new NotFoundException('Produit introuvable');
    }
    return toPublicProduct(article);
  }
}
