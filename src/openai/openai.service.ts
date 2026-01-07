import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
