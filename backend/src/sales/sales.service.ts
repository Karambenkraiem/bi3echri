import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, NotificationType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { TreasuryService } from '../treasury/treasury.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private treasuryService: TreasuryService,
    private notificationsService: NotificationsService,
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

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        article: { include: { category: true, photos: { orderBy: { order: 'asc' }, take: 1 } } },
        soldBy: { select: { id: true, name: true } },
      },
    });
    if (!sale) {
      throw new NotFoundException('Vente introuvable');
    }
    return sale;
  }

  async sellArticle(articleId: string, dto: CreateSaleDto, soldById: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException('Article introuvable');
    }
    if (article.status === ArticleStatus.VENDU) {
      throw new BadRequestException('Cet article a déjà été vendu');
    }

    let order: { id: string; articleId: string } | null = null;
    if (dto.orderId) {
      order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { id: true, articleId: true },
      });
      if (!order || order.articleId !== articleId) {
        throw new BadRequestException("Cette commande ne correspond pas à cet article");
      }
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
      if (order) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.VENDU, retraitDeadline: null },
        });
      }
      await this.treasuryService.recordSale(tx, sale.id, dto.salePrice, soldById, article.name);
      return sale;
    }).then(async (sale) => {
      await this.notificationsService.broadcast({
        type: NotificationType.VENTE_ARTICLE,
        title: `Vente : ${article.name}`,
        message: `${dto.salePrice.toFixed(3)} DT`,
        link: `/articles/${articleId}`,
        createdById: soldById,
      });
      return sale;
    });
  }

  async updateSale(saleId: string, dto: UpdateSaleDto) {
    const sale = await this.prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      throw new NotFoundException('Vente introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.sale.update({
        where: { id: saleId },
        data: {
          salePrice: dto.salePrice,
          saleDate: dto.saleDate ? new Date(dto.saleDate) : undefined,
          buyerName: dto.buyerName,
          buyerContact: dto.buyerContact,
          adChannel: dto.adChannel,
          notes: dto.notes,
        },
        include: { article: { include: { category: true } }, soldBy: { select: { id: true, name: true } } },
      });
      // Si le prix a changé, le mouvement de trésorerie associé doit rester cohérent
      // avec la vente (sinon la Canaouite diverge silencieusement du prix affiché).
      if (dto.salePrice != null && Number(dto.salePrice) !== Number(sale.salePrice)) {
        await tx.cashMovement.updateMany({
          where: { saleId, type: 'SALE' },
          data: { amount: Math.abs(dto.salePrice) },
        });
      }
      return updated;
    });
  }

  async cancelSale(saleId: string, dto: CancelSaleDto, userId: string) {
    const sale = await this.prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      throw new NotFoundException('Vente introuvable');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: sale.articleId },
        data: { status: ArticleStatus.EN_STOCK },
      });
      // Le client a fait un retour : la commande liée (si elle existe encore) ne
      // doit plus apparaître comme vendue.
      await tx.order.updateMany({
        where: { articleId: sale.articleId, status: OrderStatus.VENDU },
        data: { status: OrderStatus.ANNULEE },
      });
      await this.treasuryService.recordReturn(
        tx,
        sale.id,
        Number(sale.salePrice),
        userId,
        dto.reason,
      );
      await tx.sale.delete({ where: { id: saleId } });
      return { success: true };
    });
  }
}
