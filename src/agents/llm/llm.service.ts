import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private openai: OpenAI | null = null;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const forceRuleBased = this.configService.get<string>('FORCE_RULE_BASED', 'false') === 'true';
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.temperature = this.configService.get<number>('OPENAI_TEMPERATURE', 0.7);
    this.maxTokens = this.configService.get<number>('OPENAI_MAX_TOKENS', 2000);

    if (forceRuleBased) {
      this.logger.log('Rule-based mode forced (FORCE_RULE_BASED=true). LLM features disabled for testing.');
      this.openai = null;
    } else if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.logger.log('OpenAI client initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not set. LLM features will be disabled. Using rule-based fallback.');
    }
  }

  /**
   * Check if LLM service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }

  /**
   * Generate a completion from messages
   */
  async generateCompletion(
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    },
  ): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        stream: options?.stream ?? false,
      });

      const content = response.choices[0]?.message?.content || '';
      const usage = response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined;

      return {
        content,
        usage,
      };
    } catch (error: any) {
      this.logger.error(`OpenAI API error: ${error.message}`, error.stack);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }

  /**
   * Generate a streaming completion
   */
  async *generateStreamingCompletion(
    messages: LLMMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): AsyncGenerator<string, void, unknown> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature ?? this.temperature,
        max_tokens: options?.maxTokens ?? this.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error: any) {
      this.logger.error(`OpenAI streaming error: ${error.message}`, error.stack);
      throw new Error(`Failed to stream completion: ${error.message}`);
    }
  }

  /**
   * Generate structured JSON response
   */
  async generateStructuredResponse<T>(
    messages: LLMMessage[],
    schema?: any,
  ): Promise<T> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        response_format: schema ? { type: 'json_object' } : undefined,
      });

      const content = response.choices[0]?.message?.content || '';
      
      if (schema) {
        try {
          return JSON.parse(content) as T;
        } catch (parseError) {
          this.logger.error(`Failed to parse JSON response: ${content}`);
          throw new Error('Invalid JSON response from LLM');
        }
      }

      return content as unknown as T;
    } catch (error: any) {
      this.logger.error(`OpenAI structured response error: ${error.message}`, error.stack);
      throw new Error(`Failed to generate structured response: ${error.message}`);
    }
  }
}
