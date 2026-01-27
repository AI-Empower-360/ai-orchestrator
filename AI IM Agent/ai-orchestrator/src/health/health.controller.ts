import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.getHealth();
  }

  @Get('readiness')
  readiness() {
    return this.healthService.getReadiness();
  }

  @Get('liveness')
  liveness() {
    return this.healthService.getLiveness();
  }
}
