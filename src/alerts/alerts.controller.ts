import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import {
  AlertsResponseDto,
  AcknowledgeAlertResponseDto,
} from '../common/dto/alert.dto';
import { SimpleJwtGuard } from '../auth/simple-jwt.guard';

@Controller('api/alerts')
@UseGuards(SimpleJwtGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async getAlerts(): Promise<AlertsResponseDto> {
    return this.alertsService.getAlerts();
  }

  @Post(':alertId/acknowledge')
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
  ): Promise<AcknowledgeAlertResponseDto> {
    return this.alertsService.acknowledgeAlert(alertId);
  }
}
