import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CashMovementType, NotificationType, PaymentMethod, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustTreasuryDto } from './dto/adjust-treasury.dto';
import { InvestTreasuryDto } from './dto/invest-treasury.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';

const EDITABLE_TYPES: CashMovementType[] = [CashMovementType.MANUAL, CashMovementType.INVESTMENT];

type Granularity = 'day' | 'week' | 'month';

export interface BalanceOverTimeRow {
  period: string;
  balance: number;
}

@Injectable()
export class TreasuryService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getBalance() {
    // La Canaouite représente la caisse physique : seuls les mouvements en
    // espèces l'affectent (virement/chèque ne transitent pas par la caisse).
    const result = await this.prisma.cashMovement.aggregate({
      where: { paymentMethod: PaymentMethod.CASH },
      _sum: { amount: true },
    });
    return { balance: Number(result._sum.amount ?? 0) };
  }

  async getBalanceByMethod() {
    const rows = await this.prisma.cashMovement.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true },
    });
    const totals: Record<PaymentMethod, number> = { CASH: 0, VIREMENT: 0, CHEQUE: 0 };
    for (const row of rows) {
      totals[row.paymentMethod] = Number(row._sum.amount ?? 0);
    }
    return totals;
  }

  async getTotalBalance() {
    // Toutes modalités confondues (contrairement à getBalance() qui ne
    // reflète que le cash physique de la caisse).
    const result = await this.prisma.cashMovement.aggregate({ _sum: { amount: true } });
    return { balance: Number(result._sum.amount ?? 0) };
  }

  async balanceOverTime(granularity: Granularity, from?: string, to?: string) {
    // date_trunc()'s unit can't be bound as a query parameter here: Postgres
    // won't recognize the GROUP BY expression as matching the SELECT/ORDER BY
    // ones when it's a bind parameter (fails with "must appear in GROUP BY"
    // even though the text is identical). Safe to inline directly since
    // `granularity` is restricted to this fixed 3-value union, validated
    // against an enum in the DTO before this method is ever called.
    const format = granularity === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';

    // The running balance always accumulates over ALL history first (inner
    // query), and from/to only trim which points get displayed afterwards —
    // otherwise picking a date range would restart the sum from zero instead
    // of showing the real balance at each point ("zooming in", not "since").
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (from) {
      params.push(new Date(from));
      conditions.push(`bucket >= $${params.length}`);
    }
    if (to) {
      params.push(new Date(to));
      conditions.push(`bucket <= $${params.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return this.prisma.$queryRawUnsafe<BalanceOverTimeRow[]>(
      `
      SELECT period, balance FROM (
        SELECT
          to_char(bucket, '${format}') as period,
          bucket,
          SUM(amt) OVER (ORDER BY bucket)::float as balance
        FROM (
          SELECT date_trunc('${granularity}', "createdAt") as bucket, SUM(amount) as amt
          FROM cash_movements
          GROUP BY bucket
        ) totals
      ) windowed
      ${whereClause}
      ORDER BY bucket ASC
      `,
      ...params,
    );
  }

  history() {
    return this.prisma.cashMovement.findMany({
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  recordPurchase(
    tx: Prisma.TransactionClient,
    articleId: string,
    amount: number,
    createdById: string,
    comment?: string,
  ) {
    return tx.cashMovement.create({
      data: {
        type: CashMovementType.PURCHASE,
        amount: -Math.abs(amount),
        articleId,
        comment,
        createdById,
      },
    });
  }

  recordSale(
    tx: Prisma.TransactionClient,
    saleId: string,
    amount: number,
    createdById: string,
    comment?: string,
    paymentMethod?: PaymentMethod,
  ) {
    return tx.cashMovement.create({
      data: {
        type: CashMovementType.SALE,
        amount: Math.abs(amount),
        saleId,
        comment,
        paymentMethod,
        createdById,
      },
    });
  }

  recordReturn(
    tx: Prisma.TransactionClient,
    saleId: string,
    amount: number,
    createdById: string,
    reason: string,
  ) {
    return tx.cashMovement.create({
      data: {
        type: CashMovementType.RETOUR,
        amount: -Math.abs(amount),
        saleId,
        comment: reason,
        createdById,
      },
    });
  }

  recordExpense(
    tx: Prisma.TransactionClient,
    expenseId: string,
    amount: number,
    createdById: string,
    comment?: string,
  ) {
    return tx.cashMovement.create({
      data: {
        type: CashMovementType.EXPENSE,
        amount: -Math.abs(amount),
        expenseId,
        comment,
        createdById,
      },
    });
  }

  async manualAdjust(dto: AdjustTreasuryDto, createdById: string) {
    await this.prisma.cashMovement.create({
      data: {
        type: CashMovementType.MANUAL,
        amount: dto.amount,
        comment: dto.comment,
        paymentMethod: dto.paymentMethod,
        createdById,
      },
    });
    await this.notificationsService.broadcast({
      type: NotificationType.CANAOUITE,
      title: `Ajustement Canaouite : ${dto.amount.toFixed(3)} DT`,
      message: dto.comment,
      link: '/canaouite',
      createdById,
    });
    return this.getBalance();
  }

  async invest(dto: InvestTreasuryDto, createdById: string) {
    await this.prisma.cashMovement.create({
      data: {
        type: CashMovementType.INVESTMENT,
        amount: Math.abs(dto.amount),
        comment: dto.comment,
        createdById,
      },
    });
    await this.notificationsService.broadcast({
      type: NotificationType.CANAOUITE,
      title: `Alimentation Canaouite : ${Math.abs(dto.amount).toFixed(3)} DT`,
      message: dto.comment,
      link: '/canaouite',
      createdById,
    });
    return this.getBalance();
  }

  private async findEditableMovement(id: string, user: AuthenticatedUser) {
    const movement = await this.prisma.cashMovement.findUnique({ where: { id } });
    if (!movement) {
      throw new NotFoundException('Mouvement introuvable');
    }
    if (!EDITABLE_TYPES.includes(movement.type)) {
      throw new BadRequestException(
        'Seuls les ajustements et les alimentations peuvent être modifiés ou supprimés',
      );
    }
    if (user.role !== Role.ADMIN) {
      const requiredRole = movement.type === CashMovementType.INVESTMENT ? Role.ADMIN : Role.VENDEUR;
      if (user.role !== requiredRole) {
        throw new ForbiddenException(
          requiredRole === Role.ADMIN
            ? 'Seul un admin peut modifier une alimentation'
            : 'Seul un vendeur peut modifier un ajustement',
        );
      }
    }
    return movement;
  }

  async updateMovement(id: string, dto: UpdateMovementDto, user: AuthenticatedUser) {
    const movement = await this.findEditableMovement(id, user);
    let amount = dto.amount ?? Number(movement.amount);
    if (movement.type === CashMovementType.INVESTMENT) {
      amount = Math.abs(amount);
    }
    return this.prisma.cashMovement.update({
      where: { id },
      data: { amount, comment: dto.comment ?? movement.comment },
    });
  }

  async removeMovement(id: string, user: AuthenticatedUser) {
    await this.findEditableMovement(id, user);
    await this.prisma.cashMovement.delete({ where: { id } });
    return { success: true };
  }

  async updateComment(id: string, comment: string) {
    const movement = await this.prisma.cashMovement.findUnique({ where: { id } });
    if (!movement) {
      throw new NotFoundException('Mouvement introuvable');
    }
    // Le commentaire d'un mouvement peut toujours être corrigé, quel que soit son
    // type (achat, vente, dépense...), contrairement au montant qui reste réservé
    // aux ajustements/alimentations pour ne pas fausser la Canaouite.
    return this.prisma.cashMovement.update({
      where: { id },
      data: { comment: comment || null },
    });
  }
}
