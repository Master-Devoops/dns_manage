import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface LogInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  message: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async log(input: LogInput) {
    return this.prisma.activityLog.create({ data: input });
  }

  async findAll(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, email: true, role: true } } },
      }),
      this.prisma.activityLog.count(),
    ]);

    return { items, total, page, limit };
  }
}
