import { validateEnvironment, getSafeEnvConfig } from './env-validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should pass with valid environment variables', () => {
      process.env.PORT = '3001';
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

      const result = validateEnvironment();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with missing required variables', () => {
      delete process.env.PORT;
      delete process.env.FRONTEND_URL;
      delete process.env.JWT_SECRET;

      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate PORT is a number', () => {
      process.env.PORT = 'invalid';
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('PORT'))).toBe(true);
    });

    it('should validate FRONTEND_URL is a valid URL', () => {
      process.env.PORT = '3001';
      process.env.FRONTEND_URL = 'not-a-valid-url';
      process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('FRONTEND_URL'))).toBe(true);
    });

    it('should warn about short JWT_SECRET', () => {
      process.env.PORT = '3001';
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.JWT_SECRET = 'short';

      const result = validateEnvironment();
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('JWT_SECRET'))).toBe(true);
    });
  });

  describe('getSafeEnvConfig', () => {
    it('should return default values when env vars are missing', () => {
      delete process.env.PORT;
      delete process.env.FRONTEND_URL;
      delete process.env.JWT_SECRET;

      const config = getSafeEnvConfig();
      expect(config.PORT).toBe('3001');
      expect(config.FRONTEND_URL).toBe('http://localhost:3000');
      expect(config.JWT_SECRET).toBe('your-super-secret-jwt-key-change-in-production');
    });

    it('should use environment variables when provided', () => {
      process.env.PORT = '4000';
      process.env.FRONTEND_URL = 'https://example.com';
      process.env.JWT_SECRET = 'custom-secret';

      const config = getSafeEnvConfig();
      expect(config.PORT).toBe('4000');
      expect(config.FRONTEND_URL).toBe('https://example.com');
      expect(config.JWT_SECRET).toBe('custom-secret');
    });
  });
});
