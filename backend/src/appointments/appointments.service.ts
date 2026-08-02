import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  findAll() {
    return this.prisma.appointment.findMany({
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: [{ reminderAt: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Rendez-vous introuvable');
    }
    return appointment;
  }

  create(dto: CreateAppointmentDto, createdById: string) {
    return this.prisma.appointment.create({
      data: {
        articleName: dto.articleName,
        specs: dto.specs,
        type: dto.type,
        reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : undefined,
        createdById,
      },
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);
    const reminderAt =
      dto.reminderAt === undefined ? undefined : dto.reminderAt === null ? null : new Date(dto.reminderAt);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        articleName: dto.articleName,
        specs: dto.specs,
        type: dto.type,
        reminderAt,
        // Un rendez-vous déplacé dans le futur doit pouvoir redéclencher l'alarme.
        notified: dto.reminderAt !== undefined ? false : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.appointment.delete({ where: { id } });
    return { success: true };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async fireDueReminders() {
    const due = await this.prisma.appointment.findMany({
      where: { notified: false, reminderAt: { lte: new Date() } },
    });
    for (const appointment of due) {
      await this.notificationsService.notifyUser(appointment.createdById, {
        type: NotificationType.RENDEZ_VOUS,
        title: `Rappel rendez-vous : ${appointment.articleName}`,
        message: appointment.specs ?? undefined,
        link: '/rendez-vous',
      });
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { notified: true },
      });
      this.logger.log(`Reminder fired for appointment ${appointment.id}`);
    }
  }
}
