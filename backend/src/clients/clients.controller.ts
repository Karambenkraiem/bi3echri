import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientsService } from './clients.service';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginClientDto } from './dto/login-client.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ChangeClientPasswordDto } from './dto/change-client-password.dto';
import { Public } from '../auth/decorators/public.decorator';
import { ClientAuthGuard } from './guards/client-auth.guard';
import { CurrentClient } from './decorators/current-client.decorator';
import type { AuthenticatedClient } from './strategies/client-jwt.strategy';
import { clientAvatarUploadOptions } from './multer-avatar.config';

@Controller('public/clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterClientDto) {
    return this.clientsService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginClientDto) {
    return this.clientsService.login(dto);
  }

  @Public()
  @UseGuards(ClientAuthGuard)
  @Get('me')
  me(@CurrentClient() client: AuthenticatedClient) {
    return this.clientsService.me(client.clientId);
  }

  @Public()
  @UseGuards(ClientAuthGuard)
  @Patch('me')
  updateMe(@CurrentClient() client: AuthenticatedClient, @Body() dto: UpdateClientProfileDto) {
    return this.clientsService.updateProfile(client.clientId, dto);
  }

  @Public()
  @UseGuards(ClientAuthGuard)
  @Patch('me/password')
  changePassword(
    @CurrentClient() client: AuthenticatedClient,
    @Body() dto: ChangeClientPasswordDto,
  ) {
    return this.clientsService.changePassword(client.clientId, dto);
  }

  @Public()
  @UseGuards(ClientAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', clientAvatarUploadOptions))
  uploadAvatar(
    @CurrentClient() client: AuthenticatedClient,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = `/uploads/avatars/${client.clientId}/${file.filename}`;
    return this.clientsService.updateAvatar(client.clientId, avatarUrl);
  }

  @Public()
  @UseGuards(ClientAuthGuard)
  @Get('me/orders')
  myOrders(@CurrentClient() client: AuthenticatedClient) {
    return this.clientsService.myOrders(client.clientId);
  }
}
