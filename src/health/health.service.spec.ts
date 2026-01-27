import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health status', () => {
    const health = service.getHealth();
    expect(health).toHaveProperty('status');
    expect(health.status).toBe('ok');
  });

  it('should return timestamp', () => {
    const health = service.getHealth();
    expect(health).toHaveProperty('timestamp');
    // Timestamp is ISO string
    expect(typeof health.timestamp).toBe('string');
    expect(health.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
