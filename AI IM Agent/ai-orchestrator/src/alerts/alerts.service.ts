import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertDto, AlertsResponseDto, AcknowledgeAlertResponseDto } from '../common/dto/alert.dto';
import { v4 as uuidv4 } from 'uuid';

// Mock alerts storage (replace with real database)
const alerts: Map<string, AlertDto> = new Map();

@Injectable()
export class AlertsService {
  constructor() {
    // Initialize with some mock alerts
    this.createMockAlerts();
  }

  private createMockAlerts() {
    const mockAlerts: AlertDto[] = [
      {
        id: uuidv4(),
        severity: 'info',
        message: 'System initialized successfully',
        timestamp: new Date().toISOString(),
        acknowledged: false,
      },
      {
        id: uuidv4(),
        severity: 'warning',
        message: 'High patient volume detected',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: false,
      },
    ];

    mockAlerts.forEach((alert) => alerts.set(alert.id, alert));
  }

  async getAlerts(): Promise<AlertsResponseDto> {
    return {
      alerts: Array.from(alerts.values()),
    };
  }

  async acknowledgeAlert(alertId: string): Promise<AcknowledgeAlertResponseDto> {
    const alert = alerts.get(alertId);
    if (!alert) {
      throw new NotFoundException(`Alert with ID ${alertId} not found`);
    }

    alert.acknowledged = true;
    alerts.set(alertId, alert);

    return { success: true };
  }

  // Internal method for WebSocket alerts
  createAlert(severity: 'info' | 'warning' | 'critical', message: string): AlertDto {
    const alert: AlertDto = {
      id: uuidv4(),
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    alerts.set(alert.id, alert);
    return alert;
  }
}
