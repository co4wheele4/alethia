import { registerEnumType } from '@nestjs/graphql';

/** ADR-033: Mechanical string match shape (no fuzzy / similarity). */
export enum TextMatchMode {
  EXACT = 'EXACT',
  PREFIX = 'PREFIX',
  SUBSTRING = 'SUBSTRING',
}

registerEnumType(TextMatchMode, {
  name: 'TextMatchMode',
  description:
    'ADR-033: Exact, prefix, or substring match (no fuzzy or similarity).',
});

/** ADR-033: Deterministic ordering only (no relevance). */
export enum DeterministicOrderBy {
  CREATED_AT_ASC = 'CREATED_AT_ASC',
  CREATED_AT_DESC = 'CREATED_AT_DESC',
  ID_ASC = 'ID_ASC',
  ID_DESC = 'ID_DESC',
}

registerEnumType(DeterministicOrderBy, {
  name: 'DeterministicOrderBy',
  description:
    'ADR-033: Sort key for search results (createdAt or id only; ascending or descending).',
});
