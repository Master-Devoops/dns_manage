import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Generic audit logger. For fine-grained old/new data diffs on DNS records,
 * DnsService also writes directly via PrismaService — this interceptor
 * provides a safety-net top-level audit trail for every mutating request.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const user = req.user;
        this.prisma.auditLog
          .create({
            data: {
              userId: user?.id ?? null,
              role: user?.role ?? null,
              action: `${method} ${req.route?.path ?? req.path}`,
              oldData: undefined,
              newData: responseBody ? JSON.parse(JSON.stringify(responseBody)) : undefined,
              requestIp: req.ip,
              userAgent: req.headers['user-agent'] ?? null,
            },
          })
          .catch(() => {
            // Audit logging must never break the primary request flow
          });
      }),
    );
  }
}
