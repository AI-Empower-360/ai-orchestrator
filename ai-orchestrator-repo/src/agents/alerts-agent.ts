import {
  getRuleBasedAlerts,
  buildAlertsMessages,
  ALERTS_JSON_SCHEMA,
  type ClinicalAlert,
  type SOAPNotes
} from 'ai-med-agents';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

export class AlertsAgent {
  private openai: OpenAI;
  private useRuleBasedFallback: boolean;

  constructor(apiKey: string, options: { useRuleBasedFallback?: boolean } = {}) {
    this.openai = new OpenAI({ apiKey });
    this.useRuleBasedFallback = options.useRuleBasedFallback ?? true;
  }

  /**
   * Detect clinical alerts from transcription and SOAP notes
   */
  async detectAlerts(params: {
    transcription: string;
    soapNotes?: SOAPNotes;
  }): Promise<{
    alerts: ClinicalAlert[];
    generatedBy: 'llm' | 'rule-based';
    duration: number;
  }> {
    const startTime = Date.now();

    try {
      // Try LLM detection first
      const messages = buildAlertsMessages(params.transcription, params.soapNotes);

      logger.info('Detecting clinical alerts with LLM', {
        transcriptionLength: params.transcription.length,
        hasSoapNotes: !!params.soapNotes
      });

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: ALERTS_JSON_SCHEMA
        },
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000')
      });

      const result = JSON.parse(response.choices[0].message.content || '{"alerts":[]}');
      const duration = Date.now() - startTime;

      logger.info('Clinical alerts detected successfully', {
        method: 'llm',
        duration,
        alertCount: result.alerts.length,
        tokensUsed: response.usage?.total_tokens
      });

      return {
        alerts: result.alerts,
        generatedBy: 'llm',
        duration
      };
    } catch (error) {
      logger.warn('LLM alert detection failed, using rule-based fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (!this.useRuleBasedFallback) {
        throw error;
      }

      // Fallback to rule-based detection
      const alerts = getRuleBasedAlerts(params.transcription, params.soapNotes);
      const duration = Date.now() - startTime;

      logger.info('Clinical alerts detected with rule-based fallback', {
        method: 'rule-based',
        duration,
        alertCount: alerts.length
      });

      return {
        alerts,
        generatedBy: 'rule-based',
        duration
      };
    }
  }

  /**
   * Prioritize alerts by severity and category
   */
  prioritizeAlerts(alerts: ClinicalAlert[]): ClinicalAlert[] {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return alerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // If same severity, sort by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }
}
