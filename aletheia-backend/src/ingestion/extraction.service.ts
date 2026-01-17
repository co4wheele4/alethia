import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { OpenAIService } from '../openai/openai.service';
import { SuggestionKind, SuggestionStatus, Prisma } from '@prisma/client';

interface ExtractedEntity {
  name: string;
  type: string;
  excerpt: string;
  startOffset?: number;
  endOffset?: number;
}

interface ExtractedRelationship {
  subjectName: string;
  subjectType: string;
  relation: string;
  objectName: string;
  objectType: string;
  excerpt: string;
  startOffset?: number;
  endOffset?: number;
}

interface ExtractionResult {
  entities?: ExtractedEntity[];
  relationships?: ExtractedRelationship[];
}

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAIService,
  ) {}

  async proposeExtraction(chunkId: string) {
    const chunk = await this.prisma.documentChunk.findUnique({
      where: { id: chunkId },
    });

    if (!chunk) {
      throw new Error(`Chunk ${chunkId} not found`);
    }

    const prompt = `
Extract entities and relationships from the following text.
Text: "${chunk.content}"

For each entity, provide its name, type, and the exact excerpt from the text.
For each relationship, provide the subject, the relation, the object, and the exact excerpt from the text that describes this relationship.

Return ONLY a JSON object in the following format:
{
  "entities": [
    { "name": "Entity Name", "type": "Entity Type", "excerpt": "exact text from chunk", "startOffset": 0, "endOffset": 10 }
  ],
  "relationships": [
    { 
      "subjectName": "Subject Name", 
      "subjectType": "Subject Type",
      "relation": "RELATION_TYPE",
      "objectName": "Object Name", 
      "objectType": "Object Type",
      "excerpt": "exact text from chunk",
      "startOffset": 0,
      "endOffset": 10
    }
  ]
}

Ensure all excerpts are exact substrings of the input text, and offsets are 0-based.
`;

    const result = (await this.openai.extract(prompt)) as ExtractionResult;

    const suggestions: Prisma.AiExtractionSuggestionCreateManyInput[] = [];

    const findOffset = (
      excerpt: string,
      content: string,
      suggestedStart?: number,
    ) => {
      if (!excerpt) return { start: null, end: null };

      // Try to find the excerpt in the content
      let index = content.indexOf(excerpt);

      // If multiple occurrences, try to find the one closest to suggestedStart
      if (index !== -1 && suggestedStart !== undefined) {
        let bestIndex = index;
        let minDiff = Math.abs(index - suggestedStart);

        let nextIndex = content.indexOf(excerpt, index + 1);
        while (nextIndex !== -1) {
          const diff = Math.abs(nextIndex - suggestedStart);
          if (diff < minDiff) {
            minDiff = diff;
            bestIndex = nextIndex;
          }
          nextIndex = content.indexOf(excerpt, nextIndex + 1);
        }
        index = bestIndex;
      }

      if (index === -1) return { start: null, end: null };
      return { start: index, end: index + excerpt.length };
    };

    if (result.entities) {
      for (const entity of result.entities) {
        const { start, end } = findOffset(
          entity.excerpt,
          chunk.content,
          entity.startOffset,
        );
        suggestions.push({
          chunkId,
          kind: SuggestionKind.ENTITY_MENTION,
          status: SuggestionStatus.PENDING,
          entityName: entity.name,
          entityType: entity.type,
          startOffset: start ?? entity.startOffset,
          endOffset: end ?? entity.endOffset,
          excerpt: entity.excerpt,
        });
      }
    }

    if (result.relationships) {
      for (const rel of result.relationships) {
        const { start, end } = findOffset(
          rel.excerpt,
          chunk.content,
          rel.startOffset,
        );
        suggestions.push({
          chunkId,
          kind: SuggestionKind.RELATIONSHIP,
          status: SuggestionStatus.PENDING,
          subjectName: rel.subjectName,
          subjectType: rel.subjectType,
          objectName: rel.objectName,
          objectType: rel.objectType,
          relation: rel.relation,
          startOffset: start ?? rel.startOffset,
          endOffset: end ?? rel.endOffset,
          excerpt: rel.excerpt,
        });
      }
    }

    if (suggestions.length > 0) {
      await this.prisma.aiExtractionSuggestion.createMany({
        data: suggestions,
      });
    }

    return suggestions;
  }

  async acceptSuggestion(suggestionId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const suggestion = await tx.aiExtractionSuggestion.findUnique({
        where: { id: suggestionId },
      });

      if (!suggestion || suggestion.status !== SuggestionStatus.PENDING) {
        throw new Error('Suggestion not found or already processed');
      }

      if (suggestion.kind === SuggestionKind.ENTITY_MENTION) {
        // 1. Ensure Entity exists
        const entity = await tx.entity.upsert({
          where: {
            name_type: {
              name: suggestion.entityName!,
              type: suggestion.entityType!,
            },
          },
          update: {},
          create: {
            name: suggestion.entityName!,
            type: suggestion.entityType!,
          },
        });

        // 2. Create Mention
        await tx.entityMention.create({
          data: {
            entityId: entity.id,
            chunkId: suggestion.chunkId,
            startOffset: suggestion.startOffset,
            endOffset: suggestion.endOffset,
            excerpt: suggestion.excerpt,
          },
        });
      } else if (suggestion.kind === SuggestionKind.RELATIONSHIP) {
        // 1. Ensure Subject Entity exists
        const subject = await tx.entity.upsert({
          where: {
            name_type: {
              name: suggestion.subjectName!,
              type: suggestion.subjectType!,
            },
          },
          update: {},
          create: {
            name: suggestion.subjectName!,
            type: suggestion.subjectType!,
          },
        });

        // 2. Ensure Object Entity exists
        const object = await tx.entity.upsert({
          where: {
            name_type: {
              name: suggestion.objectName!,
              type: suggestion.objectType!,
            },
          },
          update: {},
          create: {
            name: suggestion.objectName!,
            type: suggestion.objectType!,
          },
        });

        // 3. Ensure Relationship exists
        const relationship = await tx.entityRelationship.create({
          data: {
            fromEntity: subject.id,
            toEntity: object.id,
            relation: suggestion.relation!,
          },
        });

        // 4. Create Evidence
        await tx.entityRelationshipEvidence.create({
          data: {
            relationshipId: relationship.id,
            chunkId: suggestion.chunkId,
            startOffset: suggestion.startOffset,
            endOffset: suggestion.endOffset,
            quotedText: suggestion.excerpt,
          },
        });
      }

      // Mark suggestion as accepted
      return await tx.aiExtractionSuggestion.update({
        where: { id: suggestionId },
        data: { status: SuggestionStatus.ACCEPTED },
      });
    });
  }

  async rejectSuggestion(suggestionId: string) {
    return await this.prisma.aiExtractionSuggestion.update({
      where: { id: suggestionId },
      data: { status: SuggestionStatus.REJECTED },
    });
  }
}
