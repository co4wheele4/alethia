import { Prisma } from '@prisma/client';
import {
  DeterministicOrderBy,
  TextMatchMode,
} from '../../graphql/enums/search-text-match.enum';

/** ADR-033: LIKE/ILIKE via Prisma string filters (no ranking). */
export function prismaStringFilter(
  queryText: string,
  matchMode: TextMatchMode,
  caseSensitive: boolean,
): Prisma.StringFilter | undefined {
  if (queryText === '') return undefined;
  const mode = caseSensitive
    ? Prisma.QueryMode.default
    : Prisma.QueryMode.insensitive;
  switch (matchMode) {
    case TextMatchMode.EXACT:
      return { equals: queryText, mode };
    case TextMatchMode.PREFIX:
      return { startsWith: queryText, mode };
    case TextMatchMode.SUBSTRING:
      return { contains: queryText, mode };
    default:
      return { contains: queryText, mode };
  }
}

export function claimOrderBy(
  order: DeterministicOrderBy,
): Prisma.ClaimOrderByWithRelationInput[] {
  switch (order) {
    case DeterministicOrderBy.CREATED_AT_ASC:
      return [{ createdAt: 'asc' }, { id: 'asc' }];
    case DeterministicOrderBy.CREATED_AT_DESC:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
    case DeterministicOrderBy.ID_ASC:
      return [{ id: 'asc' }];
    case DeterministicOrderBy.ID_DESC:
      return [{ id: 'desc' }];
    default:
      return [{ createdAt: 'asc' }, { id: 'asc' }];
  }
}

export function evidenceOrderBy(
  order: DeterministicOrderBy,
): Prisma.EvidenceOrderByWithRelationInput[] {
  switch (order) {
    case DeterministicOrderBy.CREATED_AT_ASC:
      return [{ createdAt: 'asc' }, { id: 'asc' }];
    case DeterministicOrderBy.CREATED_AT_DESC:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
    case DeterministicOrderBy.ID_ASC:
      return [{ id: 'asc' }];
    case DeterministicOrderBy.ID_DESC:
      return [{ id: 'desc' }];
    default:
      return [{ createdAt: 'asc' }, { id: 'asc' }];
  }
}

export const ADR033_MAX_SEARCH_LIMIT = 200;
