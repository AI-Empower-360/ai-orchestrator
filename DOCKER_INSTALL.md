# Install Docker Desktop (Windows) – AI Med Agent

Use one of these options to run Docker locally for building and pushing the AI Med Agent image.  
**Alternatively**, use [GitHub Actions](#option-c-github-actions-no-local-docker) to build and push—no Docker install needed.

---

## Option A: Chocolatey (run as Administrator)

1. **Open PowerShell as Administrator**  
   Right‑click PowerShell → **Run as administrator**.

2. **Install Docker Desktop**
   ```powershell
   choco install docker-desktop -y
   ```

3. **Restart** your machine if prompted.

4. **Start Docker Desktop** from the Start menu, then ensure the whale icon in the system tray shows “Docker Desktop is running”.

5. **Verify**
   ```powershell
   docker --version
   ```

---

## Option B: Direct download

1. **Download** the installer:  
   [Docker Desktop for Windows](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe)

2. **Run** `Docker Desktop Installer.exe`, complete the setup, and restart if asked.

3. **Start Docker Desktop** and wait until it reports “Docker Desktop is running”.

4. **Verify**
   ```powershell
   docker --version
   ```

---

## Option C: GitHub Actions (no local Docker)

You can build and push the image from **GitHub Actions** instead of installing Docker locally.

1. **No manual ECR setup required!** The workflow **`.github/workflows/build-and-push-ecr.yml`** automatically creates the `ai-med-agent-backend` ECR repository if it doesn't exist.

2. Use the workflow in this repo:
   - Trigger: push to `main` or **Run workflow** from the Actions tab.
   - The workflow will:
     - Create the ECR repository `ai-med-agent-backend` (if needed)
     - Build the Docker image
     - Push to ECR with proper image scanning and encryption

3. Configure AWS credentials for GitHub Actions:
   - **OIDC (recommended):** IAM role `github-actions-role` with trust for your GitHub repo (see `build-and-push-ecr.yml`).
   - **Or:** store `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as repo secrets and use `aws-actions/configure-aws-credentials` with `aws-access-key-id` / `aws-secret-access-key`.

4. Push your code to `main` (or trigger the workflow manually). The workflow will build and push the image.

---

## After Docker is installed

From the **AI Med Agent (ai-orchestrator)** repo root:

```powershell
# Build + Docker build + ECR push
.\deploy-ai-med-agent.ps1 -Region us-east-1 -Tag latest
```

Requires **AWS CLI** configured (`aws configure` or `aws sso login`) and ECR repo **`ai-med-agent-backend`** in the same account/region.
