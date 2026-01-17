import { Module, Global } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
