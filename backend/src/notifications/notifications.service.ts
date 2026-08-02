import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface NotifyInput {
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  createdById?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** Visible to every staff member (no targetUserId). */
  broadcast(input: NotifyInput) {
    return this.prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        createdById: input.createdById,
      },
    });
  }

  /** Visible only to the given user (e.g. a personal appointment reminder). */
  notifyUser(userId: string, input: NotifyInput) {
    return this.prisma.notification.create({
      data: {
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        createdById: input.createdById,
        targetUserId: userId,
      },
    });
  }

  findForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { OR: [{ targetUserId: null }, { targetUserId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
