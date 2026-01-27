import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateEnvironment } from './common/env-validation';

async function bootstrap() {
  // Validate environment variables
  const envValidation = validateEnvironment();
  if (envValidation.warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    envValidation.warnings.forEach((warning) =>
      console.warn(`   - ${warning}`),
    );
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
  try {
    await app.listen(port);
    console.log(`🚀 Backend server running on http://localhost:${port}`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${port} is already in use. Please stop the existing server or use a different port.`,
      );
      console.error(
        `   To find and kill the process: netstat -ano | findstr :${port}`,
      );
      process.exit(1);
    }
    throw error;
  }
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
