import {
  getRuleBasedSOAPNotes,
  buildSOAPGenerateMessages,
  SOAP_JSON_SCHEMA,
  type SOAPNotes,
  type SOAPNotesInput
} from 'ai-med-agents';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

export class SOAPAgent {
  private openai: OpenAI;
  private useRuleBasedFallback: boolean;

  constructor(apiKey: string, options: { useRuleBasedFallback?: boolean } = {}) {
    this.openai = new OpenAI({ apiKey });
    this.useRuleBasedFallback = options.useRuleBasedFallback ?? true;
  }

  /**
   * Generate SOAP notes from transcription using LLM with rule-based fallback
   */
  async generateSOAP(input: SOAPNotesInput): Promise<{
    soap: SOAPNotes;
    generatedBy: 'llm' | 'rule-based';
    duration: number;
  }> {
    const startTime = Date.now();

    try {
      // Try LLM generation first
      const messages = buildSOAPGenerateMessages(input.transcription);
      
      logger.info('Generating SOAP notes with LLM', {
        transcriptionLength: input.transcription.length,
        patientId: input.patientId
      });

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: SOAP_JSON_SCHEMA
        },
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000')
      });

      const soap = JSON.parse(response.choices[0].message.content || '{}');
      const duration = Date.now() - startTime;

      logger.info('SOAP notes generated successfully', {
        method: 'llm',
        duration,
        tokensUsed: response.usage?.total_tokens
      });

      return {
        soap,
        generatedBy: 'llm',
        duration
      };
    } catch (error) {
      logger.warn('LLM generation failed, using rule-based fallback', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (!this.useRuleBasedFallback) {
        throw error;
      }

      // Fallback to rule-based generation
      const soap = getRuleBasedSOAPNotes(input.transcription);
      const duration = Date.now() - startTime;

      logger.info('SOAP notes generated with rule-based fallback', {
        method: 'rule-based',
        duration
      });

      return {
        soap,
        generatedBy: 'rule-based',
        duration
      };
    }
  }

  /**
   * Validate SOAP notes structure
   */
  validateSOAP(soap: SOAPNotes): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!soap.subjective || soap.subjective.trim().length === 0) {
      errors.push('Subjective section is required and cannot be empty');
    }
    if (!soap.objective || soap.objective.trim().length === 0) {
      errors.push('Objective section is required and cannot be empty');
    }
    if (!soap.assessment || soap.assessment.trim().length === 0) {
      errors.push('Assessment section is required and cannot be empty');
    }
    if (!soap.plan || soap.plan.trim().length === 0) {
      errors.push('Plan section is required and cannot be empty');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
