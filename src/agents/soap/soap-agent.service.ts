import { Injectable, Logger } from '@nestjs/common';
import { LLMService, LLMMessage } from '../llm/llm.service';

export interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

@Injectable()
export class SOAPAgentService {
  private readonly logger = new Logger(SOAPAgentService.name);

  constructor(private llmService: LLMService) {}

  /**
   * Generate SOAP notes from transcription text
   */
  async generateSOAPNotes(transcriptionText: string): Promise<SOAPNotes> {
    if (!this.llmService.isAvailable()) {
      this.logger.log(
        'Using rule-based SOAP note generation (LLM not available)',
      );
      return this.getRuleBasedSOAPNotes(transcriptionText);
    }

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `You are a medical assistant that converts clinical conversation transcriptions into structured SOAP notes.

SOAP format:
- Subjective (S): Patient's reported symptoms, history, and concerns
- Objective (O): Observable findings, vital signs, physical exam, lab results
- Assessment (A): Clinical diagnosis, differential diagnosis, problem list
- Plan (P): Treatment plan, medications, follow-up, tests ordered

Guidelines:
- Extract only information mentioned in the transcription
- Use medical terminology appropriately
- Be concise but comprehensive
- If information is missing, indicate "Not mentioned" for that section
- Maintain HIPAA compliance - no patient identifiers in output
- Return structured JSON with keys: subjective, objective, assessment, plan`,
        },
        {
          role: 'user',
          content: `Convert the following clinical conversation transcription into SOAP notes:\n\n${transcriptionText}`,
        },
      ];

      const response =
        await this.llmService.generateStructuredResponse<SOAPNotes>(messages, {
          type: 'object',
          properties: {
            subjective: { type: 'string' },
            objective: { type: 'string' },
            assessment: { type: 'string' },
            plan: { type: 'string' },
          },
          required: ['subjective', 'objective', 'assessment', 'plan'],
        });

      // Validate response
      if (
        !response.subjective ||
        !response.objective ||
        !response.assessment ||
        !response.plan
      ) {
        this.logger.warn(
          'Incomplete SOAP notes from LLM, using rule-based fallback',
        );
        return this.getRuleBasedSOAPNotes(transcriptionText);
      }

      this.logger.log('SOAP notes generated successfully via AI');
      return response;
    } catch (error: any) {
      this.logger.error(
        `Failed to generate SOAP notes via AI: ${error.message}`,
        error.stack,
      );
      this.logger.log('Falling back to rule-based generation');
      // Fallback to rule-based on error
      return this.getRuleBasedSOAPNotes(transcriptionText);
    }
  }

  /**
   * Update existing SOAP notes with new transcription
   */
  async updateSOAPNotes(
    existingSOAP: SOAPNotes,
    newTranscription: string,
  ): Promise<SOAPNotes> {
    if (!this.llmService.isAvailable()) {
      this.logger.log('Using rule-based SOAP note update (LLM not available)');
      return this.mergeSOAPNotes(existingSOAP, newTranscription);
    }

    try {
      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `You are a medical assistant that updates existing SOAP notes with new information from a clinical conversation.

Merge the new information into the existing SOAP notes:
- Add new subjective information to Subjective
- Add new objective findings to Objective
- Update Assessment with new diagnoses or findings
- Add new actions to Plan

Maintain the structure and format of SOAP notes.
Return updated SOAP notes as JSON with keys: subjective, objective, assessment, plan`,
        },
        {
          role: 'user',
          content: `Existing SOAP notes:\n${JSON.stringify(existingSOAP, null, 2)}\n\nNew transcription:\n${newTranscription}\n\nUpdate the SOAP notes with new information.`,
        },
      ];

      const response =
        await this.llmService.generateStructuredResponse<SOAPNotes>(messages, {
          type: 'object',
          properties: {
            subjective: { type: 'string' },
            objective: { type: 'string' },
            assessment: { type: 'string' },
            plan: { type: 'string' },
          },
          required: ['subjective', 'objective', 'assessment', 'plan'],
        });

      this.logger.log('SOAP notes updated successfully via AI');
      return response;
    } catch (error: any) {
      this.logger.error(
        `Failed to update SOAP notes via AI: ${error.message}`,
        error.stack,
      );
      this.logger.log('Falling back to rule-based merge');
      return this.mergeSOAPNotes(existingSOAP, newTranscription);
    }
  }

  /**
   * Rule-based: Generate SOAP notes from transcription using pattern matching
   */
  private getRuleBasedSOAPNotes(transcriptionText: string): SOAPNotes {
    const lowerText = transcriptionText.toLowerCase();
    const lines = transcriptionText
      .split(/[.!?]\s+/)
      .filter((line) => line.trim().length > 0);

    // Extract Subjective (patient-reported symptoms, history)
    const subjectiveKeywords = [
      'patient',
      'reports',
      'complains',
      'states',
      'feels',
      'symptoms',
      'history',
    ];
    const subjectiveLines = lines.filter((line) =>
      subjectiveKeywords.some((keyword) =>
        line.toLowerCase().includes(keyword),
      ),
    );
    const subjective =
      subjectiveLines.length > 0
        ? subjectiveLines.join('. ')
        : transcriptionText.includes('patient') ||
            transcriptionText.includes('reports')
          ? transcriptionText
          : 'Patient information recorded from conversation';

    // Extract Objective (observable findings, vitals, exam)
    const objectiveKeywords = [
      'vital',
      'bp',
      'blood pressure',
      'heart rate',
      'temperature',
      'exam',
      'physical',
      'observed',
      'measured',
    ];
    const objectiveLines = lines.filter((line) =>
      objectiveKeywords.some((keyword) => line.toLowerCase().includes(keyword)),
    );
    const objective =
      objectiveLines.length > 0
        ? objectiveLines.join('. ')
        : lowerText.includes('vital') ||
            lowerText.includes('bp') ||
            lowerText.includes('blood pressure')
          ? 'Vital signs and physical findings mentioned in conversation'
          : 'Objective findings to be documented';

    // Extract Assessment (diagnosis, evaluation)
    const assessmentKeywords = [
      'diagnosis',
      'assessment',
      'evaluation',
      'likely',
      'possible',
      'rule out',
      'differential',
    ];
    const assessmentLines = lines.filter((line) =>
      assessmentKeywords.some((keyword) =>
        line.toLowerCase().includes(keyword),
      ),
    );
    const assessment =
      assessmentLines.length > 0
        ? assessmentLines.join('. ')
        : lowerText.includes('diagnosis') || lowerText.includes('assessment')
          ? transcriptionText
          : 'Clinical assessment based on presentation';

    // Extract Plan (treatment, orders, follow-up)
    const planKeywords = [
      'plan',
      'order',
      'prescribe',
      'follow',
      'treatment',
      'medication',
      'test',
      'refer',
    ];
    const planLines = lines.filter((line) =>
      planKeywords.some((keyword) => line.toLowerCase().includes(keyword)),
    );
    const plan =
      planLines.length > 0
        ? planLines.join('. ')
        : lowerText.includes('plan') ||
            lowerText.includes('order') ||
            lowerText.includes('follow')
          ? transcriptionText
          : 'Treatment plan to be determined';

    return {
      subjective: subjective.trim() || 'Patient information recorded',
      objective: objective.trim() || 'Objective findings to be documented',
      assessment: assessment.trim() || 'Assessment pending',
      plan: plan.trim() || 'Plan to be determined',
    };
  }

  /**
   * Fallback: Merge SOAP notes manually
   */
  private mergeSOAPNotes(existing: SOAPNotes, newText: string): SOAPNotes {
    return {
      subjective: existing.subjective
        ? `${existing.subjective}\n\nAdditional: ${newText}`
        : newText,
      objective: existing.objective
        ? `${existing.objective}\n\nAdditional: ${newText}`
        : newText,
      assessment: existing.assessment
        ? `${existing.assessment}\n\nUpdated: ${newText}`
        : newText,
      plan: existing.plan
        ? `${existing.plan}\n\nAdditional: ${newText}`
        : newText,
    };
  }
}
