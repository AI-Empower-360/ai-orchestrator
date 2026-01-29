# AI Orchestrator

AI agent orchestration service for the AI Med Agentic Agent platform. Manages LLM interactions, SOAP notes generation, clinical alerts processing, and intelligent routing between AI agents.

## Overview

The AI Orchestrator sits between the backend API and various LLM providers (OpenAI, Anthropic, etc.), providing:
- **SOAP Notes Generation**: Convert medical transcriptions into structured SOAP notes
- **Clinical Alerts Detection**: Identify critical patient conditions from clinical data
- **Follow-up Suggestions**: Generate intelligent follow-up care recommendations
- **Agent Coordination**: Route requests to appropriate AI agents
- **Fallback Handling**: Use rule-based logic when LLMs are unavailable
- **Response Validation**: Ensure LLM outputs meet medical standards

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  AI Med Backend API                     │
│                   (ai-med-backend)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │    AI Orchestrator         │
        │  (This Service)            │
        ├────────────────────────────┤
        │  • SOAP Agent              │
        │  • Alerts Agent            │
        │  • Follow-up Agent         │
        │  • Validation Layer        │
        └─────┬──────────────┬───────┘
              │              │
              ▼              ▼
    ┌─────────────────┐  ┌──────────────────┐
    │   ai-med-agents │  │   LLM Providers  │
    │   (Library)     │  │   • OpenAI       │
    │                 │  │   • Anthropic    │
    │  • Rule-based   │  │   • AWS Bedrock  │
    │  • Prompts      │  └──────────────────┘
    │  • Schemas      │
    └─────────────────┘
```

## Features

### 1. SOAP Notes Generation

Generate structured SOAP notes from medical transcriptions using LLMs with rule-based fallback.

**Endpoints:**
- `POST /soap/generate` - Generate new SOAP notes
- `POST /soap/merge` - Merge additional context into existing notes
- `POST /soap/validate` - Validate SOAP notes structure

**Example:**
```typescript
const response = await orchestrator.generateSOAP({
  transcription: "Patient reports chest pain...",
  patientId: "patient-123",
  useCache: true
});
// Returns: { subjective, objective, assessment, plan }
```

### 2. Clinical Alerts Detection

Analyze transcriptions and SOAP notes for critical clinical alerts.

**Endpoints:**
- `POST /alerts/analyze` - Detect clinical alerts
- `GET /alerts/prioritize` - Sort alerts by severity
- `POST /alerts/validate` - Validate alert structure

**Example:**
```typescript
const alerts = await orchestrator.detectAlerts({
  transcription: "BP 190/110, HR 125, severe chest pain 9/10",
  soapNotes: existingSoap
});
// Returns: [{ severity: 'critical', message: '...', category: 'vital-signs' }]
```

### 3. Follow-up Suggestions

Generate intelligent follow-up care recommendations.

**Endpoints:**
- `POST /followup/generate` - Generate follow-up suggestions
- `POST /followup/prioritize` - Prioritize suggestions

**Example:**
```typescript
const suggestions = await orchestrator.generateFollowUp({
  transcription: "...",
  soapNotes: soap
});
// Returns: [{ type: 'lab-test', description: '...', priority: 'high' }]
```

## Installation

### Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key (or other LLM provider)
- Access to ai-med-agents library

### Setup

```bash
# Clone repository
git clone https://github.com/AI-Empower-360/ai-orchestrator.git
cd ai-orchestrator

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Build
npm run build

# Run
npm run dev
```

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3002
HOST=localhost

# LLM Provider (OpenAI)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=2000

# AI Med Agents Library
USE_RULE_BASED_FALLBACK=true
CACHE_TTL=3600

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Backend Integration
BACKEND_URL=http://localhost:3001
API_KEY=your-api-key
```

## Usage

### Integration with ai-med-agents

```typescript
import {
  getRuleBasedSOAPNotes,
  buildSOAPGenerateMessages,
  SOAP_JSON_SCHEMA,
  type SOAPNotes
} from 'ai-med-agents';
import OpenAI from 'openai';

class SOAPAgent {
  private openai: OpenAI;

  async generateSOAP(transcription: string): Promise<SOAPNotes> {
    try {
      // Try LLM first
      const messages = buildSOAPGenerateMessages(transcription);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: SOAP_JSON_SCHEMA
        },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      // Fallback to rule-based
      console.log('LLM unavailable, using rule-based fallback');
      return getRuleBasedSOAPNotes(transcription);
    }
  }
}
```

### As Microservice

```bash
# Start server
npm run dev

# Make request
curl -X POST http://localhost:3002/soap/generate \
  -H "Content-Type: application/json" \
  -d '{
    "transcription": "Patient reports headache for 3 days..."
  }'
```

### As Library

```typescript
import { Orchestrator } from 'ai-orchestrator';

const orchestrator = new Orchestrator({
  openaiApiKey: process.env.OPENAI_API_KEY,
  useCache: true
});

const soap = await orchestrator.generateSOAP({
  transcription: "Patient reports..."
});
```

## API Reference

### POST /soap/generate

Generate SOAP notes from transcription.

**Request:**
```json
{
  "transcription": "Patient reports severe headache...",
  "patientId": "patient-123",
  "useCache": true
}
```

**Response:**
```json
{
  "soap": {
    "subjective": "Patient reports severe headache...",
    "objective": "BP 120/80, HR 75, Temp 98.6F...",
    "assessment": "Tension headache...",
    "plan": "Recommend OTC pain relief..."
  },
  "generatedBy": "llm",
  "confidence": 0.95,
  "cached": false
}
```

### POST /alerts/analyze

Detect clinical alerts.

**Request:**
```json
{
  "transcription": "BP 190/110, HR 125...",
  "soapNotes": { ... }
}
```

**Response:**
```json
{
  "alerts": [
    {
      "severity": "critical",
      "message": "Hypertensive crisis detected",
      "category": "vital-signs",
      "source": "llm"
    }
  ]
}
```

## Development

### Project Structure

```
ai-orchestrator/
├── src/
│   ├── agents/
│   │   ├── soap-agent.ts          # SOAP generation agent
│   │   ├── alerts-agent.ts        # Clinical alerts agent
│   │   └── followup-agent.ts      # Follow-up suggestions agent
│   ├── services/
│   │   ├── llm.service.ts         # LLM provider integration
│   │   ├── cache.service.ts       # Response caching
│   │   └── validation.service.ts  # Output validation
│   ├── controllers/
│   │   ├── soap.controller.ts
│   │   ├── alerts.controller.ts
│   │   └── followup.controller.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   └── error-handler.ts
│   └── main.ts                    # Entry point
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

### Building

```bash
# Development build
npm run build

# Production build
NODE_ENV=production npm run build
```

## Docker Deployment

### Build Image

```bash
docker build -t ai-orchestrator:latest .
```

### Run Container

```bash
docker run -d \
  --name ai-orchestrator \
  -p 3002:3002 \
  -e OPENAI_API_KEY=sk-... \
  -e BACKEND_URL=http://backend:3001 \
  ai-orchestrator:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  orchestrator:
    build: .
    ports:
      - "3002:3002"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - BACKEND_URL=http://backend:3001
    volumes:
      - ./ai-med-agents:/ai-med-agents:ro
    depends_on:
      - backend
```

## Performance

### Benchmarks

| Operation | LLM | Rule-Based |
|-----------|-----|------------|
| SOAP Generation | 2-4s | <50ms |
| Alerts Detection | 1-3s | <30ms |
| Follow-up Suggestions | 2-5s | N/A |

### Optimization Strategies

1. **Response Caching**: Cache identical transcriptions
2. **Parallel Processing**: Process multiple requests concurrently
3. **Batch Requests**: Combine multiple operations
4. **Fallback Priority**: Use rule-based for speed when appropriate

### Caching

```typescript
// Enable caching
const soap = await orchestrator.generateSOAP({
  transcription,
  useCache: true,
  cacheTTL: 3600 // 1 hour
});
```

## Monitoring

### Health Checks

```bash
# Health endpoint
curl http://localhost:3002/health

# Response
{
  "status": "healthy",
  "uptime": 3600,
  "llm": "connected",
  "cache": "active"
}
```

### Metrics

- Request latency (p50, p95, p99)
- LLM vs rule-based usage ratio
- Error rates
- Cache hit ratio

### Logging

```typescript
// Structured logging with Winston
logger.info('SOAP generation complete', {
  method: 'llm',
  duration: 2500,
  cached: false,
  transcriptionLength: 500
});
```

## Error Handling

### Error Types

- **LLMError**: LLM provider issues
- **ValidationError**: Invalid input/output
- **TimeoutError**: Request timeout
- **RateLimitError**: API rate limit exceeded

### Retry Strategy

```typescript
const response = await retry(
  () => llm.generate(prompt),
  {
    retries: 3,
    minTimeout: 1000,
    onRetry: (error, attempt) => {
      logger.warn(`Retry attempt ${attempt}`, { error });
    }
  }
);
```

## Best Practices

1. **Always provide fallback**: Use rule-based when LLM fails
2. **Validate outputs**: Check structure and medical validity
3. **Cache responses**: Reduce costs and improve speed
4. **Monitor usage**: Track LLM costs and performance
5. **Handle timeouts**: Set appropriate timeout values
6. **Log extensively**: Enable debugging and monitoring

## Related Documentation

- [ai-med-agents Library](../ai-med-infrastructure/docs/AI_AGENTS_LIBRARY.md)
- [Backend API Integration](../ai-med-infrastructure/docs/API_REFERENCE.md)
- [Deployment Guide](../ai-med-infrastructure/docs/DEPLOYMENT_GUIDE.md)
- [Full Stack Guide](../ai-med-infrastructure/docs/FULLSTACK_GUIDE.md)

## License

MIT

## Support

For issues or questions:
- GitHub Issues: https://github.com/AI-Empower-360/ai-orchestrator/issues
- Documentation: See `/docs` folder
- Backend Integration: Contact backend team

---

**AI Orchestrator**  
*LLM Orchestration for AI Med Agentic Agent*
