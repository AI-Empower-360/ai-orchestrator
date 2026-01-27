# Needed repos – AI Med & workspace

## AI Med platform (AI-Empower-360)

| Repo | GitHub | Local | Notes |
|------|--------|-------|-------|
| **ai-orchestrator** | ✅ [AI-Empower-360/ai-orchestrator](https://github.com/AI-Empower-360/ai-orchestrator) | `Projects/` (root) | NestJS API, WebSocket, agent orchestration. |
| **ai-med-backend** | ✅ [AI-Empower-360/ai-med-backend](https://github.com/AI-Empower-360/ai-med-backend) | `Projects/ai-med-backend` | Core backend, PostgreSQL, patient API. |
| **ai-med-frontend** | ✅ [AI-Empower-360/ai-med-frontend](https://github.com/AI-Empower-360/ai-med-frontend) | `Projects/ai-med-frontend` | Doctor dashboard (Next.js). |
| **ai-med-frontend-patient** | ✅ [AI-Empower-360/ai-med-frontend-patient](https://github.com/AI-Empower-360/ai-med-frontend-patient) | `Projects/ai-med-frontend-patient` | Patient portal (Next.js). |
| **ai-med-infrastructure** | ✅ [AI-Empower-360/ai-med-infrastructure](https://github.com/AI-Empower-360/ai-med-infrastructure) | `Projects/ai-med-infrastructure` | Terraform, deployment. |
| **ai-med-agents** | ⚠️ **Create on GitHub** | `Projects/ai-med-agents` | **Created locally.** Placeholder for shared AI agents (SOAP, LLM, clinical). |

## Other (AIEmpowerHeart / AI-Empower-HQ-360)

| Repo | GitHub | Local |
|------|--------|-------|
| **ai-backend** | ✅ AIEmpowerHeart/ai-backend | `~/ai-backend` |
| **AI-Film-Studio** | ✅ AI-Empower-HQ-360/AI-Film-Studio | `Projects/AI-Film-Studio` |
| **youtube-video-summar** | ✅ AI-Empower-HQ-360 | `Projects/youtube-video-summar` |
| **vedic-devotional-lib** | ✅ AI-Empower-HQ-360 | `Projects/vedic-devotional-lib` |
| **video-creator-ai** | ✅ AI-Empower-HQ-360 | `Projects/video-creator-ai` |
| **Empower-Hub-AI--website** | ✅ AI-Empower-HQ-360 | `Projects/Empower-Hub-AI--website` |

---

## Create ai-med-agents on GitHub

**ai-med-agents** was the only missing “needed” repo. It’s now created **locally** at `Projects/ai-med-agents` with README, LICENSE, .gitignore, package.json, tsconfig, and a minimal `src/index.ts`.

To have it on GitHub:

1. **Create the repo**  
   - Go to [github.com/AI-Empower-360](https://github.com/AI-Empower-360) → New repository  
   - Name: `ai-med-agents`  
   - Visibility: Public or Private  
   - **Do not** add a README, .gitignore, or license (they already exist locally).

2. **Push from local**
   ```bash
   cd C:\Users\ctrpr\Projects\ai-med-agents
   git remote add origin https://github.com/AI-Empower-360/ai-med-agents.git   # if not already added
   git push -u origin main
   ```

After that, **all needed repos exist** both locally and on GitHub.
