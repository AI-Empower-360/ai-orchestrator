#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Creates GitHub Projects boards for all environments across all AI Med Platform repositories

.DESCRIPTION
    This script creates GitHub Projects boards for each environment (dev, staging, production)
    across all repositories in the AI Med Platform using the GitHub REST API.

.PARAMETER Token
    GitHub Personal Access Token with 'repo' and 'write:org' permissions

.PARAMETER Org
    GitHub organization name (default: AI-Empower-360)

.EXAMPLE
    .\create-all-repo-projects.ps1 -Token "ghp_your_token_here"

.EXAMPLE
    .\create-all-repo-projects.ps1 -Token $env:GITHUB_TOKEN -Org "AI-Empower-360"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$Org = "AI-Empower-360"
)

# GitHub API configuration
$baseUrl = "https://api.github.com"
$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

# All repositories in AI Med Platform
$repositories = @(
    @{
        Name = "ai-orchestrator"
        DisplayName = "AI Orchestrator"
        Description = "NestJS API, WebSocket, agent orchestration"
        Type = "orchestrator"
    },
    @{
        Name = "ai-med-backend"
        DisplayName = "AI Med Backend"
        Description = "Core backend, PostgreSQL, patient API"
        Type = "backend"
    },
    @{
        Name = "ai-med-frontend"
        DisplayName = "AI Med Frontend (Doctor)"
        Description = "Doctor dashboard (Next.js)"
        Type = "frontend"
    },
    @{
        Name = "ai-med-frontend-patient"
        DisplayName = "AI Med Frontend (Patient)"
        Description = "Patient portal (Next.js)"
        Type = "frontend"
    },
    @{
        Name = "ai-med-infrastructure"
        DisplayName = "AI Med Infrastructure"
        Description = "Terraform, deployment, infrastructure as code"
        Type = "infrastructure"
    },
    @{
        Name = "ai-med-agents"
        DisplayName = "AI Med Agents"
        Description = "Shared AI agents (SOAP, LLM, clinical)"
        Type = "agents"
    }
)

# Environments to create for each repository
$environments = @("Dev", "Staging", "Production")

Write-Host "Creating GitHub Projects for all AI Med Platform repositories..." -ForegroundColor Cyan
Write-Host "Organization: $Org" -ForegroundColor Gray
Write-Host "Total Repositories: $($repositories.Count)" -ForegroundColor Gray
Write-Host "Environments per Repo: $($environments.Count)" -ForegroundColor Gray
Write-Host "Total Projects to Create: $($repositories.Count * $environments.Count)" -ForegroundColor Gray
Write-Host ""

$createdProjects = @()
$failedProjects = @()
$skippedRepos = @()

foreach ($repo in $repositories) {
    Write-Host "=" * 70 -ForegroundColor Yellow
    Write-Host "Repository: $($repo.DisplayName) ($($repo.Name))" -ForegroundColor Yellow
    Write-Host "=" * 70 -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($env in $environments) {
        $projectName = "$($repo.DisplayName) - $env Environment"
        
        Write-Host "  Creating project: $projectName" -ForegroundColor Cyan
        
        try {
            # Create project via repository API (repository-level project)
            $body = @{
                name = $projectName
                body = "$env environment project board for $($repo.DisplayName).`n`nRepository: $($repo.Name)`nType: $($repo.Type)`nDescription: $($repo.Description)"
            } | ConvertTo-Json

            $response = Invoke-RestMethod -Uri "$baseUrl/repos/$Org/$($repo.Name)/projects" `
                -Method Post `
                -Headers $headers `
                -Body $body `
                -ContentType "application/json" `
                -ErrorAction Stop

            Write-Host "    ✓ Created successfully!" -ForegroundColor Green
            Write-Host "      Project ID: $($response.id)" -ForegroundColor Gray
            Write-Host "      URL: $($response.html_url)" -ForegroundColor Gray
            
            $createdProjects += @{
                Repository = $repo.Name
                RepositoryDisplay = $repo.DisplayName
                Environment = $env
                Name = $projectName
                Id = $response.id
                Url = $response.html_url
            }
            
            # Wait a bit to avoid rate limiting
            Start-Sleep -Seconds 1
            
        } catch {
            $errorMessage = $_.Exception.Message
            
            # Check if repository doesn't exist
            if ($errorMessage -match "404" -or $errorMessage -match "Not Found") {
                Write-Host "    ⚠ Repository not found, skipping..." -ForegroundColor Yellow
                if ($repo.Name -notin $skippedRepos) {
                    $skippedRepos += $repo.Name
                }
            } else {
                Write-Host "    ✗ Failed to create project" -ForegroundColor Red
                Write-Host "      Error: $errorMessage" -ForegroundColor Red
                
                $failedProjects += @{
                    Repository = $repo.Name
                    Environment = $env
                    Name = $projectName
                    Error = $errorMessage
                }
            }
        }
        
        Write-Host ""
    }
    
    Write-Host ""
}

# Summary
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Created: $($createdProjects.Count) projects" -ForegroundColor Green
Write-Host "Failed: $($failedProjects.Count) projects" -ForegroundColor $(if ($failedProjects.Count -eq 0) { "Green" } else { "Red" })
if ($skippedRepos.Count -gt 0) {
    Write-Host "Skipped Repositories: $($skippedRepos.Count)" -ForegroundColor Yellow
    Write-Host "  (Repositories not found on GitHub)" -ForegroundColor Gray
}
Write-Host ""

# Group by repository
$projectsByRepo = $createdProjects | Group-Object -Property Repository

if ($createdProjects.Count -gt 0) {
    Write-Host "Created Projects by Repository:" -ForegroundColor Green
    Write-Host ""
    
    foreach ($repoGroup in $projectsByRepo) {
        $repo = $repositories | Where-Object { $_.Name -eq $repoGroup.Name } | Select-Object -First 1
        Write-Host "  📦 $($repo.DisplayName) ($($repo.Name))" -ForegroundColor White
        foreach ($project in $repoGroup.Group) {
            Write-Host "    • $($project.Environment): $($project.Url)" -ForegroundColor Gray
        }
        Write-Host ""
    }
}

if ($skippedRepos.Count -gt 0) {
    Write-Host "Skipped Repositories (not found on GitHub):" -ForegroundColor Yellow
    foreach ($repoName in $skippedRepos) {
        $repo = $repositories | Where-Object { $_.Name -eq $repoName } | Select-Object -First 1
        Write-Host "  • $($repo.DisplayName) ($repoName)" -ForegroundColor Yellow
        Write-Host "    Create this repository on GitHub first, then re-run this script" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($failedProjects.Count -gt 0) {
    Write-Host "Failed Projects:" -ForegroundColor Red
    foreach ($project in $failedProjects) {
        Write-Host "  • $($project.Name) ($($project.Repository)): $($project.Error)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Visit each project board and configure columns:" -ForegroundColor White
Write-Host "   - Backlog, To Do, In Progress, Code Review, Testing, Deployed, Blocked, Done" -ForegroundColor Gray
Write-Host "2. Set up custom fields (Environment, Priority, Deployment Status, Service)" -ForegroundColor White
Write-Host "3. Configure automation rules if desired" -ForegroundColor White
Write-Host "4. Create environment labels in each repository:" -ForegroundColor White
Write-Host "   - environment:dev, environment:staging, environment:production" -ForegroundColor Gray
Write-Host ""

if ($createdProjects.Count -gt 0) {
    Write-Host "Quick Access - All Project URLs:" -ForegroundColor Cyan
    Write-Host ""
    foreach ($project in $createdProjects | Sort-Object Repository, Environment) {
        Write-Host "  $($project.Url)" -ForegroundColor Blue
    }
}
