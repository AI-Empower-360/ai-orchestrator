import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Doctor } from '../common/interfaces/doctor.interface';
import { debugLog } from '../common/debug-logger';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    console.log('[JWT Strategy] Constructor called - JWT Strategy is being instantiated');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
    console.log('[JWT Strategy] Strategy configured with secret:', (process.env.JWT_SECRET || 'your-secret-key-change-in-production').substring(0, 10) + '...');
  }

  async validate(payload: any): Promise<Doctor> {
    console.log('[JWT Strategy] validate called with payload:', JSON.stringify(payload));
    // #region agent log
    debugLog('jwt.strategy.ts:20', 'JWT validation started', { hasPayload: !!payload, payloadSub: payload?.sub }, 'H');
    // #endregion
    const doctor = await this.authService.validateToken(payload);
    console.log('[JWT Strategy] validate result:', doctor ? `Doctor ID: ${doctor.id}` : 'null');
    // #region agent log
    debugLog('jwt.strategy.ts:23', 'Token validation result', { hasDoctor: !!doctor, doctorId: doctor?.id }, 'H');
    // #endregion
    if (!doctor) {
      console.log('[JWT Strategy] Doctor validation failed');
      // #region agent log
      debugLog('jwt.strategy.ts:26', 'Doctor validation failed', { payloadSub: payload?.sub }, 'H');
      // #endregion
      throw new UnauthorizedException();
    }
    return doctor;
  }
}
