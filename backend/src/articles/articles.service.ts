import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { existsSync, rmSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto } from './dto/query-article.dto';
import { RestockArticleDto } from './dto/restock-article.dto';
import { ARTICLES_UPLOADS_DIR, MAX_PHOTOS_PER_ARTICLE } from '../common/uploads.constants';
import { TreasuryService } from '../treasury/treasury.service';

const PHOTOS_ORDER_BY = { photos: { orderBy: { order: 'asc' as const } } };
const CATEGORY_WITH_PARENT = { category: { include: { parent: true } } };

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private treasuryService: TreasuryService,
  ) {}

  findAll(query: QueryArticleDto) {
    const where: Prisma.ArticleWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    return this.prisma.article.findMany({
      where,
      include: { ...CATEGORY_WITH_PARENT, sale: true, ...PHOTOS_ORDER_BY },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { ...CATEGORY_WITH_PARENT, sale: true, ...PHOTOS_ORDER_BY },
    });
    if (!article) {
      throw new NotFoundException('Article introuvable');
    }
    return article;
  }

  create(dto: CreateArticleDto, createdById: string) {
    if (dto.readyForPublication === false && !dto.notReadyReason?.trim()) {
      throw new BadRequestException(
        "Merci d'indiquer la raison pour laquelle l'article n'est pas encore prêt à être publié",
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          name: dto.name,
          description: dto.description,
          categoryId: dto.categoryId,
          condition: dto.condition,
          purchasePrice: dto.purchasePrice,
          purchaseDate: new Date(dto.purchaseDate),
          purchaseSource: dto.purchaseSource,
          expectedSalePrice: dto.expectedSalePrice,
          floorPrice: dto.floorPrice,
          quantity: dto.quantity,
          specs: dto.specs as Prisma.InputJsonValue,
          readyForPublication: dto.readyForPublication ?? true,
          notReadyReason: dto.readyForPublication === false ? dto.notReadyReason : undefined,
          createdById,
        },
        include: { category: true },
      });
      const totalCost = dto.purchasePrice * (dto.quantity ?? 1);
      await this.treasuryService.recordPurchase(tx, article.id, totalCost, createdById);
      return article;
    });
  }

  async update(id: string, dto: UpdateArticleDto) {
    await this.findOne(id);
    if (dto.readyForPublication === false && !dto.notReadyReason?.trim()) {
      throw new BadRequestException(
        "Merci d'indiquer la raison pour laquelle l'article n'est pas encore prêt à être publié",
      );
    }
    const data: Prisma.ArticleUpdateInput = { ...dto };
    if (dto.purchaseDate) {
      data.purchaseDate = new Date(dto.purchaseDate);
    }
    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
      delete (data as Record<string, unknown>).categoryId;
    }
    if (dto.readyForPublication === true) {
      data.notReadyReason = null;
    }
    return this.prisma.article.update({ where: { id }, data, include: { category: true } });
  }

  async publish(id: string) {
    await this.findOne(id);
    return this.prisma.article.update({
      where: { id },
      data: { readyForPublication: true, notReadyReason: null },
      include: { category: true },
    });
  }

  async restock(id: string, dto: RestockArticleDto, createdById: string) {
    const article = await this.findOne(id);
    if (article.status === ArticleStatus.VENDU) {
      throw new BadRequestException('Impossible de réapprovisionner un article déjà vendu');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.article.update({
        where: { id },
        data: { quantity: article.quantity + dto.quantity },
        include: { category: true },
      });
      if (dto.cost) {
        await this.treasuryService.recordPurchase(tx, id, dto.cost, createdById);
      }
      return updated;
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.article.delete({ where: { id } });
    const dir = join(ARTICLES_UPLOADS_DIR, id);
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
    return { success: true };
  }

  async addPhotos(articleId: string, files: Express.Multer.File[]) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { photos: true },
    });
    if (!article) {
      throw new NotFoundException('Article introuvable');
    }
    if (article.photos.length + files.length > MAX_PHOTOS_PER_ARTICLE) {
      throw new BadRequestException(
        `Maximum ${MAX_PHOTOS_PER_ARTICLE} photos par article (${article.photos.length} déjà présentes)`,
      );
    }

    const startOrder = article.photos.reduce((max, p) => Math.max(max, p.order), -1) + 1;
    await this.prisma.photo.createMany({
      data: files.map((file, index) => ({
        articleId,
        url: `/uploads/articles/${articleId}/${file.filename}`,
        order: startOrder + index,
      })),
    });

    return this.prisma.photo.findMany({ where: { articleId }, orderBy: { order: 'asc' } });
  }

  async removePhoto(articleId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo || photo.articleId !== articleId) {
      throw new NotFoundException('Photo introuvable');
    }
    await this.prisma.photo.delete({ where: { id: photoId } });
    const filePath = join(process.cwd(), photo.url.replace(/^\//, ''));
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    return { success: true };
  }
}
