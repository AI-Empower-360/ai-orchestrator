#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Creates GitHub Projects boards for all environments (dev, staging, production)

.DESCRIPTION
    This script creates GitHub Projects boards for each environment for the AI Med Backend project
    using the GitHub REST API.

.PARAMETER Token
    GitHub Personal Access Token with 'repo' and 'write:org' permissions

.PARAMETER Org
    GitHub organization name (default: AI-Empower-360)

.PARAMETER Repo
    Repository name (default: ai-med-frontend-patient - update if different)

.EXAMPLE
    .\create-github-projects.ps1 -Token "ghp_your_token_here"

.EXAMPLE
    .\create-github-projects.ps1 -Token $env:GITHUB_TOKEN -Org "AI-Empower-360" -Repo "ai-med-backend"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$Org = "AI-Empower-360",
    
    [Parameter(Mandatory=$false)]
    [string]$Repo = "ai-med-frontend-patient"
)

# GitHub API configuration
$baseUrl = "https://api.github.com"
$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

# Environment configurations for AI Med Backend
$environments = @(
    @{
        Name = "Dev"
        Description = "Development environment project board for tracking deployments and issues"
        Body = "Track backend API deployments, issues, and tasks for the development environment. `n`nEnvironment: `NODE_ENV=development`, `PORT=3001`"
    },
    @{
        Name = "Staging"
        Description = "Staging environment project board for pre-production UAT"
        Body = "Track backend API deployments, issues, and tasks for the staging environment. `n`nEnvironment: `NODE_ENV=staging`, production-like configuration"
    },
    @{
        Name = "Production"
        Description = "Production environment project board"
        Body = "Track backend API deployments, issues, and tasks for the production environment. `n`nEnvironment: `NODE_ENV=production`, production configuration"
    }
)

Write-Host "Creating GitHub Projects for AI Med Backend environments..." -ForegroundColor Cyan
Write-Host "Organization: $Org" -ForegroundColor Gray
Write-Host "Repository: $Repo" -ForegroundColor Gray
Write-Host ""

$createdProjects = @()
$failedProjects = @()

foreach ($env in $environments) {
    $projectName = "AI Med Backend - $($env.Name) Environment"
    
    Write-Host "Creating project: $projectName" -ForegroundColor Yellow
    
    try {
        # Create project via repository API (repository-level project)
        $body = @{
            name = $projectName
            body = $env.Body
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "$baseUrl/repos/$Org/$Repo/projects" `
            -Method Post `
            -Headers $headers `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop

        Write-Host "  ✓ Created successfully!" -ForegroundColor Green
        Write-Host "    Project ID: $($response.id)" -ForegroundColor Gray
        Write-Host "    URL: $($response.html_url)" -ForegroundColor Gray
        
        $createdProjects += @{
            Name = $projectName
            Id = $response.id
            Url = $response.html_url
        }
        
        # Wait a bit to avoid rate limiting
        Start-Sleep -Seconds 1
        
    } catch {
        Write-Host "  ✗ Failed to create project" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "    Response: $responseBody" -ForegroundColor Red
        }
        
        $failedProjects += @{
            Name = $projectName
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

# Summary
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Created: $($createdProjects.Count) projects" -ForegroundColor Green
Write-Host "Failed: $($failedProjects.Count) projects" -ForegroundColor $(if ($failedProjects.Count -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($createdProjects.Count -gt 0) {
    Write-Host "Created Projects:" -ForegroundColor Green
    foreach ($project in $createdProjects) {
        Write-Host "  • $($project.Name)" -ForegroundColor White
        Write-Host "    $($project.Url)" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($failedProjects.Count -gt 0) {
    Write-Host "Failed Projects:" -ForegroundColor Red
    foreach ($project in $failedProjects) {
        Write-Host "  • $($project.Name): $($project.Error)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Visit each project board and configure columns:" -ForegroundColor White
Write-Host "   - Backlog, To Do, In Progress, Code Review, Testing, Deployed, Blocked, Done" -ForegroundColor Gray
Write-Host "2. Set up custom fields (Environment, Priority, Deployment Status, Service)" -ForegroundColor White
Write-Host "3. Configure automation rules if desired" -ForegroundColor White
Write-Host "4. Create environment labels in the repository:" -ForegroundColor White
Write-Host "   - environment:dev, environment:staging, environment:production" -ForegroundColor Gray
Write-Host "   - service:auth, service:notes, service:alerts, service:transcription, service:websocket" -ForegroundColor Gray
Write-Host ""

if ($createdProjects.Count -gt 0) {
    Write-Host "Quick Links:" -ForegroundColor Cyan
    foreach ($project in $createdProjects) {
        Write-Host "  $($project.Url)" -ForegroundColor Blue
    }
}
