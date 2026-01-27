# Deployment Guide - AI Orchestrator

Comprehensive guide for deploying the AI Orchestrator service to various platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Configuration](#build-configuration)
3. [Environment Variables](#environment-variables)
4. [Deployment Platforms](#deployment-platforms)
   - [Docker](#docker)
   - [AWS ECS/Fargate](#aws-ecsfargate)
   - [AWS EC2](#aws-ec2)
   - [Heroku](#heroku)
   - [Self-Hosted](#self-hosted)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ NestJS application built successfully
- ✅ Environment variables configured
- ✅ Domain name (for production)
- ✅ SSL certificate (for HTTPS)
- ✅ CI/CD pipeline configured (optional but recommended)

## Build Configuration

### Local Build Test

Always test the production build locally before deploying:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Test the production build
npm run start:prod
```

Verify:
- ✅ Build completes without errors
- ✅ Application starts successfully
- ✅ API endpoints respond correctly
- ✅ WebSocket connections work
- ✅ No console errors

## Environment Variables

### Required Variables

Set these in your deployment platform:

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://patient.aimed.example.com
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Optional Variables

```env
# CORS
CORS_ORIGIN=https://patient.aimed.example.com,https://doctor.aimed.example.com

# Logging
LOG_LEVEL=info

# WebSocket
WS_PATH=/ws/transcription
```

### Security Best Practices

1. **Never commit `.env`** to version control
2. **Use environment variables** in your deployment platform
3. **Rotate secrets** regularly
4. **Use different values** for staging and production
5. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault)

## Deployment Platforms

### Docker

Deploy using Docker for containerized environments.

#### Dockerfile

Create a `Dockerfile` in the root directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/main"]
```

#### Build and Run

```bash
# Build image
docker build -t ai-orchestrator:latest .

# Run container
docker run -d \
  --name ai-orchestrator \
  -p 3001:3001 \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://patient.aimed.example.com \
  -e JWT_SECRET=your-secret-key \
  ai-orchestrator:latest
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  orchestrator:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
      - FRONTEND_URL=${FRONTEND_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

### AWS ECS/Fargate

Deploy to AWS ECS using Fargate for serverless containers.

#### Prerequisites

- AWS CLI configured
- Docker image pushed to ECR
- ECS cluster created

#### Steps

1. **Push Docker image to ECR:**

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t ai-orchestrator .
docker tag ai-orchestrator:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-orchestrator:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-orchestrator:latest
```

2. **Create ECS Task Definition:**

```json
{
  "family": "ai-orchestrator",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "ai-orchestrator",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/ai-orchestrator:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:ai-orchestrator/jwt-secret"
        },
        {
          "name": "FRONTEND_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:ai-orchestrator/frontend-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-orchestrator",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

3. **Create ECS Service:**

```bash
aws ecs create-service \
  --cluster ai-med-cluster \
  --service-name ai-orchestrator \
  --task-definition ai-orchestrator \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/ai-orchestrator/xxx,containerName=ai-orchestrator,containerPort=3001"
```

### AWS EC2

Deploy to AWS EC2 for traditional server deployment.

#### Prerequisites

- EC2 instance with Node.js 18+
- Security group allowing port 3001
- Domain name and SSL certificate

#### Steps

1. **SSH into EC2 instance:**

```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

2. **Clone and setup:**

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/AI-Empower-360/ai-orchestrator.git
cd ai-orchestrator

# Install dependencies
npm install

# Build
npm run build
```

3. **Setup environment:**

```bash
# Create .env file
nano .env
```

Add:
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://patient.aimed.example.com
JWT_SECRET=your-secret-key
```

4. **Use PM2 for process management:**

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name ai-orchestrator

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

5. **Setup Nginx reverse proxy:**

```nginx
server {
    listen 80;
    server_name orchestrator.aimed.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Heroku

Deploy to Heroku for quick cloud deployment.

#### Prerequisites

- Heroku CLI installed
- Heroku account

#### Steps

1. **Login to Heroku:**

```bash
heroku login
```

2. **Create Heroku app:**

```bash
heroku create ai-orchestrator
```

3. **Set environment variables:**

```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3001
heroku config:set FRONTEND_URL=https://patient.aimed.example.com
heroku config:set JWT_SECRET=your-secret-key
```

4. **Deploy:**

```bash
git push heroku main
```

5. **View logs:**

```bash
heroku logs --tail
```

### Self-Hosted

Deploy on your own server infrastructure.

#### Steps

1. **Server requirements:**
   - Ubuntu 20.04+ or similar
   - Node.js 18+
   - Nginx (for reverse proxy)
   - PM2 (for process management)

2. **Follow EC2 steps** (steps 1-4) for basic setup

3. **Setup SSL with Let's Encrypt:**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d orchestrator.aimed.example.com
```

4. **Configure firewall:**

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Post-Deployment

### Verification

1. **Health Check:**

```bash
curl https://orchestrator.aimed.example.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-26T12:00:00.000Z"
}
```

2. **API Test:**

```bash
curl -X POST https://orchestrator.aimed.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@example.com","password":"password123"}'
```

3. **WebSocket Test:**

Use a WebSocket client to connect:
```
wss://orchestrator.aimed.example.com/ws/transcription?token=YOUR_JWT_TOKEN
```

### Monitoring

1. **Application Logs:**

```bash
# PM2 logs
pm2 logs ai-orchestrator

# Docker logs
docker logs ai-orchestrator

# Heroku logs
heroku logs --tail
```

2. **Health Monitoring:**

Set up monitoring to check:
- `/health` endpoint responds
- Response time < 200ms
- Error rate < 1%
- Memory usage < 80%
- CPU usage < 70%

3. **Uptime Monitoring:**

Use services like:
- UptimeRobot
- Pingdom
- AWS CloudWatch

## Monitoring & Maintenance

### Log Management

1. **Structured Logging:**

Ensure logs are structured and searchable:
- Use JSON format
- Include timestamps
- Include request IDs
- No PHI in logs

2. **Log Aggregation:**

Consider using:
- AWS CloudWatch Logs
- Datadog
- Splunk
- ELK Stack

### Performance Monitoring

1. **Metrics to Monitor:**

- Response times
- Error rates
- WebSocket connections
- Memory usage
- CPU usage
- Request throughput

2. **Alerting:**

Set up alerts for:
- High error rate (> 5%)
- Slow response times (> 1s)
- High memory usage (> 90%)
- Service downtime

### Maintenance

1. **Regular Updates:**

- Update dependencies monthly
- Review security advisories
- Update Node.js version annually
- Rotate secrets quarterly

2. **Backup:**

- Backup configuration files
- Backup environment variables
- Document deployment process

3. **Scaling:**

- Horizontal scaling: Add more instances
- Vertical scaling: Increase resources
- Load balancing: Distribute traffic

### Security Checklist

- [ ] HTTPS enabled
- [ ] JWT secret is strong and rotated
- [ ] CORS configured correctly
- [ ] Environment variables secured
- [ ] No secrets in code
- [ ] Firewall rules configured
- [ ] Regular security updates
- [ ] Access logs monitored
- [ ] Error messages don't expose PHI
- [ ] Rate limiting configured (if applicable)

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common deployment issues and solutions.

## Support

For deployment issues:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review application logs
3. Check environment variables
4. Verify network connectivity
5. Open an issue on GitHub

---

**Last Updated:** January 2026
