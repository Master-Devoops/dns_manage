import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { GoDaddyService } from './godaddy/godaddy.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateDnsRecordDto } from './dto/create-dns-record.dto';
import { UpdateDnsRecordDto } from './dto/update-dns-record.dto';
import { QueryDnsRecordDto } from './dto/query-dns-record.dto';

@Injectable()
export class DnsService {
  private domain: string;

  constructor(
    private prisma: PrismaService,
    private godaddy: GoDaddyService,
    private activityLogs: ActivityLogsService,
    private config: ConfigService,
  ) {
    this.domain = this.config.get<string>('GO_DADDY_DOMAIN') || 'devoops.in';
  }

  async findAll(query: QueryDnsRecordDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { subdomain: { contains: query.search, mode: 'insensitive' } },
        { data: { contains: query.search, mode: 'insensitive' } },
        { comment: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.dnsRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dnsRecord.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const record = await this.prisma.dnsRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('DNS record not found');
    return record;
  }

  async create(dto: CreateDnsRecordDto, userId: string) {
    const existing = await this.prisma.dnsRecord.findFirst({
      where: { subdomain: dto.subdomain, type: dto.type, domain: this.domain },
    });
    if (existing) {
      throw new ConflictException(
        `A ${dto.type} record for "${dto.subdomain}.${this.domain}" already exists`,
      );
    }

    // Push to GoDaddy first — if it fails, we don't want a local record that
    // doesn't reflect reality.
    await this.godaddy.createRecord({
      type: dto.type,
      name: dto.subdomain,
      data: dto.data,
      ttl: dto.ttl,
      priority: dto.priority,
    });

    const record = await this.prisma.dnsRecord.create({
      data: {
        domain: this.domain,
        subdomain: dto.subdomain,
        type: dto.type,
        data: dto.data,
        ttl: dto.ttl,
        priority: dto.priority,
        comment: dto.comment,
        godaddySynced: true,
        createdById: userId,
        updatedById: userId,
      },
    });

    await this.activityLogs.log({
      userId,
      action: 'CREATED',
      entity: 'DNS_RECORD',
      entityId: record.id,
      message: `Created ${record.type} record ${record.subdomain}.${this.domain}`,
    });

    return record;
  }

  async update(id: string, dto: UpdateDnsRecordDto, userId: string) {
    const existing = await this.findOne(id);
    const oldData = { ...existing };

    const merged = { ...existing, ...dto };

    await this.godaddy.updateRecord(merged.type, merged.subdomain, [
      {
        type: merged.type,
        name: merged.subdomain,
        data: merged.data,
        ttl: merged.ttl,
        priority: merged.priority ?? undefined,
      },
    ]);

    const record = await this.prisma.dnsRecord.update({
      where: { id },
      data: {
        data: dto.data ?? existing.data,
        ttl: dto.ttl ?? existing.ttl,
        priority: dto.priority ?? existing.priority,
        comment: dto.comment ?? existing.comment,
        godaddySynced: true,
        updatedById: userId,
      },
    });

    await this.activityLogs.log({
      userId,
      action: 'UPDATED',
      entity: 'DNS_RECORD',
      entityId: record.id,
      message: `Updated ${record.type} record ${record.subdomain}.${this.domain}`,
    });

    return { record, oldData };
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id);

    await this.godaddy.deleteRecord(existing.type, existing.subdomain);

    await this.prisma.dnsRecord.delete({ where: { id } });

    await this.activityLogs.log({
      userId,
      action: 'DELETED',
      entity: 'DNS_RECORD',
      entityId: id,
      message: `Deleted ${existing.type} record ${existing.subdomain}.${this.domain}`,
    });

    return { message: 'Record deleted successfully' };
  }

  async bulkDelete(ids: string[], userId: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.remove(id, userId);
        results.push({ id, success: true });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Pulls the current live record set from GoDaddy and reconciles it with
   * our local database, marking anything out of sync.
   */
  async syncFromGoDaddy(userId: string) {
    const liveRecords = await this.godaddy.listAllRecords();

    let created = 0;
    let updated = 0;

    for (const live of liveRecords) {
      const existing = await this.prisma.dnsRecord.findFirst({
        where: { subdomain: live.name, type: live.type as any, domain: this.domain },
      });

      if (!existing) {
        await this.prisma.dnsRecord.create({
          data: {
            domain: this.domain,
            subdomain: live.name,
            type: live.type as any,
            data: live.data,
            ttl: live.ttl,
            priority: live.priority,
            godaddySynced: true,
          },
        });
        created++;
      } else if (existing.data !== live.data || existing.ttl !== live.ttl) {
        await this.prisma.dnsRecord.update({
          where: { id: existing.id },
          data: { data: live.data, ttl: live.ttl, godaddySynced: true },
        });
        updated++;
      }
    }

    await this.activityLogs.log({
      userId,
      action: 'SYNCED',
      entity: 'DNS_RECORD',
      message: `Synced with GoDaddy: ${created} created, ${updated} updated`,
    });

    return { created, updated, total: liveRecords.length };
  }

  async getDashboardStats() {
    const [total, aRecords, cnameRecords, users, lastSync] = await Promise.all([
      this.prisma.dnsRecord.count(),
      this.prisma.dnsRecord.count({ where: { type: 'A' } }),
      this.prisma.dnsRecord.count({ where: { type: 'CNAME' } }),
      this.prisma.user.count(),
      this.prisma.activityLog.findFirst({
        where: { action: 'SYNCED' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const apiHealthy = await this.godaddy.checkHealth();

    return {
      totalRecords: total,
      totalARecords: aRecords,
      totalCnameRecords: cnameRecords,
      totalUsers: users,
      apiStatus: apiHealthy ? 'operational' : 'down',
      lastSync: lastSync?.createdAt ?? null,
    };
  }
}
