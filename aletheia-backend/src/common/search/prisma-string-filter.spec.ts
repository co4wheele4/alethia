import { Prisma } from '@prisma/client';
import {
  claimOrderBy,
  evidenceOrderBy,
  prismaStringFilter,
} from './prisma-string-filter';
import {
  DeterministicOrderBy,
  TextMatchMode,
} from '../../graphql/enums/search-text-match.enum';

describe('prismaStringFilter (ADR-033)', () => {
  it('returns undefined for empty query', () => {
    expect(
      prismaStringFilter('', TextMatchMode.SUBSTRING, false),
    ).toBeUndefined();
  });

  it('builds case-insensitive substring filter', () => {
    expect(prismaStringFilter('ab', TextMatchMode.SUBSTRING, false)).toEqual({
      contains: 'ab',
      mode: Prisma.QueryMode.insensitive,
    });
  });

  it('builds exact case-sensitive filter', () => {
    expect(prismaStringFilter('Ab', TextMatchMode.EXACT, true)).toEqual({
      equals: 'Ab',
      mode: Prisma.QueryMode.default,
    });
  });

  it('builds prefix filter', () => {
    expect(prismaStringFilter('pre', TextMatchMode.PREFIX, false)).toEqual({
      startsWith: 'pre',
      mode: Prisma.QueryMode.insensitive,
    });
  });
});

describe('deterministic order helpers', () => {
  it('claimOrderBy uses tie-break id for createdAt sorts', () => {
    expect(claimOrderBy(DeterministicOrderBy.CREATED_AT_ASC)).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('claimOrderBy supports createdAt desc and id sorts', () => {
    expect(claimOrderBy(DeterministicOrderBy.CREATED_AT_DESC)).toEqual([
      { createdAt: 'desc' },
      { id: 'desc' },
    ]);
    expect(claimOrderBy(DeterministicOrderBy.ID_ASC)).toEqual([{ id: 'asc' }]);
    expect(claimOrderBy(DeterministicOrderBy.ID_DESC)).toEqual([
      { id: 'desc' },
    ]);
  });

  it('evidenceOrderBy covers all sort modes and default fallback', () => {
    expect(evidenceOrderBy(DeterministicOrderBy.CREATED_AT_ASC)).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
    expect(evidenceOrderBy(DeterministicOrderBy.CREATED_AT_DESC)).toEqual([
      { createdAt: 'desc' },
      { id: 'desc' },
    ]);
    expect(evidenceOrderBy(DeterministicOrderBy.ID_ASC)).toEqual([
      { id: 'asc' },
    ]);
    expect(evidenceOrderBy(DeterministicOrderBy.ID_DESC)).toEqual([
      { id: 'desc' },
    ]);
    expect(evidenceOrderBy('UNKNOWN' as DeterministicOrderBy)).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('claimOrderBy falls back for unexpected enum values', () => {
    expect(claimOrderBy('UNKNOWN' as DeterministicOrderBy)).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('prismaStringFilter default branch covers unexpected match mode', () => {
    expect(prismaStringFilter('x', 'BAD' as TextMatchMode, false)).toEqual({
      contains: 'x',
      mode: Prisma.QueryMode.insensitive,
    });
  });
});
