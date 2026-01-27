import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { debugLog } from './common/debug-logger';
import { validateEnvironment } from './common/env-validation';

async function bootstrap() {
  // #region agent log
  debugLog('main.ts:7', 'Bootstrap started', { envPort: process.env.PORT, envFrontend: process.env.FRONTEND_URL }, 'A');
  // #endregion

  // Validate environment variables
  const envValidation = validateEnvironment();
  if (envValidation.warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    envValidation.warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }
  if (!envValidation.valid) {
    console.error('❌ Environment validation failed:');
    envValidation.errors.forEach((error) => console.error(`   - ${error}`));
    console.error('\nPlease fix the environment variables and try again.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  // #region agent log
  debugLog('main.ts:13', 'CORS configuration', { frontendUrl }, 'B');
  // #endregion
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  // #region agent log
  debugLog('main.ts:28', 'Starting server', { port }, 'C');
  // #endregion
  try {
    await app.listen(port);
    // #region agent log
    debugLog('main.ts:32', 'Server started successfully', { port, listening: true }, 'C');
    // #endregion
    console.log(`🚀 Backend server running on http://localhost:${port}`);
  } catch (error: any) {
    // #region agent log
    debugLog('main.ts:36', 'Port binding failed', { port, error: error.message, code: error.code }, 'C');
    // #endregion
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Please stop the existing server or use a different port.`);
      console.error(`   To find and kill the process: netstat -ano | findstr :${port}`);
      process.exit(1);
    }
    throw error;
  }
}

bootstrap().catch((error) => {
  // #region agent log
  debugLog('main.ts:33', 'Bootstrap error', { error: error.message, stack: error.stack }, 'A');
  // #endregion
  console.error('Failed to start server:', error);
  process.exit(1);
});
