import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { createHash } from 'node:crypto';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private readonly disableNetwork: boolean;

  constructor(private configService: ConfigService) {
    this.disableNetwork =
      String(process.env.OPENAI_DISABLE_NETWORK ?? '').toLowerCase() === 'true';

    // Use ConfigService to get OPENAI_API_KEY from environment variables
    // This ensures consistency with the validated environment configuration
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is required but not found in environment variables',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  async getEmbeddingResult(prompt: string): Promise<string> {
    if (this.disableNetwork) {
      // Deterministic, non-network embedding placeholder for tests/e2e.
      // Not a semantic embedding; strictly a stable, inspectable artifact.
      const sha = createHash('sha256')
        .update(prompt)
        .digest('hex')
        .slice(0, 16);
      return JSON.stringify({
        kind: 'embedding-placeholder',
        sha256_16: sha,
        length: prompt.length,
      });
    }

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
