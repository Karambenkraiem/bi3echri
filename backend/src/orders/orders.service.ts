import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ArticleStatus, MessageSender, OrderStatus, OrderType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { ClientDecisionDto } from './dto/client-decision.dto';

const RETRAIT_HOURS = 24;

function retraitDeadlineFromNow() {
  return new Date(Date.now() + RETRAIT_HOURS * 60 * 60 * 1000);
}

const ORDER_INCLUDE = {
  article: { include: { photos: { orderBy: { order: 'asc' as const }, take: 1 } } },
  client: { select: { id: true, name: true, email: true, phone: true } },
};

const PUBLIC_ORDER_INCLUDE = {
  article: {
    select: {
      id: true,
      name: true,
      expectedSalePrice: true,
      photos: { select: { id: true, url: true }, orderBy: { order: 'asc' as const }, take: 1 },
    },
  },
};

type PublicOrderRow = Prisma.OrderGetPayload<{ include: typeof PUBLIC_ORDER_INCLUDE }>;

function toPublicOrder(order: PublicOrderRow) {
  return {
    id: order.id,
    status: order.status,
    type: order.type,
    quantity: order.quantity,
    retraitDeadline: order.retraitDeadline,
    agreedPrice: order.agreedPrice,
    article: {
      id: order.article.id,
      name: order.article.name,
      price: order.article.expectedSalePrice,
      photos: order.article.photos,
    },
    createdAt: order.createdAt,
  };
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createPublic(dto: CreateOrderDto, clientId: string | null) {
    const article = await this.prisma.article.findUnique({ where: { id: dto.articleId } });
    if (!article) {
      throw new NotFoundException('Article introuvable');
    }
    if (article.status !== ArticleStatus.EN_STOCK || article.expectedSalePrice == null) {
      throw new BadRequestException("Cet article n'est pas disponible à la commande en ligne");
    }
    if (!clientId) {
      throw new BadRequestException(
        'Vous devez être inscrit et connecté pour réserver, négocier ou acheter un article',
      );
    }
    const quantity = dto.quantity ?? 1;
    if (quantity > article.quantity) {
      throw new BadRequestException('Quantité demandée supérieure au stock disponible');
    }

    const order = await this.prisma.order.create({
      data: {
        articleId: dto.articleId,
        quantity,
        type: dto.type,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        customerEmail: dto.customerEmail,
        notes: dto.notes,
        clientId: clientId ?? undefined,
      },
      include: PUBLIC_ORDER_INCLUDE,
    });
    return toPublicOrder(order);
  }

  async getPublicOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: PUBLIC_ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    return toPublicOrder(order);
  }

  findAll(query: QueryOrderDto) {
    return this.prisma.order.findMany({
      where: {
        status: query.status,
        clientId: query.clientId,
        articleId: query.articleId,
      },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    return order;
  }

  countPending() {
    return this.prisma.order.count({ where: { status: 'EN_ATTENTE' } });
  }

  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    if (dto.status === OrderStatus.VENDU) {
      throw new BadRequestException(
        'Utilisez la vente de l’article (bouton "Vendu") pour marquer une commande comme vendue',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const data: Prisma.OrderUpdateInput = { notes: dto.notes };

      if (dto.status && dto.status !== order.status) {
        data.status = dto.status;

        if (dto.status === OrderStatus.CONFIRMEE) {
          // Confirmée : le vendeur doit saisir le prix convenu avec le client.
          if (dto.agreedPrice == null) {
            throw new BadRequestException(
              'Le prix convenu avec le client est requis pour confirmer la commande',
            );
          }
          // Une seule commande confirmée à la fois par article : tant que celle-ci
          // n'est pas vendue, annulée ou expirée, on ne peut pas en confirmer une autre
          // (sinon deux commandes se disputeraient le même article "en attente de retrait").
          const conflictingOrder = await tx.order.findFirst({
            where: { articleId: order.articleId, id: { not: id }, status: OrderStatus.CONFIRMEE },
          });
          if (conflictingOrder) {
            throw new BadRequestException(
              'Cet article a déjà une commande confirmée en attente de retrait : annulez-la ou vendez-la avant d’en confirmer une autre',
            );
          }
          // L'article passe en attente de retrait (24h, renouvelable),
          // et les autres négociations en cours sur ce même article s'arrêtent.
          data.agreedPrice = dto.agreedPrice;
          data.retraitDeadline = retraitDeadlineFromNow();
          await tx.article.update({
            where: { id: order.articleId },
            data: { status: ArticleStatus.RESERVE },
          });
          await tx.order.updateMany({
            where: {
              articleId: order.articleId,
              id: { not: id },
              status: OrderStatus.EN_ATTENTE,
            },
            data: { status: OrderStatus.ANNULEE },
          });
        } else if (dto.status === OrderStatus.ANNULEE && order.status === OrderStatus.CONFIRMEE) {
          // Le client n'est pas venu, ou n'a finalement pas acheté : retour en stock
          // (sauf si l'article a déjà été vendu entre-temps par un autre chemin).
          data.retraitDeadline = null;
          data.agreedPrice = null;
          await tx.article.updateMany({
            where: { id: order.articleId, status: ArticleStatus.RESERVE },
            data: { status: ArticleStatus.EN_STOCK },
          });
        }
      }

      return tx.order.update({ where: { id }, data, include: ORDER_INCLUDE });
    });
  }

  async renew(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    if (order.status !== OrderStatus.CONFIRMEE) {
      throw new BadRequestException(
        'Seule une commande confirmée en attente de retrait peut être renouvelée',
      );
    }
    return this.prisma.order.update({
      where: { id },
      data: { retraitDeadline: retraitDeadlineFromNow() },
      include: ORDER_INCLUDE,
    });
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async expireOverdueRetraits() {
    const overdue = await this.prisma.order.findMany({
      where: { status: OrderStatus.CONFIRMEE, retraitDeadline: { lt: new Date() } },
    });
    for (const order of overdue) {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.ANNULEE, retraitDeadline: null, agreedPrice: null },
        }),
        this.prisma.article.updateMany({
          where: { id: order.articleId, status: ArticleStatus.RESERVE },
          data: { status: ArticleStatus.EN_STOCK },
        }),
      ]);
    }
  }

  async applyClientDecision(id: string, dto: ClientDecisionDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    if (order.status === OrderStatus.CONFIRMEE) {
      throw new BadRequestException('Cette commande est déjà confirmée par le vendeur');
    }
    const data =
      dto.decision === 'ACHETER'
        ? { type: OrderType.ACHAT, status: OrderStatus.EN_ATTENTE }
        : { status: OrderStatus.ANNULEE };
    const updated = await this.prisma.order.update({
      where: { id },
      data,
      include: PUBLIC_ORDER_INCLUDE,
    });
    return toPublicOrder(updated);
  }

  private async assertOrderExists(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
  }

  async getMessages(orderId: string) {
    await this.assertOrderExists(orderId);
    return this.prisma.message.findMany({
      where: { orderId },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMessage(
    orderId: string,
    sender: MessageSender,
    body: string,
    createdById?: string | null,
  ) {
    await this.assertOrderExists(orderId);
    return this.prisma.message.create({
      data: { orderId, sender, body, createdById: createdById ?? undefined },
      include: { createdBy: { select: { name: true } } },
    });
  }
}
