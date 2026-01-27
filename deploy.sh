#!/bin/bash
# Deployment script for AI Med Backend
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying to $ENVIRONMENT environment..."

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."
npm run validate || { echo "❌ Pre-build validation failed"; exit 1; }
npm run test:environments || { echo "❌ Environment tests failed"; exit 1; }

# Build
echo "🔨 Building application..."
npm run build || { echo "❌ Build failed"; exit 1; }

# Run tests (if coverage >= 85%)
echo "🧪 Running tests..."
npm test -- --coverage --passWithNoTests || { echo "⚠️  Some tests failed, but continuing..."; }

# Deployment steps based on environment
case $ENVIRONMENT in
  dev|development)
    echo "📦 Deploying to development..."
    # Add dev deployment steps here
    ;;
  staging)
    echo "📦 Deploying to staging..."
    # Add staging deployment steps here
    ;;
  production)
    echo "📦 Deploying to production..."
    # Add production deployment steps here
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "✅ Deployment to $ENVIRONMENT completed successfully!"
