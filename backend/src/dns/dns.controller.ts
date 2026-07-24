import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DnsService } from './dns.service';
import { CreateDnsRecordDto } from './dto/create-dns-record.dto';
import { UpdateDnsRecordDto } from './dto/update-dns-record.dto';
import { QueryDnsRecordDto } from './dto/query-dns-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dns')
export class DnsController {
  constructor(private dnsService: DnsService) {}

  // All authenticated roles (including VIEWER) can read
  @Get()
  findAll(@Query() query: QueryDnsRecordDto) {
    return this.dnsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dnsService.findOne(id);
  }

  // Developer, Admin, Super Admin can create/update. Viewer cannot.
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DEVELOPER)
  @Post()
  create(@Body() dto: CreateDnsRecordDto, @CurrentUser('id') userId: string) {
    return this.dnsService.create(dto, userId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DEVELOPER)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDnsRecordDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.dnsService.update(id, dto, userId);
  }

  // Only Admin and Super Admin can delete
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dnsService.remove(id, userId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post('bulk-delete')
  bulkDelete(@Body('ids') ids: string[], @CurrentUser('id') userId: string) {
    return this.dnsService.bulkDelete(ids, userId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post('sync')
  sync(@CurrentUser('id') userId: string) {
    return this.dnsService.syncFromGoDaddy(userId);
  }
}
