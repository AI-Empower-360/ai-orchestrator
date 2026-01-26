# AI Med Infrastructure

Infrastructure-as-code for the AI Agentic Internal Medicine platform.

## Repos / Services Deployed

- `backend-core-api`
- `ai-orchestrator`
- `ehr-integration`
- `frontend-doctor`
- `frontend-patient`

## Local (dev) prerequisites

- Terraform 1.6+
- AWS CLI configured for the target account

## Layout

- `terraform/environments/dev`: dev environment root module
- `terraform/modules/*`: reusable modules

## Quick start (dev)

```bash
cd terraform/environments/dev
terraform init
terraform plan
```

