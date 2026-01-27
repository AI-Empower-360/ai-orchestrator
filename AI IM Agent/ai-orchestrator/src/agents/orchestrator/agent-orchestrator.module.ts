import { Module } from '@nestjs/common';
import { AgentOrchestratorService } from './agent-orchestrator.service';
import { SOAPAgentModule } from '../soap/soap-agent.module';
import { ClinicalAlertAgentModule } from '../clinical/clinical-alert-agent.module';

@Module({
  imports: [SOAPAgentModule, ClinicalAlertAgentModule],
  providers: [AgentOrchestratorService],
  exports: [AgentOrchestratorService],
})
export class AgentOrchestratorModule {}
