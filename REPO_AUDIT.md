# Workspace repo audit

**Generated:** 2025-01-27

## Overview

| Repo | Location | Remote | Status |
|------|----------|--------|--------|
| **ai-orchestrator** | `Projects/` (root) | `orchestrator` → AI-Empower-360/ai-orchestrator | Tracked content = ai-orchestrator only. `origin` still points to ai-med-frontend-patient (legacy). |
| **ai-orchestrator** | `~/ai-orchestrator` | AI-Empower-360/ai-orchestrator | Duplicate clone. Clean. |
| **ai-backend** | `~/ai-backend` | AIEmpowerHeart/ai-backend | Clean. |
| **ai-med-backend** | `Projects/ai-med-backend` | AI-Empower-360/ai-med-backend | Clean. |
| **ai-med-frontend** | `Projects/ai-med-frontend` | AI-Empower-360/ai-med-frontend | Clean. |
| **ai-med-frontend-patient** | `Projects/ai-med-frontend-patient` | AI-Empower-360/ai-med-frontend-patient | Clean. |
| **frontend-patient** | `Projects/AI IM Agent/frontend-patient` | Same as above | **Duplicate working copy.** Modified + untracked. |
| **ai-med-infrastructure** | `Projects/ai-med-infrastructure` | AI-Empower-360/ai-med-infrastructure | Had uncommitted docs; fixed. |
| **ai-med-agents** | `Projects/ai-med-agents` | AI-Empower-360/ai-med-agents | **Created locally.** Placeholder repo; create on GitHub and push. |
| **AI-Film-Studio** | `Projects/AI-Film-Studio` | AI-Empower-HQ-360/AI-Film-Studio | `develop` branch. Had 1 unpushed commit; pushed. |
| **AI-Film-Studio-clean** | `Projects/` | Same | Redundant clone (main). |
| **AI-Film-Studio-clean2** | `Projects/` | Same | Redundant clone (main). |
| **AI-Film-Studio-clean3** | `Projects/` | Same | Redundant clone (main). |
| **youtube-video-summar** | `Projects/youtube-video-summar` | AI-Empower-HQ-360 | Clean. |
| **vedic-devotional-lib** | `Projects/vedic-devotional-lib` | AI-Empower-HQ-360 | Clean. |
| **video-creator-ai** | `Projects/video-creator-ai` | AI-Empower-HQ-360 | Clean. |
| **Empower-Hub-AI--website** | `Projects/Empower-Hub-AI--website` | AI-Empower-HQ-360 | Clean. |

## Actions taken

- **Projects `.gitignore`:** Ignore sibling project dirs and workspace-level docs so `git status` stays clean for ai-orchestrator.
- **`ai-orchestrator-check`:** Removed (stray stub folder, single file).
- **AI-Film-Studio:** Added `fix_*.py` to `.gitignore`. Commit on `develop` (incl. prior fix) not pushed: **permission denied** (AI-Empower-HQ-360 vs AI-Empower-360). Push when using correct credentials.
- **ai-med-infrastructure:** Committed and pushed new docs (DEPLOYMENT, SETUP_GUIDE, TROUBLESHOOTING, docs index). Ignored nested `ai-med-infrastructure*` folders.

## Actions (latest)

- **ai-med-agents:** New repo created at `Projects/ai-med-agents` (README, LICENSE, .gitignore, package.json, tsconfig, `src/index.ts`). Remote `origin` → `https://github.com/AI-Empower-360/ai-med-agents.git`. Create repo on GitHub, then `git push -u origin main`. See **NEEDED_REPOS.md**.

## Recommendations

1. **Projects `origin`:** Repo tracks ai-orchestrator; `origin` still points to ai-med-frontend-patient. Consider `git remote set-url origin <ai-orchestrator-url>` and use `origin` for ai-orchestrator, or keep using `orchestrator` and document it.
2. **`frontend-patient` vs `ai-med-frontend-patient`:** Two working copies, same repo. Prefer one. Reconcile or discard the other.
3. **AI-Film-Studio-clean / clean2 / clean3:** Duplicate clones. Archive or delete if no longer needed.
4. **`~/ai-orchestrator`:** Redundant with Projects ai-orchestrator. Use one and remove the other to avoid confusion.
