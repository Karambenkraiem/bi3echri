import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CashMovementType, NotificationType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustTreasuryDto } from './dto/adjust-treasury.dto';
import { InvestTreasuryDto } from './dto/invest-treasury.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';

const EDITABLE_TYPES: CashMovementType[] = [CashMovementType.MANUAL, CashMovementType.INVESTMENT];

@Injectable()
export class TreasuryService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getBalance() {
    const result = await this.prisma.cashMovement.aggregate({ _sum: { amount: true } });
    return { balance: Number(result._sum.amount ?? 0) };
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
  ) {
    return tx.cashMovement.create({
      data: {
        type: CashMovementType.PURCHASE,
        amount: -Math.abs(amount),
        articleId,
        createdById,
      },
    });
  }

  recordSale(tx: Prisma.TransactionClient, saleId: string, amount: number, createdById: string) {
    return tx.cashMovement.create({
      data: {
        type: CashMovementType.SALE,
        amount: Math.abs(amount),
        saleId,
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
  ) {
    return tx.cashMovement.create({
      data: {
        type: CashMovementType.EXPENSE,
        amount: -Math.abs(amount),
        expenseId,
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
