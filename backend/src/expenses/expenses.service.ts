import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreasuryService } from '../treasury/treasury.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private treasuryService: TreasuryService,
  ) {}

  findAll() {
    return this.prisma.expense.findMany({
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    if (!expense) {
      throw new NotFoundException('Massrouf introuvable');
    }
    return expense;
  }

  create(dto: CreateExpenseDto, createdById: string) {
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: { amount: dto.amount, comment: dto.comment, createdById },
      });
      await this.treasuryService.recordExpense(tx, expense.id, dto.amount, createdById);
      return expense;
    });
  }

  async update(id: string, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data: { amount: dto.amount, comment: dto.comment },
      });
      const movement = await tx.cashMovement.findFirst({ where: { expenseId: id } });
      if (movement && dto.amount !== undefined) {
        await tx.cashMovement.update({
          where: { id: movement.id },
          data: { amount: -Math.abs(dto.amount) },
        });
      }
      return expense;
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.cashMovement.deleteMany({ where: { expenseId: id } });
      await tx.expense.delete({ where: { id } });
    });
    return { success: true };
  }
}
