# Testing Mode - Rule-Based Generation

## Overview

The AI Orchestrator supports a **rule-based testing mode** that allows you to test the system without requiring an OpenAI API key. This mode uses pattern matching and rule-based logic to generate SOAP notes and clinical alerts.

## Enabling Testing Mode

### Option 1: Force Rule-Based Mode

Set the environment variable to force rule-based generation:

```env
FORCE_RULE_BASED=true
```

This will:
- ✅ Disable all LLM API calls
- ✅ Use rule-based SOAP note generation
- ✅ Use rule-based clinical alert generation
- ✅ Work without OpenAI API key
- ✅ Perfect for testing and development

### Option 2: No API Key (Automatic Fallback)

Simply don't set `OPENAI_API_KEY`:

```env
# OPENAI_API_KEY not set
```

The system will automatically:
- ✅ Detect missing API key
- ✅ Fall back to rule-based generation
- ✅ Log warnings (but continue working)

## Rule-Based Generation Features

### SOAP Note Generation

The rule-based SOAP generator uses pattern matching to extract:

**Subjective:**
- Keywords: patient, reports, complains, states, feels, symptoms, history
- Extracts patient-reported information

**Objective:**
- Keywords: vital, bp, blood pressure, heart rate, temperature, exam, physical, observed, measured
- Extracts observable findings and vital signs

**Assessment:**
- Keywords: diagnosis, assessment, evaluation, likely, possible, rule out, differential
- Extracts clinical assessments and diagnoses

**Plan:**
- Keywords: plan, order, prescribe, follow, treatment, medication, test, refer
- Extracts treatment plans and orders

### Clinical Alert Generation

The rule-based alert generator identifies:

**Critical Alerts:**
- Chest pain
- Difficulty breathing / Shortness of breath
- Severe pain
- Unconscious
- Cardiac arrest
- Stroke
- Seizure
- Anaphylaxis

**Warning Alerts:**
- High blood pressure / Hypertension
- Fever
- Abnormal findings
- Elevated values
- Medication interactions
- Allergies
- Diabetes

**Info Alerts:**
- General notifications when no critical/warning alerts are found

## Testing Workflow

### 1. Set Up Testing Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env and set:
FORCE_RULE_BASED=true
```

### 2. Start Application

```bash
npm run start:dev
```

You should see:
```
[TranscriptionService] Rule-based mode enabled (FORCE_RULE_BASED=true). Using rule-based generation for testing.
```

### 3. Test Transcription

Start a transcription session and provide test transcriptions:

**Example Test Cases:**

1. **Chest Pain Case:**
   ```
   "Patient presents with chest pain and shortness of breath. 
   Vital signs: BP 140/90, HR 95. 
   Assessment: Possible cardiac event. 
   Plan: Order EKG and cardiac enzymes."
   ```

   Expected:
   - SOAP notes generated with extracted information
   - Critical alert for chest pain
   - Warning alert for elevated blood pressure

2. **Fever Case:**
   ```
   "Patient reports fever and chills for 3 days. 
   Temperature 101.2F. 
   Assessment: Possible infection. 
   Plan: Order CBC and blood cultures."
   ```

   Expected:
   - SOAP notes with fever information
   - Warning alert for fever

3. **Routine Visit:**
   ```
   "Patient reports feeling well. 
   Vital signs stable. 
   Assessment: Healthy. 
   Plan: Continue current medications."
   ```

   Expected:
   - SOAP notes with routine information
   - Info alert (no critical/warning findings)

## Comparison: AI vs Rule-Based

| Feature | AI-Powered | Rule-Based (Testing) |
|---------|-----------|---------------------|
| **SOAP Quality** | High (context-aware) | Good (pattern-based) |
| **Alert Accuracy** | High (intelligent) | Good (keyword-based) |
| **API Key Required** | ✅ Yes | ❌ No |
| **Cost** | Per API call | Free |
| **Latency** | 2-5 seconds | < 100ms |
| **Best For** | Production | Testing/Development |

## Switching Between Modes

### Enable AI Mode (Production)

```env
FORCE_RULE_BASED=false
OPENAI_API_KEY=your-actual-api-key
```

### Enable Testing Mode

```env
FORCE_RULE_BASED=true
# OPENAI_API_KEY not needed
```

## Logs to Watch

### Rule-Based Mode Enabled:
```
[LLMService] Rule-based mode forced (FORCE_RULE_BASED=true). LLM features disabled for testing.
[TranscriptionService] Rule-based mode enabled (FORCE_RULE_BASED=true). Using rule-based generation for testing.
[SOAPAgentService] Using rule-based SOAP note generation (LLM not available)
[ClinicalAlertAgentService] Using rule-based clinical alert generation (LLM not available)
```

### AI Mode Enabled:
```
[LLMService] OpenAI client initialized
[TranscriptionService] Real AI agents enabled
[SOAPAgentService] SOAP notes generated successfully via AI
[ClinicalAlertAgentService] Generated X clinical alerts via AI
```

## Benefits of Testing Mode

✅ **No API Costs** - Test without spending on API calls
✅ **Fast** - Rule-based generation is instant
✅ **Predictable** - Consistent results for testing
✅ **Offline** - Works without internet connection
✅ **Development** - Perfect for local development

## Limitations of Rule-Based Mode

⚠️ **Less Context-Aware** - Doesn't understand medical context as deeply
⚠️ **Keyword-Dependent** - Relies on specific keywords being present
⚠️ **Less Flexible** - Can't adapt to unusual phrasing
⚠️ **No Learning** - Doesn't improve over time

## Recommendation

- **Development/Testing:** Use `FORCE_RULE_BASED=true`
- **Production:** Use AI mode with proper API key
- **CI/CD:** Use rule-based mode for automated tests

---

**Last Updated:** January 2026
