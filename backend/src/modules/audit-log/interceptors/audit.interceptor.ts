import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuditLogService } from '../audit-log.service';

const SENSITIVE_KEYS = new Set(['senha', 'password', 'token', 'refreshToken', 'access_token', 'secret', 'apiKey', 'api_key', 'senhaAtual', 'novaSenha']);

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const result: Record<string, any> = {};
  for (const key of Object.keys(body)) {
    result[key] = SENSITIVE_KEYS.has(key) ? '[REDACTED]' : body[key];
  }
  return result;
}

function extractResourceInfo(path: string): { resourceType: string | null; resourceId: string | null } {
  const clean = path.replace(/^\/api\//, '').replace(/\?.*$/, '');
  const parts = clean.split('/').filter(Boolean);
  if (!parts.length) return { resourceType: null, resourceId: null };

  const startIdx = parts[0] === 'admin' ? 1 : 0;
  const resourceType = parts[startIdx] || null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const numericRegex = /^\d+$/;
  const resourceId = parts.slice(startIdx + 1).find(p => uuidRegex.test(p) || numericRegex.test(p)) || null;

  return { resourceType, resourceId };
}

function generateAction(method: string, resourceType: string | null): string {
  const resources: Record<string, string> = {
    receitas: 'Receita',
    produtos: 'Produto',
    usuarios: 'Usuário',
    inventario: 'Inventário',
    compras: 'Compra',
    listas: 'Lista',
    auth: 'Autenticação',
    notificacoes: 'Notificação',
    planejamento: 'Planejamento',
    'product-classification': 'Classificação',
    upload: 'Upload',
    affiliate: 'Afiliado',
  };

  const actions: Record<string, string> = {
    POST: 'Criou',
    PUT: 'Atualizou',
    PATCH: 'Atualizou',
    DELETE: 'Deletou',
    GET: 'Visualizou',
  };

  const resource = resourceType ? (resources[resourceType] || resourceType) : 'Recurso';
  const action = actions[method] || method;
  return `${action} ${resource}`;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers, body } = request;

    if (method === 'GET' || url?.includes('/audit-logs')) {
      return next.handle();
    }

    const startTime = Date.now();
    const { resourceType, resourceId } = extractResourceInfo(url || '');
    const action = generateAction(method, resourceType);
    const user = request.user;

    const logData = {
      userId: user?.id || null,
      userEmail: user?.email || null,
      userRole: user?.role || null,
      method,
      route: request.route?.path || url,
      path: (url as string)?.split('?')[0] || '',
      action,
      resourceType,
      resourceId,
      ipAddress: ((headers['x-forwarded-for'] as string)?.split(',')[0] || ip || '').trim() || null,
      userAgent: ((headers['user-agent'] as string) || '').substring(0, 500) || null,
      requestBody: body ? sanitizeBody(body) : null,
    };

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.auditLogService.save({
          ...logData,
          statusCode: response.statusCode,
          durationMs: Date.now() - startTime,
        }).catch(err => this.logger.error('Falha ao salvar audit log', err));
      }),
      catchError((err) => {
        const statusCode = err?.status || err?.statusCode || 500;
        this.auditLogService.save({
          ...logData,
          statusCode,
          durationMs: Date.now() - startTime,
        }).catch(e => this.logger.error('Falha ao salvar audit log (erro)', e));
        return throwError(() => err);
      }),
    );
  }
}
