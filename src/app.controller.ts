import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { HealthStatus } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /api  -> simple health check
  @Get()
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
