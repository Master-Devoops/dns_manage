import { Controller, Get, UseGuards } from '@nestjs/common';
import { DnsService } from './dns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dnsService: DnsService) {}

  @Get()
  getStats() {
    return this.dnsService.getDashboardStats();
  }
}
