/**
 * Environment variable validation utility
 * Validates required environment variables on application startup
 */

interface EnvConfig {
  PORT: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  NODE_ENV?: string;
  JWT_EXPIRES_IN?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_TEMPERATURE?: string;
  OPENAI_MAX_TOKENS?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  const requiredVars: (keyof EnvConfig)[] = ['PORT', 'FRONTEND_URL', 'JWT_SECRET'];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate PORT
  const port = process.env.PORT;
  if (port) {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      errors.push(`Invalid PORT value: ${port}. Must be a number between 1 and 65535`);
    }
  }

  // Validate FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL;
  if (frontendUrl) {
    try {
      new URL(frontendUrl);
    } catch {
      errors.push(`Invalid FRONTEND_URL format: ${frontendUrl}. Must be a valid URL`);
    }
  }

  // Validate JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      warnings.push(
        `JWT_SECRET is too short (${jwtSecret.length} chars). Recommended: at least 32 characters for production`,
      );
    }
    if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
      warnings.push('JWT_SECRET appears to be the default value. Change it in production!');
    }
  }

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    warnings.push(`NODE_ENV has unusual value: ${nodeEnv}. Expected: development, production, or test`);
  }

  // Production warnings
  if (nodeEnv === 'production') {
    if (jwtSecret && jwtSecret.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
      errors.push('JWT_SECRET must be changed from default value in production');
    }
  }

  // OpenAI configuration (optional but recommended)
  const forceRuleBased = process.env.FORCE_RULE_BASED === 'true';
  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (forceRuleBased) {
    // Rule-based mode is intentional for testing
    // No warning needed
  } else if (!openaiKey) {
    warnings.push('OPENAI_API_KEY not set. AI agent features will be disabled. Set FORCE_RULE_BASED=true to explicitly use rule-based mode for testing.');
  }

  // Transcription provider configuration
  const transcriptionProvider = process.env.TRANSCRIPTION_PROVIDER;
  if (transcriptionProvider === 'whisper' && !openaiKey) {
    warnings.push('TRANSCRIPTION_PROVIDER=whisper but OPENAI_API_KEY not set. Whisper transcription will be unavailable.');
  }
  
  if (transcriptionProvider === 'aws-transcribe') {
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
    const awsRegion = process.env.AWS_REGION;
    
    if (!awsKey || !awsSecret) {
      warnings.push('TRANSCRIPTION_PROVIDER=aws-transcribe but AWS credentials not set. AWS Transcribe will be unavailable.');
    }
    if (!awsRegion) {
      warnings.push('AWS_REGION not set. Defaulting to us-east-1.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets safe environment configuration with defaults
 */
export function getSafeEnvConfig(): EnvConfig {
  return {
    PORT: process.env.PORT || '3001',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE || '0.7',
    OPENAI_MAX_TOKENS: process.env.OPENAI_MAX_TOKENS || '2000',
  };
}
