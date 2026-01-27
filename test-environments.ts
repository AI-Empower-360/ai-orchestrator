/**
 * Test file for environment configurations
 * Validates that all environment configurations are correct and usable
 */

import {
  getEnvironmentConfig,
  getAllEnvironments,
  getEnvironmentNames,
  getRepositoryConfig,
  getAllRepositories,
  getRepositoriesByType,
  EnvironmentConfig,
  RepositoryConfig,
} from './environments';

/**
 * Test environment configurations
 */
function testEnvironmentConfigs(): boolean {
  console.log('🧪 Testing Environment Configurations...\n');

  let allPassed = true;

  // Test 1: Get all environments
  try {
    const envs = getAllEnvironments();
    console.log('✅ Test 1: getAllEnvironments()');
    console.log(`   Found ${Object.keys(envs).length} environments: ${Object.keys(envs).join(', ')}\n`);
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    allPassed = false;
  }

  // Test 2: Get environment names
  try {
    const names = getEnvironmentNames();
    console.log('✅ Test 2: getEnvironmentNames()');
    console.log(`   Environment names: ${names.join(', ')}\n`);
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
    allPassed = false;
  }

  // Test 3: Get each environment config
  const envNames = ['dev', 'development', 'staging', 'production'];
  for (const envName of envNames) {
    try {
      const config = getEnvironmentConfig(envName);
      console.log(`✅ Test 3.${envNames.indexOf(envName) + 1}: getEnvironmentConfig('${envName}')`);
      console.log(`   Name: ${config.name}`);
      console.log(`   Display: ${config.displayName}`);
      console.log(`   NodeEnv: ${config.nodeEnv}`);
      console.log(`   Port: ${config.port || 'N/A'}`);
      console.log(`   Frontend URL: ${config.frontendUrl || 'N/A'}`);
      console.log(`   API URL: ${config.apiUrl || 'N/A'}\n`);
    } catch (error) {
      console.error(`❌ Test 3.${envNames.indexOf(envName) + 1} failed for '${envName}':`, error);
      allPassed = false;
    }
  }

  // Test 4: Validate environment structure
  try {
    const envs = getAllEnvironments();
    for (const [name, config] of Object.entries(envs)) {
      if (!config.name || !config.displayName || !config.nodeEnv) {
        throw new Error(`Environment '${name}' is missing required fields`);
      }
      if (!config.tags || !config.tags.Environment) {
        throw new Error(`Environment '${name}' is missing tags`);
      }
    }
    console.log('✅ Test 4: Environment structure validation');
    console.log('   All environments have required fields and tags\n');
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
    allPassed = false;
  }

  return allPassed;
}

/**
 * Test repository configurations
 */
function testRepositoryConfigs(): boolean {
  console.log('🧪 Testing Repository Configurations...\n');

  let allPassed = true;

  // Test 1: Get all repositories
  try {
    const repos = getAllRepositories();
    console.log('✅ Test 1: getAllRepositories()');
    console.log(`   Found ${Object.keys(repos).length} repositories: ${Object.keys(repos).join(', ')}\n`);
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
    allPassed = false;
  }

  // Test 2: Get each repository config
  const repoKeys = ['orchestrator', 'backend', 'frontend', 'frontendPatient', 'infrastructure', 'agents'];
  for (const repoKey of repoKeys) {
    try {
      const config = getRepositoryConfig(repoKey);
      console.log(`✅ Test 2.${repoKeys.indexOf(repoKey) + 1}: getRepositoryConfig('${repoKey}')`);
      console.log(`   Name: ${config.name}`);
      console.log(`   Display: ${config.displayName}`);
      console.log(`   GitHub: ${config.githubOrg}/${config.githubRepo}`);
      console.log(`   Type: ${config.type}`);
      console.log(`   Environments: ${config.environments.join(', ')}\n`);
    } catch (error) {
      console.error(`❌ Test 2.${repoKeys.indexOf(repoKey) + 1} failed for '${repoKey}':`, error);
      allPassed = false;
    }
  }

  // Test 3: Get repositories by type
  const types: Array<'backend' | 'frontend' | 'infrastructure' | 'orchestrator' | 'agents'> = [
    'backend',
    'frontend',
    'infrastructure',
    'orchestrator',
    'agents',
  ];
  for (const type of types) {
    try {
      const repos = getRepositoriesByType(type);
      console.log(`✅ Test 3.${types.indexOf(type) + 1}: getRepositoriesByType('${type}')`);
      console.log(`   Found ${repos.length} repositories of type '${type}'\n`);
    } catch (error) {
      console.error(`❌ Test 3.${types.indexOf(type) + 1} failed for '${type}':`, error);
      allPassed = false;
    }
  }

  // Test 4: Validate repository structure
  try {
    const repos = getAllRepositories();
    for (const [key, config] of Object.entries(repos)) {
      if (!config.name || !config.githubRepo || !config.type) {
        throw new Error(`Repository '${key}' is missing required fields`);
      }
      if (!config.environments || config.environments.length === 0) {
        throw new Error(`Repository '${key}' has no environments defined`);
      }
    }
    console.log('✅ Test 4: Repository structure validation');
    console.log('   All repositories have required fields and environments\n');
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
    allPassed = false;
  }

  return allPassed;
}

/**
 * Test environment-repository integration
 */
function testIntegration(): boolean {
  console.log('🧪 Testing Environment-Repository Integration...\n');

  let allPassed = true;

  try {
    const repos = getAllRepositories();
    const envs = getAllEnvironments();

    // Verify all repository environments exist
    for (const [key, repo] of Object.entries(repos)) {
      for (const envName of repo.environments) {
        if (!envs[envName]) {
          throw new Error(
            `Repository '${key}' references environment '${envName}' which doesn't exist`,
          );
        }
      }
    }

    console.log('✅ Integration Test: Environment-Repository validation');
    console.log('   All repository environments are valid\n');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    allPassed = false;
  }

  return allPassed;
}

/**
 * Run all tests
 */
function runTests(): void {
  console.log('='.repeat(70));
  console.log('Environment Configuration Tests');
  console.log('='.repeat(70));
  console.log('');

  const envTests = testEnvironmentConfigs();
  const repoTests = testRepositoryConfigs();
  const integrationTests = testIntegration();

  console.log('='.repeat(70));
  console.log('Test Summary');
  console.log('='.repeat(70));
  console.log(`Environment Tests: ${envTests ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Repository Tests: ${repoTests ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Integration Tests: ${integrationTests ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');

  const allPassed = envTests && repoTests && integrationTests;

  if (allPassed) {
    console.log('🎉 All tests passed! Environment configurations are ready to use.');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed. Please fix the issues before proceeding.');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

export { testEnvironmentConfigs, testRepositoryConfigs, testIntegration, runTests };
