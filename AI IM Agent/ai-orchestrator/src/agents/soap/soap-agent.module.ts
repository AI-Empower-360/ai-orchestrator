import { Module } from '@nestjs/common';
import { SOAPAgentService } from './soap-agent.service';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [LLMModule],
  providers: [SOAPAgentService],
  exports: [SOAPAgentService],
})
export class SOAPAgentModule {}
