# Pre-Build Testing Guide

This guide explains how to test and validate the environment configurations before building the project.

## Quick Start

### Run Pre-Build Validation

```bash
# Using npm script
npm run validate

# Or directly
node prebuild-validation.js
```

### Test Environment Configurations

```bash
# Using npm script
npm run test:environments

# Or directly
ts-node test-environments.ts
```

## What Gets Tested

### Pre-Build Validation (`prebuild-validation.js`)

The pre-build validation script checks:

1. **Package.json**
   - File exists and is valid JSON
   - Required scripts are present (build, start, test)

2. **Environment Files**
   - `environments.ts` exists
   - `.env.example` exists

3. **Source Files**
   - `src/` directory exists
   - `src/main.ts` exists
   - `src/app.module.ts` exists

4. **Configuration Files**
   - `tsconfig.json` exists
   - `nest-cli.json` exists
   - `.eslintrc.js` (optional)

5. **Documentation**
   - `README.md` exists
   - `ENVIRONMENTS_SETUP.md` exists
   - Other optional docs

6. **Git Files**
   - `.gitignore` exists
   - Git repository initialized

7. **Environment Configuration**
   - `environments.ts` has required exports
   - File structure is valid

### Environment Tests (`test-environments.ts`)

The environment test file validates:

1. **Environment Configurations**
   - All environments can be retrieved
   - Environment names are valid
   - Each environment has required fields
   - Environment structure is correct

2. **Repository Configurations**
   - All repositories can be retrieved
   - Each repository has required fields
   - Repository environments are valid
   - Repositories can be filtered by type

3. **Integration**
   - Repository environments reference valid environment configs
   - All cross-references are valid

## Running Tests

### Before Building

Always run validation before building:

```bash
npm run prebuild
# or
npm run validate
```

This will:
1. Check all required files exist
2. Validate configurations
3. Exit with error if anything is missing

### Test Environment Configurations

Test the TypeScript environment configurations:

```bash
npm run test:environments
```

This will:
1. Test all environment configs
2. Test all repository configs
3. Test integration between them
4. Print detailed results

### Full Test Suite

Run all tests including unit tests:

```bash
npm test
```

## Integration with Build Process

The `prebuild` script automatically runs before `build`:

```bash
npm run build
```

This will:
1. Run `prebuild-validation.js` first
2. Only proceed with build if validation passes
3. Exit with error if validation fails

## Expected Output

### Successful Validation

```
======================================================================
Pre-Build Validation
======================================================================

📦 Checking package.json...
✅ package.json is valid
   Name: ai-med-backend
   Version: 0.1.1

🌍 Checking environment files...
✅ Environment configuration: environments.ts
✅ Environment example file: .env.example

📁 Checking source files...
✅ Source directory: src
✅ Main entry point: src/main.ts
✅ App module: src/app.module.ts

⚙️  Checking configuration files...
✅ TypeScript config: tsconfig.json
✅ NestJS CLI config: nest-cli.json
✅ ESLint config: .eslintrc.js

📚 Checking documentation files...
✅ README: README.md
✅ Environment setup docs: ENVIRONMENTS_SETUP.md

🔧 Checking Git files...
✅ Git ignore file: .gitignore
✅ Git repository: .git

🔍 Validating environment configuration...
✅ Environment file structure is valid

======================================================================
Validation Summary
======================================================================
✅ PASSED: packageJson
✅ PASSED: environmentFiles
✅ PASSED: sourceFiles
✅ PASSED: configFiles
✅ PASSED: documentation
✅ PASSED: gitFiles
✅ PASSED: environmentConfig

======================================================================
🎉 All pre-build checks passed! Ready to build.
```

### Successful Environment Tests

```
======================================================================
Environment Configuration Tests
======================================================================

🧪 Testing Environment Configurations...

✅ Test 1: getAllEnvironments()
   Found 4 environments: dev, development, staging, production

✅ Test 2: getEnvironmentNames()
   Environment names: dev, development, staging, production

✅ Test 3.1: getEnvironmentConfig('dev')
   Name: dev
   Display: Development
   NodeEnv: development
   Port: 3001
   Frontend URL: http://localhost:3000
   API URL: http://localhost:3001

[... more tests ...]

======================================================================
Test Summary
======================================================================
Environment Tests: ✅ PASSED
Repository Tests: ✅ PASSED
Integration Tests: ✅ PASSED

🎉 All tests passed! Environment configurations are ready to use.
```

## Troubleshooting

### Validation Fails

If validation fails:

1. **Check the error message** - It will tell you what's missing
2. **Create missing files** - Use `.env.example` as a template
3. **Fix configuration issues** - Check file syntax and structure
4. **Re-run validation** - `npm run validate`

### Environment Tests Fail

If environment tests fail:

1. **Check TypeScript compilation** - `npx tsc --noEmit`
2. **Verify exports** - Check `environments.ts` has all required exports
3. **Check structure** - Ensure all configs have required fields
4. **Re-run tests** - `npm run test:environments`

### Build Fails After Validation

If build fails even after validation passes:

1. **Check TypeScript errors** - `npx tsc --noEmit`
2. **Check dependencies** - `npm install`
3. **Check NestJS CLI** - `npx nest --version`
4. **Review build logs** - Look for specific error messages

## CI/CD Integration

### GitHub Actions

Add to your workflow:

```yaml
- name: Pre-build validation
  run: npm run validate

- name: Test environments
  run: npm run test:environments

- name: Build
  run: npm run build
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm run validate
if [ $? -ne 0 ]; then
  echo "Pre-build validation failed. Commit aborted."
  exit 1
fi
```

## Next Steps

After validation passes:

1. ✅ Run `npm run build` to build the project
2. ✅ Run `npm test` to run unit tests
3. ✅ Run `npm run start:dev` to start development server
4. ✅ Deploy using environment configurations

## Related Files

- `prebuild-validation.js` - Pre-build validation script
- `test-environments.ts` - Environment configuration tests
- `environments.ts` - Environment configurations
- `package.json` - NPM scripts configuration
