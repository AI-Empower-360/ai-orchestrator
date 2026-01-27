# GitHub Projects Setup Guide - Environment Boards

This guide will help you create GitHub Projects boards for each environment (dev, staging, production) to track deployments, issues, and tasks for the AI Med Backend project.

## Overview

We'll create separate project boards for each environment to:
- Track deployment status
- Monitor backend API issues
- Manage environment-specific tasks
- Link issues and PRs to environments
- Track feature development and bug fixes

## Environments to Create

1. **Dev/Development** - Development environment
2. **Staging** - Pre-production UAT
3. **Production** - Production environment

## Step-by-Step Setup

### Option 1: Create via GitHub Web Interface

#### Step 1: Navigate to Projects
1. Go to your repository: `https://github.com/AI-Empower-360/ai-med-frontend-patient` (or the correct backend repo)
2. Click on the **"Projects"** tab

#### Step 2: Create New Project Board
1. Click **"New project"** button
2. Select **"Board"** template (or "Table" if you prefer)
3. Name the project: `AI Med Backend - Dev Environment`
4. Click **"Create project"**

#### Step 3: Configure Project Board
For each environment board, set up the following:

**Default Columns:**
- **Backlog** - Future work items
- **To Do** - Ready to start
- **In Progress** - Currently being worked on
- **Code Review** - PRs under review
- **Testing** - QA and testing phase
- **Deployed** - Successfully deployed
- **Blocked** - Issues preventing progress
- **Done** - Completed and closed

**Custom Fields (Optional):**
- **Environment** - Dropdown: dev, staging, production
- **Priority** - Dropdown: Low, Medium, High, Critical
- **Deployment Status** - Status: Not Started, In Progress, Deployed, Failed
- **API Version** - Text field
- **Service** - Dropdown: Auth, Notes, Alerts, Transcription, WebSocket

#### Step 4: Repeat for Each Environment
Create separate boards for:
- `AI Med Backend - Dev Environment`
- `AI Med Backend - Staging Environment`
- `AI Med Backend - Production Environment`

### Option 2: Create via PowerShell Script (Recommended)

We've created a ready-to-use PowerShell script that automates the creation of all environment project boards:

```powershell
# Run the script with your GitHub token
.\create-github-projects.ps1 -Token "ghp_your_token_here"

# Or use environment variable
.\create-github-projects.ps1 -Token $env:GITHUB_TOKEN
```

**To get a GitHub token:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` and `write:org` permissions
3. Use the token in the script

The script will create all 3 project boards automatically and provide you with their URLs.

### Option 3: Create via GitHub CLI

If you have GitHub CLI installed:

```bash
# Authenticate
gh auth login

# Create project boards for each environment
gh project create --owner AI-Empower-360 --title "AI Med Backend - Dev Environment" --body "Development environment project board"
gh project create --owner AI-Empower-360 --title "AI Med Backend - Staging Environment" --body "Staging environment project board"
gh project create --owner AI-Empower-360 --title "AI Med Backend - Production Environment" --body "Production environment project board"
```

## Recommended Project Board Structure

### For Each Environment Board:

#### Columns:
1. **Backlog** - Future work items
2. **To Do** - Ready to start
3. **In Progress** - Active development
4. **Code Review** - PRs under review
5. **Testing** - QA and integration testing
6. **Deployed** - Successfully deployed to environment
7. **Blocked** - Issues preventing progress
8. **Done** - Completed and closed

#### Automation Rules (GitHub Actions):
- Auto-move issues to "In Progress" when assigned
- Auto-move PRs to "Code Review" when opened
- Auto-move to "Testing" when PR is approved
- Auto-move to "Deployed" when deployment succeeds
- Auto-move to "Blocked" when issue is labeled "blocked"

#### Labels to Create:
- `environment:dev`
- `environment:staging`
- `environment:production`
- `deployment:success`
- `deployment:failed`
- `deployment:pending`
- `service:auth`
- `service:notes`
- `service:alerts`
- `service:transcription`
- `service:websocket`
- `type:bug`
- `type:feature`
- `type:infrastructure`

## Environment Configuration

The backend uses environment variables for configuration. Each environment should have:

### Dev Environment:
- `NODE_ENV=development`
- `PORT=3001`
- `FRONTEND_URL=http://localhost:3000`
- Development JWT secret
- Optional OpenAI API key for testing

### Staging Environment:
- `NODE_ENV=staging`
- Production-like configuration
- Staging database
- Staging API keys

### Production Environment:
- `NODE_ENV=production`
- Production configuration
- Production database
- Production API keys
- Strong JWT secret (32+ characters)

## Workflow Integration

### Linking Deployments to Projects

When deploying the backend, you can:

1. **Create an issue** for the deployment:
   ```bash
   gh issue create --title "Deploy Backend to Dev Environment" \
     --body "Deploying NestJS backend to dev environment" \
     --label "environment:dev,deployment:pending"
   ```

2. **Link to project board** - The issue will automatically appear in the Dev Environment board

3. **Update status** as deployment progresses:
   - Move to "In Progress" when deployment starts
   - Move to "Code Review" when PR is opened
   - Move to "Testing" when testing begins
   - Move to "Deployed" when successful
   - Move to "Blocked" if issues occur

### GitHub Actions Integration

You can automate project board updates in your workflow:

```yaml
# .github/workflows/update-project-board.yml
name: Update Project Board
on:
  deployment_status:
    types: [success, failure]

jobs:
  update-board:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@v0.4.1
        with:
          project-url: https://github.com/orgs/AI-Empower-360/projects/{project-number}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Best Practices

1. **Environment Isolation**: Keep each environment's issues and deployments in separate boards
2. **Clear Naming**: Use consistent naming: `AI Med Backend - {Environment} Environment`
3. **Regular Updates**: Update board status as work progresses
4. **Link Issues**: Link related issues and PRs to the appropriate environment board
5. **Use Labels**: Apply environment and service labels to all issues and PRs
6. **Documentation**: Keep board descriptions updated with environment details

## Quick Reference

### Project Board URLs (after creation):
- Dev: `https://github.com/AI-Empower-360/{repo}/projects/{dev-project-number}`
- Staging: `https://github.com/AI-Empower-360/{repo}/projects/{staging-project-number}`
- Production: `https://github.com/AI-Empower-360/{repo}/projects/{production-project-number}`

### Related Files:
- `src/common/env-validation.ts` - Environment variable validation
- `.env.example` - Environment variable template
- `package.json` - Project configuration

## Next Steps

1. Create the project boards using one of the methods above
2. Configure columns and custom fields
3. Set up automation rules
4. Create environment-specific labels
5. Link existing issues to appropriate boards
6. Update deployment workflows to update project boards

---

**Note**: GitHub Projects are organization/repository-level features. Make sure you have the necessary permissions to create projects in the repository.
