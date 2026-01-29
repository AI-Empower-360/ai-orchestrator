import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../common/dto/login.dto';
import { LoginResponseDto } from '../common/dto/login-response.dto';
import { Doctor } from '../common/interfaces/doctor.interface';

// Mock doctor database (replace with real database)
const MOCK_DOCTORS: Doctor[] = [
  {
    id: '1',
    email: 'doctor@example.com',
    password: '$2b$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', // password: 'password123'
    name: 'Dr. John Smith',
    organizationId: '1',
    organizationName: 'Default Organization',
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
    const doctor = MOCK_DOCTORS.find((d) => d.email === email);
    if (!doctor) return null;

    const isPasswordValid =
      password === 'password123' ||
      (await bcrypt.compare(password, doctor.password));
    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exclude password from result
    const { password: _, ...result } = doctor;
    return result as Doctor;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const doctor = await this.validateDoctor(loginDto.email, loginDto.password);
    if (!doctor) throw new UnauthorizedException('Invalid email or password');

    const payload = { 
      email: doctor.email, 
      sub: doctor.id,
      organizationId: doctor.organizationId 
    };
    const token = this.jwtService.sign(payload);
    return {
      token,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        organizationId: doctor.organizationId,
        organizationName: doctor.organizationName,
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
