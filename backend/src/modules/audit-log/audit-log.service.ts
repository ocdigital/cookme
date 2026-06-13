import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

interface SaveAuditLogData {
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  method: string;
  route: string;
  path: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  statusCode: number;
  durationMs: number;
  ipAddress: string | null;
  userAgent: string | null;
  requestBody: Record<string, any> | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async save(data: SaveAuditLogData): Promise<void> {
    const log = this.repo.create({
      user_id: data.userId,
      user_email: data.userEmail,
      user_role: data.userRole,
      method: data.method,
      route: data.route,
      path: data.path,
      action: data.action,
      resource_type: data.resourceType,
      resource_id: data.resourceId,
      status_code: data.statusCode,
      duration_ms: data.durationMs,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      request_body: data.requestBody,
    });
    await this.repo.save(log);
  }

  async findAll(query: QueryAuditLogDto) {
    const { page = 1, limit = 30, user_email, user_id, resource_type, method, from_date, to_date, status_class } = query;

    const qb = this.repo
      .createQueryBuilder('al')
      .orderBy('al.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (user_email) {
      qb.andWhere('al.user_email ILIKE :email', { email: `%${user_email}%` });
    }
    if (user_id) {
      qb.andWhere('al.user_id = :userId', { userId: user_id });
    }
    if (resource_type) {
      qb.andWhere('al.resource_type = :resourceType', { resourceType: resource_type });
    }
    if (method) {
      qb.andWhere('al.method = :method', { method });
    }
    if (from_date) {
      qb.andWhere('al.created_at >= :from', { from: new Date(from_date) });
    }
    if (to_date) {
      const end = new Date(to_date);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('al.created_at <= :to', { to: end });
    }
    if (status_class) {
      const ranges: Record<string, [number, number]> = {
        '2xx': [200, 299],
        '4xx': [400, 499],
        '5xx': [500, 599],
      };
      const [min, max] = ranges[status_class];
      qb.andWhere('al.status_code BETWEEN :min AND :max', { min, max });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    const [total, todayMutations, errors] = await Promise.all([
      this.repo.count(),
      this.repo.count({ where: { created_at: Between(today, now) } }),
      this.repo
        .createQueryBuilder('al')
        .where('al.status_code >= 400')
        .andWhere('al.created_at >= :today', { today })
        .getCount(),
    ]);

    return { total, todayMutations, errors };
  }
}
