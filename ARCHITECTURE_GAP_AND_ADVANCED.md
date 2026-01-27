# Architecture Gap Analysis & Advanced Roadmap

**Reference:** Next-Gen AI Agent Architecture – Internal Medicine with Patient Portal (Jan 24, 2026)  
**Purpose:** Compare current implementation to the diagram, close gaps, and define **more advanced** capabilities beyond it.

---

## I. Gap Analysis vs. Diagram

### Doctor Workflow

| Diagram Requirement | Current State | Gap |
|---------------------|---------------|-----|
| **1. Doctor Login** | | |
| Username/Password | ✅ `POST /auth/login` (email + password) | — |
| Multi-factor auth (MFA) | ❌ Not implemented | **Add TOTP/SMS backup** |
| Role-based access (RBAC) | ❌ Single doctor role | **Add roles (e.g. admin, scribe, viewer)** |
| Quick, minimal steps | ✅ Simple login form | — |
| **2. Patient Details Entry** | | |
| Name, MRN, Age, Gender | ❌ No pre-visit form; session has no patient link | **Add patient context to session; MRN in DB** |
| Allergies, History | ⚠️ Allergy keywords in alerts only | **Structured allergies + history per visit** |
| Visit Type/Context | ❌ Not captured | **Add visit type (e.g. follow-up, annual, acute)** |
| Consent confirmation | ❌ Not implemented | **Explicit consent checkbox + audit** |
| Auto-save | ❌ N/A (no patient form) | **Auto-save patient form** |
| **3. Automatic Voice Mode** | | |
| After patient details | ❌ Recording starts without patient step | **Gate voice on completed patient entry** |
| Real-time audio capture | ✅ WebSocket + audio chunks | — |
| Hands-free operation | ✅ Recording controls | — |
| HIPAA-compliant storage | ⚠️ In-memory / mock; no persistent audio | **Encrypted storage + retention policy** |
| **4. Mute / Unmute** | | |
| Toggle / voice command | ✅ Toggle only | **Add voice command (e.g. “mute” / “unmute”)** |
| Visual indicator (Red/Green) | ✅ Muted badge | — |
| HIPAA audit log | ❌ Not logged | **Log mute/unmute with timestamp, session** |
| Auto-pause optional | ❌ Not implemented | **Optional auto-pause after N min silence** |
| **5. Speech-to-Text** | | |
| Medical model (Whisper / AWS Transcribe Medical) | ⚠️ Mock + AWS Transcribe stub in ai-orchestrator | **Production AWS Transcribe Medical** |
| Real-time, high-accuracy | ✅ Real-time WebSocket events | — |
| Continuous processing | ✅ Chunk-based | — |
| **6. NLP & SOAP** | | |
| SOAP auto-generation | ✅ ai-orchestrator + ai-med-agents | — |
| Extract symptoms, vitals, meds, labs | ⚠️ Keywords + LLM; no structured extraction | **Structured extraction (e.g. FHIR-style)** |
| Highlight critical info | ⚠️ Alerts only | **Inline highlights in notes** |
| Follow-up suggestions | ❌ Not implemented | **Add follow-up suggestion agent** |
| User-friendly note display | ✅ Notes panel | — |
| **7. Doctor Review** | | |
| Quick approve/edit | ✅ Edit SOAP in UI | — |
| Inline corrections | ✅ Editable fields | — |
| One-click EHR push | ❌ Not implemented | **EHR push action + status** |
| Voice commands | ❌ Not implemented | **“Approve”, “Send to EHR”, etc.** |
| Color-coded critical flags | ⚠️ Alerts panel only | **Flags in notes + severity colors** |
| **8. EHR Integration** | | |
| FHIR / Epic / Cerner | ❌ Not implemented | **FHIR R4 client; Epic/Cerner adapters** |
| Secure data push | ❌ N/A | **OAuth2 + B2B; encrypted payloads** |
| Auto-sync, pre-fill | ❌ Not implemented | **Pull history; pre-fill from EHR** |
| **9. Predictive & Decision Support** | | |
| Lab result alerts | ⚠️ Rule-based alerts only | **Real lab integration + abnormal alerts** |
| Risk scoring (infection, deterioration) | ❌ Not implemented | **Risk models + scores in UI** |
| Medication conflicts | ⚠️ Keyword “medication interaction” | **Drug–drug interaction API** |
| Follow-up reminders | ❌ Not implemented | **Reminder generation + dashboard** |
| Optional AI suggestions | ⚠️ Alerts + SOAP | **Expand to structured suggestions** |
| **10. Lab / Imaging** | | |
| Automatic lab retrieval | ❌ Not implemented | **Lab connector (e.g. FHIR DiagnosticReport)** |
| Imaging summaries / AI annotations | ❌ Not implemented | **Imaging module + optional AI** |
| Abnormal result highlighting | ❌ N/A | **Flag abnormals in UI** |
| **11. End-of-Day Summary** | | |
| Consolidated notes | ❌ Not implemented | **Daily summary view + export** |
| Pending follow-ups / labs | ❌ Not implemented | **Todo list from visits** |
| Daily efficiency metrics | ❌ Not implemented | **Basic metrics (visits, note time)** |
| Exportable PDF / EHR-ready | ✅ Patient PDF export; ❌ doctor EOD | **Doctor EOD PDF + EHR-ready bundle** |

### Patient Portal

| Diagram Requirement | Current State | Gap |
|---------------------|---------------|-----|
| Secure login | ✅ `POST /auth/patient/login` (email + access code) | — |
| View latest labs | ✅ `GET /api/patient/labs` + UI | — |
| View upcoming appointments | ✅ `GET /api/patient/appointments` + UI | — |
| View medications & dosages | ✅ `GET /api/patient/medications` + UI | — |
| AI explanations in layman terms | ❌ Raw data only | **LLM “explain this lab/med” in simple language** |
| Download PDF reports | ✅ Labs + summaries PDF export | — |
| Notifications / reminders | ❌ Not implemented | **In-app + optional email/push** |

### Compliance & Security

| Diagram Requirement | Current State | Gap |
|---------------------|---------------|-----|
| HIPAA / PHI protection | ⚠️ Docs + no-PHI-in-logs; partial | **Full PHI handling + BAA** |
| Encryption (AES-256 / TLS) | ⚠️ TLS in prod; at-rest varies | **KMS + encrypted RDS/S3** |
| Consent management | ❌ Not implemented | **Consent records + revocation** |
| Audit logging | ❌ Not implemented | **Structured audit log (who, what, when)** |
| GDPR / PIPEDA configurable | ❌ Not implemented | **Data residency + consent hooks** |
| Access control & session tracking | ⚠️ JWT; no RBAC | **RBAC + session audit** |

---

## II. “More Advanced” Beyond the Diagram

These go **beyond** the current diagram to make the platform more capable and future-proof.

### 1. **Conversational AI & Voice**

- **Voice commands in exam room:** “Mute,” “Unmute,” “Approve notes,” “Send to EHR,” “Add allergy: penicillin” without touching the UI.
- **Ambient documentation:** Optional continuous listening (with consent) to capture room conversation and attribute to physician vs patient.
- **Multi-turn clarification:** “Can you clarify the dose?” → LLM-driven Q&A to fix SOAP/meds before sign-off.

### 2. **Smarter CDSS & Predictions**

- **Embedded risk scores:** Readmission, sepsis, deterioration risk surfaced next to the encounter (not only in a separate module).
- **Evidence citations:** Every suggestion (e.g. drug, lab, follow-up) links to guideline or literature.
- **Personalized pathways:** Suggestions conditioned on patient history, local formulary, and org protocols.

### 3. **EHR & Interop**

- **FHIR-first:** All external data (labs, imaging, meds, problems) via FHIR R4; internal APIs aligned with FHIR where useful.
- **EHR-agnostic adapters:** Epic, Cerner, etc. behind a single integration interface.
- **Smart pre-fill:** Pull last encounter, active problems, meds, allergies from EHR and pre-populate session context.

### 4. **Patient Experience**

- **Proactive outreach:** “Your recent HbA1c is ready” or “Reminder: colonoscopy due” with optional AI explanation.
- **Guided questions:** Before visit, patient answers structured questionnaires; answers feed into SOAP Subjective.
- **Post-visit summary in plain language:** Auto-generated “What we did today” + “What you need to do” with optional translation.

### 5. **Platform & Ops**

- **Multi-tenant, org-level config:** Per-org branding, feature flags, EHR config, and data residency.
- **Observability:** Tracing across frontend → backend → LLM → EHR; metrics for latency, errors, and usage.
- **Offline-capable scribe:** Local processing + sync when back online for low-connectivity settings.

### 6. **Compliance & Privacy**

- **Consent lifecycle:** Record consent by purpose (e.g. recording, AI analysis, EHR share); support withdrawal.
- **Minimum necessary:** UI and APIs expose only what’s needed for the current role and context.
- **Audit export:** One-click export of audit logs for compliance reviews (e.g. HIPAA, GDPR).

---

## III. Prioritized Roadmap

### Phase 1 – Align with Diagram (Foundations)

1. **Patient details & consent**
   - Add patient context to session (MRN, demographics, allergies, visit type).
   - Pre-visit form with consent checkbox; store consent + timestamp; gate voice on completion.
   - Auto-save form.

2. **Mute/unmute audit**
   - Log mute/unmute events (session, user, timestamp) to audit store.

3. **Production transcription**
   - Replace mock with AWS Transcribe Medical (or equivalent) in ai-orchestrator/backend.

4. **Audit logging**
   - Structured audit log for auth, PHI access, note edits, EHR push, mute events.

### Phase 2 – Diagram Completeness

5. **MFA + RBAC**
   - TOTP (or SMS backup) for doctor login; roles (e.g. admin, physician, scribe) and enforcement.

6. **EHR integration (FHIR)**
   - FHIR R4 client; “Push to EHR” from review step; pre-fill from EHR where available.

7. **Lab/imaging**
   - Lab connector (e.g. FHIR DiagnosticReport); abnormal highlighting; optional imaging + summaries.

8. **Predictive & CDSS**
   - Lab alerts, medication interaction checks, simple risk scores; surface in UI.

9. **End-of-day summary**
   - Daily consolidated view, pending follow-ups, basic metrics, PDF export.

10. **Patient portal upgrades**
    - AI “explain in plain language” for labs/meds; notifications for new results and upcoming visits.

### Phase 3 – Advanced

11. **Voice commands**
    - “Mute,” “Unmute,” “Approve,” “Send to EHR” via voice.

12. **Advanced CDSS**
    - Evidence citations, personalized pathways, embedded risk models.

13. **Offline-capable scribe**
    - Local capture + sync when online.

14. **Multi-tenant & observability**
    - Org-level config, feature flags, tracing, and metrics.

---

## IV. Where to Implement

| Area | Repo(s) |
|------|---------|
| Patient details, consent, session context | ai-med-frontend, ai-med-backend |
| MFA, RBAC, audit log | ai-med-backend, shared auth |
| Mute/unmute audit | ai-med-backend (WebSocket/gateway), audit service |
| Transcription (AWS Transcribe Medical) | ai-orchestrator or ai-med-backend |
| SOAP, alerts, follow-up suggestions | ai-med-agents, ai-orchestrator |
| EHR, lab, imaging | ai-med-infrastructure (e.g. ai-med-ehr-integration, lab-imaging modules), backend |
| Patient “explain” & notifications | ai-med-backend, ai-med-frontend-patient |
| End-of-day summary | ai-med-backend, ai-med-frontend |
| Voice commands | ai-orchestrator (or dedicated voice service), frontend |
| Infra, KMS, RDS, secrets | ai-med-infrastructure (Terraform) |

---

## V. Implementation Notes (Quick Wins)

- **Session ↔ Patient:** Add `patientId` (FK) to `Session`; create session only after patient form + consent. Add `mrn` to `Patient` (or separate visit context).
- **Consent:** New `consent` table or JSONB on session: `{ recording: boolean, aiAnalysis: boolean, ehrShare: boolean, consentedAt, ip? }`.
- **Mute audit:** In transcription gateway, on `mute`/`unmute` (or equivalent) event, write to `audit_log` (e.g. `action`, `sessionId`, `userId`, `timestamp`).
- **Pre-visit form:** New dashboard step or modal before “Start recording”: patient lookup/select or create, MRN, allergies, visit type, consent checkboxes, auto-save on blur.
- **ai-med-agents:** Add `buildFollowUpSuggestionsMessages` + schema for follow-up suggestions; call from orchestrator after SOAP generation.

---

## VI. Summary

- **Gap vs. diagram:** Biggest gaps are **patient details + consent**, **MFA/RBAC**, **EHR/lab/imaging integration**, **predictive CDSS**, **end-of-day summary**, **mute audit**, and **patient AI explanations + notifications**.
- **Advanced:** Voice commands, ambient documentation, evidence-backed CDSS, FHIR-first interop, proactive patient outreach, multi-tenant platform, and offline scribe extend the diagram toward a next-gen platform.
- Use **Phase 1 → 2 → 3** as the implementation order; Phase 1 unlocks diagram-aligned flows, Phase 2 fills remaining diagram items, Phase 3 adds differentiators.
