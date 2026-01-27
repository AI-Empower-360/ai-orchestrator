import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const result = await service.validateUser('doctor@example.com', 'password123');
      expect(result).toBeDefined();
      expect(result.email).toBe('doctor@example.com');
    });

    it('should return null for invalid credentials', async () => {
      const result = await service.validateUser('invalid@example.com', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return token and user for valid credentials', async () => {
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login({
        email: 'doctor@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('doctor');
      expect(result.token).toBe('mock-jwt-token');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });
});
