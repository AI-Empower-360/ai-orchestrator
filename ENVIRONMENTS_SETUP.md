# Organization-Level Environments Configuration

This document describes the organization-level environment configurations for the AI Med Platform across all repositories.

## Overview

The AI Med Platform uses a consistent environment structure across all repositories:
- **Dev/Development** - Local development environment
- **Staging** - Pre-production UAT environment
- **Production** - Production environment

## Environment Configurations

### Development Environment

- **Node Environment**: `development`
- **Port**: 3001 (backend), 3000 (frontend)
- **Frontend URL**: `http://localhost:3000`
- **API URL**: `http://localhost:3001`
- **Database**: Local PostgreSQL (`ai_med_dev`)
- **Features**:
  - Mock services enabled
  - Real transcription disabled
  - AI agents disabled
  - Debug logging
  - CORS enabled

### Staging Environment

- **Node Environment**: `staging`
- **Port**: 3001 (backend), 3000 (frontend)
- **Frontend URL**: `https://staging.aimed.ai`
- **API URL**: `https://api-staging.aimed.ai`
- **Database**: Staging PostgreSQL (`ai_med_staging`)
- **Features**:
  - Mock services disabled
  - Real transcription enabled
  - AI agents enabled
  - Info logging
  - CORS enabled

### Production Environment

- **Node Environment**: `production`
- **Port**: 3001 (backend), 3000 (frontend)
- **Frontend URL**: `https://aimed.ai`
- **API URL**: `https://api.aimed.ai`
- **Database**: Production PostgreSQL (`ai_med_production`)
- **Features**:
  - Mock services disabled
  - Real transcription enabled
  - AI agents enabled
  - Warn logging
  - CORS enabled

## Repositories

The AI Med Platform consists of the following repositories:

### 1. ai-orchestrator
- **Type**: Orchestrator
- **Description**: NestJS API, WebSocket, agent orchestration
- **GitHub**: `AI-Empower-360/ai-orchestrator`
- **Local**: `Projects/` (root)

### 2. ai-med-backend
- **Type**: Backend
- **Description**: Core backend, PostgreSQL, patient API
- **GitHub**: `AI-Empower-360/ai-med-backend`
- **Local**: `Projects/ai-med-backend`

### 3. ai-med-frontend
- **Type**: Frontend
- **Description**: Doctor dashboard (Next.js)
- **GitHub**: `AI-Empower-360/ai-med-frontend`
- **Local**: `Projects/ai-med-frontend`

### 4. ai-med-frontend-patient
- **Type**: Frontend
- **Description**: Patient portal (Next.js)
- **GitHub**: `AI-Empower-360/ai-med-frontend-patient`
- **Local**: `Projects/ai-med-frontend-patient`

### 5. ai-med-infrastructure
- **Type**: Infrastructure
- **Description**: Terraform, deployment, infrastructure as code
- **GitHub**: `AI-Empower-360/ai-med-infrastructure`
- **Local**: `Projects/ai-med-infrastructure`

### 6. ai-med-agents
- **Type**: Agents
- **Description**: Shared AI agents (SOAP, LLM, clinical)
- **GitHub**: `AI-Empower-360/ai-med-agents`
- **Local**: `Projects/ai-med-agents`

## GitHub Projects Setup

Each repository should have GitHub Projects boards for each environment:

- `{Repository Name} - Dev Environment`
- `{Repository Name} - Staging Environment`
- `{Repository Name} - Production Environment`

### Quick Setup

Use the automated script to create all project boards:

```powershell
.\create-all-repo-projects.ps1 -Token "your_github_token_here"
```

This will create **18 project boards** (6 repositories × 3 environments) across all repositories.

## Environment Variables

Each repository should use environment variables consistent with the environment configuration:

### Common Variables

```env
NODE_ENV=development|staging|production
PORT=3001
FRONTEND_URL=http://localhost:3000|https://staging.aimed.ai|https://aimed.ai
API_URL=http://localhost:3001|https://api-staging.aimed.ai|https://api.aimed.ai
```

### Backend-Specific Variables

```env
JWT_SECRET=your-secret-key
DATABASE_HOST=localhost|staging-db.aimed.ai|production-db.aimed.ai
DATABASE_PORT=5432
DATABASE_NAME=ai_med_dev|ai_med_staging|ai_med_production
OPENAI_API_KEY=your-key
TRANSCRIPTION_PROVIDER=whisper|aws-transcribe
```

### Frontend-Specific Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001|https://api-staging.aimed.ai|https://api.aimed.ai
NEXT_PUBLIC_WS_URL=ws://localhost:3001|wss://api-staging.aimed.ai|wss://api.aimed.ai
```

## Usage

### TypeScript/JavaScript

```typescript
import { getEnvironmentConfig, getAllEnvironments } from './environments';

// Get specific environment config
const devConfig = getEnvironmentConfig('dev');

// Get all environments
const allEnvs = getAllEnvironments();

// Get repository config
import { getRepositoryConfig } from './environments';
const backendConfig = getRepositoryConfig('backend');
```

### Environment Detection

```typescript
const env = process.env.NODE_ENV || 'development';
const config = getEnvironmentConfig(env);
```

## GitHub Projects Structure

Each project board should have:

### Columns
1. **Backlog** - Future work items
2. **To Do** - Ready to start
3. **In Progress** - Active development
4. **Code Review** - PRs under review
5. **Testing** - QA and integration testing
6. **Deployed** - Successfully deployed
7. **Blocked** - Issues preventing progress
8. **Done** - Completed and closed

### Labels

Create these labels in each repository:

**Environment Labels:**
- `environment:dev`
- `environment:staging`
- `environment:production`

**Service Labels (backend/orchestrator):**
- `service:auth`
- `service:notes`
- `service:alerts`
- `service:transcription`
- `service:websocket`
- `service:orchestration`

**Type Labels:**
- `type:bug`
- `type:feature`
- `type:infrastructure`
- `type:documentation`

**Priority Labels:**
- `priority:low`
- `priority:medium`
- `priority:high`
- `priority:critical`

## Deployment Workflow

1. **Development**: Local development and testing
2. **Staging**: Pre-production UAT and integration testing
3. **Production**: Production deployment

### Deployment Process

1. Create issue/PR with appropriate environment label
2. Link to corresponding project board
3. Move through board columns as work progresses
4. Deploy to environment
5. Update project board status
6. Close issue/PR when complete

## Related Files

- `environments.ts` - TypeScript environment configurations
- `create-all-repo-projects.ps1` - Script to create all GitHub Projects
- `GITHUB_PROJECTS_SETUP.md` - Detailed GitHub Projects setup guide

## Next Steps

1. ✅ Review environment configurations
2. ✅ Run `create-all-repo-projects.ps1` to create GitHub Projects
3. ✅ Configure project board columns and custom fields
4. ✅ Create labels in each repository
5. ✅ Set up automation rules
6. ✅ Update deployment workflows to use project boards
