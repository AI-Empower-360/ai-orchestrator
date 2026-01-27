/**
 * Organization-level environment configurations for AI Med Platform
 * Defines all environments (dev, staging, production) with their specific settings
 * Used across all repositories in the AI Med platform
 */

export interface EnvironmentConfig {
  name: string;
  displayName: string;
  description: string;
  nodeEnv: string;
  port?: number;
  frontendUrl?: string;
  apiUrl?: string;
  database?: {
    host: string;
    port: number;
    name: string;
  };
  features: {
    [key: string]: boolean | string;
  };
  tags: {
    [key: string]: string;
  };
}

/**
 * Organization-level environment definitions
 * Shared across all AI Med Platform repositories
 */
export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    displayName: 'Development',
    description: 'Development environment for AI Med Platform',
    nodeEnv: 'development',
    port: 3001,
    frontendUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3001',
    database: {
      host: 'localhost',
      port: 5432,
      name: 'ai_med_dev',
    },
    features: {
      enableMockServices: true,
      enableRealTranscription: false,
      enableAIAgents: false,
      logLevel: 'debug',
      enableCors: true,
    },
    tags: {
      Environment: 'dev',
      Project: 'AI-Med-Platform',
      ManagedBy: 'CDK/Terraform',
      CostCenter: 'Development',
    },
  },
  development: {
    name: 'development',
    displayName: 'Development',
    description: 'Development environment (alias for dev)',
    nodeEnv: 'development',
    port: 3001,
    frontendUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3001',
    database: {
      host: 'localhost',
      port: 5432,
      name: 'ai_med_dev',
    },
    features: {
      enableMockServices: true,
      enableRealTranscription: false,
      enableAIAgents: false,
      logLevel: 'debug',
      enableCors: true,
    },
    tags: {
      Environment: 'development',
      Project: 'AI-Med-Platform',
      ManagedBy: 'CDK/Terraform',
      CostCenter: 'Development',
    },
  },
  staging: {
    name: 'staging',
    displayName: 'Staging',
    description: 'Staging environment for pre-production UAT',
    nodeEnv: 'staging',
    port: 3001,
    frontendUrl: 'https://staging.aimed.ai',
    apiUrl: 'https://api-staging.aimed.ai',
    database: {
      host: 'staging-db.aimed.ai',
      port: 5432,
      name: 'ai_med_staging',
    },
    features: {
      enableMockServices: false,
      enableRealTranscription: true,
      enableAIAgents: true,
      logLevel: 'info',
      enableCors: true,
    },
    tags: {
      Environment: 'staging',
      Project: 'AI-Med-Platform',
      ManagedBy: 'CDK/Terraform',
      CostCenter: 'Staging',
    },
  },
  production: {
    name: 'production',
    displayName: 'Production',
    description: 'Production environment for AI Med Platform',
    nodeEnv: 'production',
    port: 3001,
    frontendUrl: 'https://aimed.ai',
    apiUrl: 'https://api.aimed.ai',
    database: {
      host: 'production-db.aimed.ai',
      port: 5432,
      name: 'ai_med_production',
    },
    features: {
      enableMockServices: false,
      enableRealTranscription: true,
      enableAIAgents: true,
      logLevel: 'warn',
      enableCors: true,
    },
    tags: {
      Environment: 'production',
      Project: 'AI-Med-Platform',
      ManagedBy: 'CDK/Terraform',
      CostCenter: 'Production',
    },
  },
};

/**
 * Get configuration for a specific environment
 */
export function getEnvironmentConfig(envName: string): EnvironmentConfig {
  const config = ENVIRONMENTS[envName];
  if (!config) {
    throw new Error(
      `Environment '${envName}' not found. Available environments: ${Object.keys(ENVIRONMENTS).join(', ')}`,
    );
  }
  return { ...config };
}

/**
 * Get all environment configurations
 */
export function getAllEnvironments(): Record<string, EnvironmentConfig> {
  return { ...ENVIRONMENTS };
}

/**
 * Get environment names
 */
export function getEnvironmentNames(): string[] {
  return Object.keys(ENVIRONMENTS);
}

/**
 * Repository-specific environment configurations
 * Each repository can extend the base environment config
 */
export interface RepositoryConfig {
  name: string;
  displayName: string;
  githubOrg: string;
  githubRepo: string;
  description: string;
  type: 'backend' | 'frontend' | 'infrastructure' | 'orchestrator' | 'agents';
  environments: string[];
}

/**
 * All repositories in the AI Med Platform
 */
export const REPOSITORIES: Record<string, RepositoryConfig> = {
  orchestrator: {
    name: 'ai-orchestrator',
    displayName: 'AI Orchestrator',
    githubOrg: 'AI-Empower-360',
    githubRepo: 'ai-orchestrator',
    description: 'NestJS API, WebSocket, agent orchestration',
    type: 'orchestrator',
    environments: ['dev', 'staging', 'production'],
  },
  backend: {
    name: 'ai-med-backend',
    displayName: 'AI Med Backend',
    githubOrg: 'AI-Empower-360',
    githubRepo: 'ai-med-backend',
    description: 'Core backend, PostgreSQL, patient API',
    type: 'backend',
    environments: ['dev', 'staging', 'production'],
  },
  frontend: {
    name: 'ai-med-frontend',
    displayName: 'AI Med Frontend (Doctor)',
    githubOrg: 'AI-Empower-360',
    githubRepo: 'ai-med-frontend',
    description: 'Doctor dashboard (Next.js)',
    type: 'frontend',
    environments: ['dev', 'staging', 'production'],
  },
  frontendPatient: {
    name: 'ai-med-frontend-patient',
    displayName: 'AI Med Frontend (Patient)',
    githubOrg: 'AI-Empower-360',
    githubRepo: 'ai-med-frontend-patient',
    description: 'Patient portal (Next.js)',
    type: 'frontend',
    environments: ['dev', 'staging', 'production'],
  },
  infrastructure: {
    name: 'ai-med-infrastructure',
    displayName: 'AI Med Infrastructure',
    githubOrg: 'AI-Empower-360',
    githubRepo: 'ai-med-infrastructure',
    description: 'Terraform, deployment, infrastructure as code',
    type: 'infrastructure',
    environments: ['dev', 'staging', 'production'],
  },
  agents: {
    name: 'ai-med-agents',
    displayName: 'AI Med Agents',
    githubOrg: 'AI-Empower-360',
    githubRepo: 'ai-med-agents',
    description: 'Shared AI agents (SOAP, LLM, clinical)',
    type: 'agents',
    environments: ['dev', 'staging', 'production'],
  },
};

/**
 * Get repository configuration
 */
export function getRepositoryConfig(repoName: string): RepositoryConfig {
  const config = REPOSITORIES[repoName];
  if (!config) {
    throw new Error(
      `Repository '${repoName}' not found. Available repositories: ${Object.keys(REPOSITORIES).join(', ')}`,
    );
  }
  return { ...config };
}

/**
 * Get all repository configurations
 */
export function getAllRepositories(): Record<string, RepositoryConfig> {
  return { ...REPOSITORIES };
}

/**
 * Get repositories by type
 */
export function getRepositoriesByType(
  type: RepositoryConfig['type'],
): RepositoryConfig[] {
  return Object.values(REPOSITORIES).filter((repo) => repo.type === type);
}
