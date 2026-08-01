import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ChangeClientPasswordDto } from './dto/change-client-password.dto';

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  avatarUrl: true,
  createdAt: true,
};

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async issueToken(client: { id: string; email: string | null }) {
    const payload = { sub: client.id, email: client.email };
    return this.jwtService.signAsync(payload);
  }

  async register(dto: RegisterClientDto) {
    const existing = await this.prisma.client.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const client = await this.prisma.client.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, password: passwordHash },
      select: SAFE_SELECT,
    });
    const accessToken = await this.issueToken(client);
    return { accessToken, client };
  }

  async login(dto: LoginClientDto) {
    const client = await this.prisma.client.findUnique({ where: { email: dto.email } });
    if (!client || !client.password) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const matches = await bcrypt.compare(dto.password, client.password);
    if (!matches) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    const accessToken = await this.issueToken(client);
    const { password: _password, ...safeClient } = client;
    return { accessToken, client: safeClient };
  }

  async me(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: SAFE_SELECT,
    });
    if (!client) {
      throw new NotFoundException('Compte introuvable');
    }
    return client;
  }

  async updateProfile(clientId: string, dto: UpdateClientProfileDto) {
    await this.me(clientId);
    return this.prisma.client.update({
      where: { id: clientId },
      data: dto,
      select: SAFE_SELECT,
    });
  }

  async changePassword(clientId: string, dto: ChangeClientPasswordDto) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client || !client.password) {
      throw new NotFoundException('Compte introuvable');
    }
    const matches = await bcrypt.compare(dto.currentPassword, client.password);
    if (!matches) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.client.update({ where: { id: clientId }, data: { password: passwordHash } });
    return { success: true };
  }

  async updateAvatar(clientId: string, avatarUrl: string) {
    const client = await this.me(clientId);
    if (client.avatarUrl) {
      const oldPath = join(process.cwd(), client.avatarUrl.replace(/^\//, ''));
      if (existsSync(oldPath)) {
        unlinkSync(oldPath);
      }
    }
    return this.prisma.client.update({
      where: { id: clientId },
      data: { avatarUrl },
      select: SAFE_SELECT,
    });
  }

  findAllForStaff() {
    return this.prisma.client.findMany({
      select: { ...SAFE_SELECT, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForStaff(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { ...SAFE_SELECT, _count: { select: { orders: true } } },
    });
    if (!client) {
      throw new NotFoundException('Client introuvable');
    }
    return client;
  }

  async myOrders(clientId: string) {
    const orders = await this.prisma.order.findMany({
      where: { clientId },
      include: {
        article: {
          select: {
            id: true,
            name: true,
            expectedSalePrice: true,
            photos: { select: { id: true, url: true }, orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => ({
      id: order.id,
      status: order.status,
      type: order.type,
      quantity: order.quantity,
      notes: order.notes,
      createdAt: order.createdAt,
      article: {
        id: order.article.id,
        name: order.article.name,
        price: order.article.expectedSalePrice,
        photos: order.article.photos,
      },
    }));
  }
}
