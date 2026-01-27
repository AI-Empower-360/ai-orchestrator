import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

@Injectable()
export class SimpleJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = this.jwtService.verify(token);
      const doctor = await this.authService.validateToken(payload);
      
      if (!doctor) {
        throw new UnauthorizedException();
      }

      // Attach doctor to request for use in controllers
      request.user = doctor;
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}
