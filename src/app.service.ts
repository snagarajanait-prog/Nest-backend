import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  service: string;
  environment: string;
  timestamp: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: 'nest-app-backend',
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
