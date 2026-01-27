import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version?: string;
  environment?: string;
}

export interface ReadinessStatus {
  ready: boolean;
  timestamp: string;
  checks: {
    application: boolean;
    [key: string]: boolean;
  };
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  getHealth(): HealthStatus {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '0.1.1',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getReadiness(): ReadinessStatus {
    // Check if application is ready to serve traffic
    const applicationReady = true; // Application is ready if it's running

    // Add additional readiness checks here
    // For example: database connection, external services, etc.

    return {
      ready: applicationReady,
      timestamp: new Date().toISOString(),
      checks: {
        application: applicationReady,
      },
    };
  }

  getLiveness(): HealthStatus {
    // Liveness check - is the application alive?
    // This should be lightweight and always return ok if the process is running
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
