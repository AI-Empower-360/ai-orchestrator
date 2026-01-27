import { Module } from '@nestjs/common';
import { ClinicalAlertAgentService } from './clinical-alert-agent.service';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [LLMModule],
  providers: [ClinicalAlertAgentService],
  exports: [ClinicalAlertAgentService],
})
export class ClinicalAlertAgentModule {}
