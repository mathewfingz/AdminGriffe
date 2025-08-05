import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('Observability')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get Prometheus metrics',
    description: 'Returns all system metrics in Prometheus format for scraping'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Prometheus metrics data',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example: `# HELP audit_write_tps_total Total number of audit records written per second
# TYPE audit_write_tps_total counter
audit_write_tps_total{database="postgres",table="users",operation="INSERT"} 1250

# HELP sync_lag_ms Synchronization lag in milliseconds between source and destination
# TYPE sync_lag_ms gauge
sync_lag_ms{source_db="postgres",target_db="mongodb",table="users"} 45`
        }
      }
    }
  })
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }

  @Get('health')
  @ApiOperation({ 
    summary: 'Metrics service health check',
    description: 'Check if metrics collection is working properly'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Metrics service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        metricsCount: { type: 'number', example: 42 }
      }
    }
  })
  async getHealth(): Promise<{ status: string; timestamp: string; metricsCount: number }> {
    const metrics = await this.metricsService.getMetrics();
    const metricsCount = metrics.split('\n').filter(line => 
      line.startsWith('#') === false && line.trim() !== ''
    ).length;

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metricsCount
    };
  }
}