import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { debugLog } from '../common/debug-logger';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    console.log('[JWT Guard] handleRequest called:', { hasError: !!err, hasUser: !!user, info: info?.message || info });
    // #region agent log
    debugLog('jwt-auth.guard.ts:8', 'JWT Guard handleRequest', { hasError: !!err, hasUser: !!user, info: info?.message || info?.toString() }, 'H');
    // #endregion
    if (err || !user) {
      console.log('[JWT Guard] Rejecting request:', { err: err?.message, hasUser: !!user });
      // #region agent log
      debugLog('jwt-auth.guard.ts:11', 'JWT Guard rejecting request', { err: err?.message, hasUser: !!user }, 'H');
      // #endregion
      throw err || new UnauthorizedException();
    }
    console.log('[JWT Guard] Allowing request for user:', user?.id);
    // #region agent log
    debugLog('jwt-auth.guard.ts:16', 'JWT Guard allowing request', { userId: user?.id }, 'H');
    // #endregion
    return user;
  }
}
