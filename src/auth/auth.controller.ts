import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../common/dto/login.dto';
import { LoginResponseDto } from '../common/dto/login-response.dto';
import { debugLog } from '../common/debug-logger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    // #region agent log
    debugLog(
      'auth.controller.ts:12',
      'Login request received',
      { email: loginDto.email, hasPassword: !!loginDto.password },
      'D',
    );
    // #endregion
    try {
      const result = await this.authService.login(loginDto);
      // #region agent log
      debugLog(
        'auth.controller.ts:17',
        'Login success',
        { hasToken: !!result.token, doctorId: result.doctor.id },
        'D',
      );
      // #endregion
      return result;
    } catch (error: any) {
      // #region agent log
      debugLog(
        'auth.controller.ts:22',
        'Login error',
        { error: error.message, status: error.status },
        'D',
      );
      // #endregion
      throw error;
    }
  }
}
