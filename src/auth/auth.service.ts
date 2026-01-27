import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../common/dto/login.dto';
import { LoginResponseDto } from '../common/dto/login-response.dto';
import { Doctor } from '../common/interfaces/doctor.interface';
import { debugLog } from '../common/debug-logger';

// Mock doctor database (replace with real database)
const MOCK_DOCTORS: Doctor[] = [
  {
    id: '1',
    email: 'doctor@example.com',
    password: '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', // password: 'password123'
    name: 'Dr. John Smith',
    createdAt: new Date(),
  },
];

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateDoctor(
    email: string,
    password: string,
  ): Promise<Doctor | null> {
    // #region agent log
    debugLog(
      'auth.service.ts:25',
      'Validating doctor',
      { email, hasPassword: !!password },
      'E',
    );
    // #endregion
    const doctor = MOCK_DOCTORS.find((d) => d.email === email);
    if (!doctor) {
      // #region agent log
      debugLog('auth.service.ts:29', 'Doctor not found', { email }, 'E');
      // #endregion
      return null;
    }

    // For mock, accept 'password123' for any doctor
    const isPasswordValid =
      password === 'password123' ||
      (await bcrypt.compare(password, doctor.password));

    // #region agent log
    debugLog(
      'auth.service.ts:37',
      'Password validation result',
      { isPasswordValid, doctorId: doctor.id },
      'E',
    );
    // #endregion

    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exclude password from result
    const { password: _, ...result } = doctor;
    return result as Doctor;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // #region agent log
    debugLog(
      'auth.service.ts:50',
      'Login attempt',
      { email: loginDto.email },
      'F',
    );
    // #endregion
    const doctor = await this.validateDoctor(loginDto.email, loginDto.password);
    if (!doctor) {
      // #region agent log
      debugLog(
        'auth.service.ts:54',
        'Login failed - invalid credentials',
        { email: loginDto.email },
        'F',
      );
      // #endregion
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { email: doctor.email, sub: doctor.id };
    const token = this.jwtService.sign(payload);
    // #region agent log
    debugLog(
      'auth.service.ts:61',
      'JWT token generated',
      { hasToken: !!token, tokenLength: token.length, doctorId: doctor.id },
      'F',
    );
    // #endregion

    return {
      token,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
      },
    };
  }

  async validateToken(payload: any): Promise<Doctor | null> {
    const doctor = MOCK_DOCTORS.find((d) => d.id === payload.sub);
    if (!doctor) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exclude password from result
    const { password: _, ...result } = doctor;
    return result as Doctor;
  }
}
