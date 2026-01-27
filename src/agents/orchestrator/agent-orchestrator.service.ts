import { Injectable, Logger } from '@nestjs/common';
import { SOAPAgentService } from '../soap/soap-agent.service';
import { ClinicalAlertAgentService } from '../clinical/clinical-alert-agent.service';

export interface AgentTask {
  type: 'generate_soap' | 'update_soap' | 'analyze_alerts' | 'combined';
  transcriptionText: string;
  existingSOAP?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  };
  sessionId: string;
}

export interface AgentResult {
  soapNotes?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  alerts?: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    category?: string;
    recommendations?: string[];
  }>;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
    private soapAgent: SOAPAgentService,
    private clinicalAlertAgent: ClinicalAlertAgentService,
  ) {}

  /**
   * Orchestrate agent tasks
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    this.logger.log(
      `Executing agent task: ${task.type} for session ${task.sessionId}`,
    );

    const result: AgentResult = {};

    try {
      // Generate or update SOAP notes
      if (
        task.type === 'generate_soap' ||
        task.type === 'update_soap' ||
        task.type === 'combined'
      ) {
        if (task.existingSOAP && task.type === 'update_soap') {
          result.soapNotes = await this.soapAgent.updateSOAPNotes(
            task.existingSOAP as any,
            task.transcriptionText,
          );
        } else {
          result.soapNotes = await this.soapAgent.generateSOAPNotes(
            task.transcriptionText,
          );
        }
      }

      // Generate clinical alerts
      if (task.type === 'analyze_alerts' || task.type === 'combined') {
        result.alerts = await this.clinicalAlertAgent.analyzeAndGenerateAlerts(
          task.transcriptionText,
          result.soapNotes || task.existingSOAP,
        );
      }

      this.logger.log(
        `Agent task completed successfully for session ${task.sessionId}`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`Agent task failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process transcription and generate both SOAP and alerts
   */
  async processTranscription(
    transcriptionText: string,
    sessionId: string,
    existingSOAP?: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    },
  ): Promise<AgentResult> {
    return this.executeTask({
      type: 'combined',
      transcriptionText,
      existingSOAP,
      sessionId,
    });
  }
}
