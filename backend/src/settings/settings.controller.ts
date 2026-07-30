import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateDemoModeDto } from './dto/update-demo-mode.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Public()
  @Get('demo-mode')
  getDemoMode() {
    return this.settingsService.getDemoMode();
  }

  @Patch('demo-mode')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  setDemoMode(@Body() dto: UpdateDemoModeDto) {
    return this.settingsService.setDemoMode(dto.enabled);
  }
}
