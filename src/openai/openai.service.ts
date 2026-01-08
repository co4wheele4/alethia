import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    // Use ConfigService to get OPENAI_API_KEY from environment variables
    // This ensures consistency with the validated environment configuration
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required but not found in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async getEmbeddingResult(prompt: string): Promise<string> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: prompt,
    });
    const vector = response.data[0].embedding;
    // You could store this vector in the DB (pgvector) for semantic search
    return JSON.stringify(vector);
  }

  async ask(prompt: string): Promise<string> {
    return this.getEmbeddingResult(prompt);
  }
}
