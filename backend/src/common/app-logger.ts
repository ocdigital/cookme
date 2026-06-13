import { ConsoleLogger } from '@nestjs/common';
import { pushLog } from './log-buffer.singleton';

export class AppLogger extends ConsoleLogger {
  log(message: any, context?: string) {
    pushLog('log', String(message), context ?? this.context ?? '');
    super.log(message, context);
  }

  error(message: any, stack?: string, context?: string) {
    const full = stack ? `${message}\n${stack}` : String(message);
    pushLog('error', full, context ?? this.context ?? '');
    super.error(message, stack, context);
  }

  warn(message: any, context?: string) {
    pushLog('warn', String(message), context ?? this.context ?? '');
    super.warn(message, context);
  }

  debug(message: any, context?: string) {
    pushLog('debug', String(message), context ?? this.context ?? '');
    super.debug(message, context);
  }

  verbose(message: any, context?: string) {
    pushLog('verbose', String(message), context ?? this.context ?? '');
    super.verbose(message, context);
  }
}
