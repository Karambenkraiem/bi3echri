import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { TreasuryService } from '../treasury/treasury.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private treasuryService: TreasuryService,
  ) {}

  findAll() {
    return this.prisma.sale.findMany({
      include: {
        article: { include: { category: true } },
        soldBy: { select: { id: true, name: true } },
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async sellArticle(articleId: string, dto: CreateSaleDto, soldById: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException('Article introuvable');
    }
    if (article.status === ArticleStatus.VENDU) {
      throw new BadRequestException('Cet article a déjà été vendu');
    }

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          articleId,
          salePrice: dto.salePrice,
          saleDate: dto.saleDate ? new Date(dto.saleDate) : new Date(),
          buyerName: dto.buyerName,
          buyerContact: dto.buyerContact,
          adChannel: dto.adChannel,
          notes: dto.notes,
          soldById,
        },
      });
      await tx.article.update({
        where: { id: articleId },
        data: { status: ArticleStatus.VENDU },
      });
      await this.treasuryService.recordSale(tx, sale.id, dto.salePrice, soldById);
      return sale;
    });
  }
}
