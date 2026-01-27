import { Injectable, Logger } from '@nestjs/common';
import { LLMService, LLMMessage } from '../llm/llm.service';

export interface ClinicalAlert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  category?: string;
  recommendations?: string[];
}

@Injectable()
export class ClinicalAlertAgentService {
  private readonly logger = new Logger(ClinicalAlertAgentService.name);

  constructor(private llmService: LLMService) {}

  /**
   * Analyze transcription and generate clinical alerts
   */
  async analyzeAndGenerateAlerts(
    transcriptionText: string,
    soapNotes?: { subjective?: string; objective?: string; assessment?: string; plan?: string },
  ): Promise<ClinicalAlert[]> {
    if (!this.llmService.isAvailable()) {
      this.logger.log('Using rule-based clinical alert generation (LLM not available)');
      return this.getRuleBasedAlerts(transcriptionText, soapNotes);
    }

    try {
      const context = soapNotes
        ? `SOAP Notes:\n${JSON.stringify(soapNotes, null, 2)}\n\n`
        : '';

      const messages: LLMMessage[] = [
        {
          role: 'system',
          content: `You are a clinical decision support system that analyzes medical conversations and SOAP notes to identify potential clinical alerts.

Generate alerts for:
- Critical findings (chest pain, difficulty breathing, severe symptoms) → severity: "critical"
- Warning signs (abnormal vitals, concerning symptoms, medication interactions) → severity: "warning"
- Important information (new diagnoses, test results, follow-ups needed) → severity: "info"

For each alert, provide:
- severity: "info" | "warning" | "critical"
- message: Clear, actionable alert message
- category: Optional category (e.g., "vitals", "symptoms", "medications", "diagnosis")
- recommendations: Optional array of recommended actions

Return as JSON array of alerts. If no alerts are needed, return empty array.`,
        },
        {
          role: 'user',
          content: `${context}Transcription:\n${transcriptionText}\n\nAnalyze and generate clinical alerts.`,
        },
      ];

      const response = await this.llmService.generateStructuredResponse<{ alerts: ClinicalAlert[] }>(
        messages,
        {
          type: 'object',
          properties: {
            alerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
                  message: { type: 'string' },
                  category: { type: 'string' },
                  recommendations: { type: 'array', items: { type: 'string' } },
                },
                required: ['severity', 'message'],
              },
            },
          },
          required: ['alerts'],
        },
      );

      this.logger.log(`Generated ${response.alerts?.length || 0} clinical alerts via AI`);
      return response.alerts || [];
    } catch (error: any) {
      this.logger.error(`Failed to generate clinical alerts via AI: ${error.message}`, error.stack);
      this.logger.log('Falling back to rule-based alert generation');
      return this.getRuleBasedAlerts(transcriptionText, soapNotes);
    }
  }

  /**
   * Rule-based alert generation (fallback)
   */
  private getRuleBasedAlerts(
    transcriptionText: string,
    soapNotes?: { subjective?: string; objective?: string; assessment?: string; plan?: string },
  ): ClinicalAlert[] {
    const alerts: ClinicalAlert[] = [];
    const lowerText = transcriptionText.toLowerCase();
    const combinedText = [
      transcriptionText,
      soapNotes?.subjective,
      soapNotes?.objective,
      soapNotes?.assessment,
      soapNotes?.plan,
    ].filter(Boolean).join(' ').toLowerCase();

    // Critical alerts - life-threatening conditions
    const criticalKeywords = [
      { pattern: 'chest pain', message: 'Chest pain reported. Rule out cardiac event.' },
      { pattern: 'difficulty breathing', message: 'Difficulty breathing reported. Assess respiratory status immediately.' },
      { pattern: 'shortness of breath', message: 'Shortness of breath reported. Monitor oxygen saturation.' },
      { pattern: 'severe pain', message: 'Severe pain reported. Assess pain level and consider immediate intervention.' },
      { pattern: 'unconscious', message: 'Unconscious state reported. Immediate medical attention required.' },
      { pattern: 'cardiac arrest', message: 'Cardiac arrest mentioned. Activate emergency response immediately.' },
      { pattern: 'stroke', message: 'Stroke symptoms mentioned. Time-sensitive evaluation required.' },
      { pattern: 'seizure', message: 'Seizure activity reported. Monitor and assess neurological status.' },
      { pattern: 'anaphylaxis', message: 'Anaphylaxis suspected. Immediate epinephrine administration may be required.' },
    ];

    for (const { pattern, message } of criticalKeywords) {
      if (combinedText.includes(pattern)) {
        alerts.push({
          severity: 'critical',
          message,
          category: 'symptoms',
          recommendations: [
            'Assess patient immediately',
            'Consider emergency protocols',
            'Monitor vital signs closely',
          ],
        });
        break; // Only one critical alert to avoid alert fatigue
      }
    }

    // Warning alerts - concerning but not immediately life-threatening
    if (alerts.length === 0) {
      const warningKeywords = [
        { pattern: 'high blood pressure', message: 'Elevated blood pressure noted. Monitor and consider treatment.' },
        { pattern: 'hypertension', message: 'Hypertension mentioned. Review blood pressure readings.' },
        { pattern: 'fever', message: 'Fever reported. Monitor temperature and consider infection workup.' },
        { pattern: 'abnormal', message: 'Abnormal finding mentioned. Further evaluation recommended.' },
        { pattern: 'elevated', message: 'Elevated value mentioned. Review and monitor.' },
        { pattern: 'medication interaction', message: 'Potential medication interaction identified. Review medication list.' },
        { pattern: 'allergy', message: 'Allergy mentioned. Verify and document in patient record.' },
        { pattern: 'diabetes', message: 'Diabetes mentioned. Monitor glucose levels and review management.' },
      ];

      for (const { pattern, message } of warningKeywords) {
        if (combinedText.includes(pattern) && alerts.length < 3) {
          alerts.push({
            severity: 'warning',
            message,
            category: 'clinical',
            recommendations: ['Review patient record', 'Consider additional monitoring'],
          });
        }
      }
    }

    // Info alerts - general notifications
    if (alerts.length === 0) {
      alerts.push({
        severity: 'info',
        message: 'New clinical information recorded. Please review SOAP notes.',
        category: 'general',
        recommendations: ['Review updated SOAP notes', 'Verify documentation accuracy'],
      });
    }

    return alerts;
  }
}
