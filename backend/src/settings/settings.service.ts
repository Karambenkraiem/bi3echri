import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SETTINGS_ID = 1;

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private async getSettings() {
    return this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
  }

  async getDemoMode() {
    const settings = await this.getSettings();
    return { enabled: settings.demoModeEnabled };
  }

  async setDemoMode(enabled: boolean) {
    const settings = await this.prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { demoModeEnabled: enabled },
      create: { id: SETTINGS_ID, demoModeEnabled: enabled },
    });
    return { enabled: settings.demoModeEnabled };
  }
}
