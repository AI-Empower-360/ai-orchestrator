import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';

describe('AlertsService', () => {
  let service: AlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsService],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return alerts', () => {
    const alerts = service.getAllAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it('should acknowledge alert', () => {
    const alerts = service.getAllAlerts();
    if (alerts.length > 0) {
      const alertId = alerts[0].id;
      const result = service.acknowledgeAlert(alertId);
      expect(result).toBeDefined();
    }
  });
});
