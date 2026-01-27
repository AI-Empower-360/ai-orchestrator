#!/usr/bin/env node
/**
 * Pre-build validation script
 * Validates environment configurations and project setup before build
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log(`✅ ${description}: ${filePath}`, 'green');
    return true;
  } else {
    log(`❌ ${description}: ${filePath} (NOT FOUND)`, 'red');
    return false;
  }
}

function checkDirectoryExists(dirPath, description) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    log(`✅ ${description}: ${dirPath}`, 'green');
    return true;
  } else {
    log(`❌ ${description}: ${dirPath} (NOT FOUND)`, 'red');
    return false;
  }
}

function checkPackageJson() {
  log('\n📦 Checking package.json...', 'cyan');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found', 'red');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['build', 'start', 'test'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts || !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      log(`❌ Missing scripts: ${missingScripts.join(', ')}`, 'red');
      return false;
    }
    
    log(`✅ package.json is valid`, 'green');
    log(`   Name: ${packageJson.name}`, 'cyan');
    log(`   Version: ${packageJson.version}`, 'cyan');
    return true;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvironmentFiles() {
  log('\n🌍 Checking environment files...', 'cyan');
  
  const checks = [
    checkFileExists('environments.ts', 'Environment configuration'),
    checkFileExists('.env.example', 'Environment example file'),
  ];
  
  return checks.every(check => check);
}

function checkSourceFiles() {
  log('\n📁 Checking source files...', 'cyan');
  
  const checks = [
    checkDirectoryExists('src', 'Source directory'),
    checkFileExists('src/main.ts', 'Main entry point'),
    checkFileExists('src/app.module.ts', 'App module'),
  ];
  
  return checks.every(check => check);
}

function checkConfigFiles() {
  log('\n⚙️  Checking configuration files...', 'cyan');
  
  const checks = [
    checkFileExists('tsconfig.json', 'TypeScript config'),
    checkFileExists('nest-cli.json', 'NestJS CLI config'),
  ];
  
  // .eslintrc.js is optional but recommended
  if (fs.existsSync(path.join(process.cwd(), '.eslintrc.js'))) {
    log('✅ ESLint config: .eslintrc.js', 'green');
  } else {
    log('⚠️  ESLint config: .eslintrc.js (optional, not found)', 'yellow');
  }
  
  return checks.every(check => check);
}

function checkDocumentation() {
  log('\n📚 Checking documentation files...', 'cyan');
  
  const checks = [
    checkFileExists('README.md', 'README'),
    checkFileExists('ENVIRONMENTS_SETUP.md', 'Environment setup docs'),
  ];
  
  // These are optional but recommended
  const optionalDocs = ['SETUP.md', 'DEPLOYMENT.md', 'API_CONTRACTS.md'];
  optionalDocs.forEach(doc => {
    if (fs.existsSync(path.join(process.cwd(), doc))) {
      log(`✅ ${doc}`, 'green');
    } else {
      log(`⚠️  ${doc} (optional, not found)`, 'yellow');
    }
  });
  
  return checks.every(check => check);
}

function checkGitFiles() {
  log('\n🔧 Checking Git files...', 'cyan');
  
  const checks = [
    checkFileExists('.gitignore', 'Git ignore file'),
  ];
  
  // Check if .git directory exists (we're in a git repo)
  if (fs.existsSync(path.join(process.cwd(), '.git'))) {
    log('✅ Git repository: .git', 'green');
  } else {
    log('⚠️  Git repository: .git (not found, may not be initialized)', 'yellow');
  }
  
  return checks.every(check => check);
}

function validateEnvironmentConfig() {
  log('\n🔍 Validating environment configuration...', 'cyan');
  
  try {
    // Try to require/import the environments file
    // Note: This is a simple check - full validation should use the test file
    const envPath = path.join(process.cwd(), 'environments.ts');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      // Basic validation - check for key exports
      const hasExports = 
        content.includes('export const ENVIRONMENTS') &&
        content.includes('export const REPOSITORIES') &&
        content.includes('export function getEnvironmentConfig');
      
      if (hasExports) {
        log('✅ Environment file structure is valid', 'green');
        return true;
      } else {
        log('❌ Environment file missing required exports', 'red');
        return false;
      }
    } else {
      log('❌ environments.ts not found', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error validating environment config: ${error.message}`, 'red');
    return false;
  }
}

function main() {
  log('='.repeat(70), 'cyan');
  log('Pre-Build Validation', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const results = {
    packageJson: checkPackageJson(),
    environmentFiles: checkEnvironmentFiles(),
    sourceFiles: checkSourceFiles(),
    configFiles: checkConfigFiles(),
    documentation: checkDocumentation(),
    gitFiles: checkGitFiles(),
    environmentConfig: validateEnvironmentConfig(),
  };
  
  log('\n' + '='.repeat(70), 'cyan');
  log('Validation Summary', 'cyan');
  log('='.repeat(70), 'cyan');
  
  const allPassed = Object.values(results).every(result => result);
  
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    log(`${status}: ${check}`, passed ? 'green' : 'red');
  });
  
  log('\n' + '='.repeat(70), 'cyan');
  
  if (allPassed) {
    log('🎉 All pre-build checks passed! Ready to build.', 'green');
    process.exit(0);
  } else {
    log('❌ Some pre-build checks failed. Please fix the issues before building.', 'red');
    process.exit(1);
  }
}

// Run validation
main();
