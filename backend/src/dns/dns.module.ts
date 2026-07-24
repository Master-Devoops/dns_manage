import { Module } from '@nestjs/common';
import { DnsService } from './dns.service';
import { DnsController } from './dns.controller';
import { DashboardController } from './dashboard.controller';
import { GoDaddyService } from './godaddy/godaddy.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [DnsController, DashboardController],
  providers: [DnsService, GoDaddyService],
})
export class DnsModule {}
