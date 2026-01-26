export class AlertDto {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export class AlertsResponseDto {
  alerts: AlertDto[];
}

export class AcknowledgeAlertResponseDto {
  success: boolean;
}
