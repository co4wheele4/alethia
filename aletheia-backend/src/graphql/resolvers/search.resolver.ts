import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { Injectable, Scope, UseGuards } from '@nestjs/common';
import {
  EvidenceSourceKind as PrismaEvidenceSourceKind,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { Claim } from '@models/claim.model';
import { Evidence } from '@models/evidence.model';
import { SearchClaimsInput } from '@inputs/search-claims.input';
import { SearchEvidenceInput } from '@inputs/search-evidence.input';
import { getGqlAuthUserId } from '../utils/gql-auth-user';
import { contractError, GQL_ERROR_CODES } from '../errors/graphql-error-codes';
import {
  ADR033_MAX_SEARCH_LIMIT,
  claimOrderBy,
  evidenceOrderBy,
  prismaStringFilter,
} from '@common/search/prisma-string-filter';
type GqlContext = {
  req?: { user?: { sub?: string; id?: string } };
};

const claimList = () => [Claim];
const evidenceList = () => [Evidence];
const searchClaimsInputType = () => SearchClaimsInput;
const searchEvidenceInputType = () => SearchEvidenceInput;
void claimList();
void evidenceList();
void searchClaimsInputType();
void searchEvidenceInputType();

function claimWorkspaceWhere(authUserId: string): Prisma.ClaimWhereInput {
  return {
    OR: [
      {
        evidenceLinks: {
          some: {
            evidence: {
              sourceDocument: { userId: authUserId },
            },
          },
        },
      },
      {
        evidence: {
          some: {
            document: { userId: authUserId },
          },
        },
      },
    ],
  };
}

function validateSearchPagination(limit: number, offset: number) {
  if (
    !Number.isFinite(limit) ||
    !Number.isFinite(offset) ||
    limit < 1 ||
    offset < 0 ||
    limit > ADR033_MAX_SEARCH_LIMIT
  ) {
    throw contractError(GQL_ERROR_CODES.INVALID_SEARCH_PAGINATION);
  }
}

@Injectable({ scope: Scope.REQUEST })
@Resolver()
@UseGuards(JwtAuthGuard)
export class SearchResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(claimList, {
    description:
      'ADR-033: Non-semantic claim search (deterministic order; required limit/offset).',
  })
  async searchClaims(
    @Args('input', { type: searchClaimsInputType }) input: SearchClaimsInput,
    @Context() ctx?: GqlContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) return [];

    validateSearchPagination(input.limit, input.offset);

    const textFilter = prismaStringFilter(
      input.queryText,
      input.matchMode,
      input.caseSensitive,
    );

    const f = input.filters;
    const createdAt =
      f?.createdAtAfter || f?.createdAtBefore
        ? {
            ...(f.createdAtAfter ? { gte: f.createdAtAfter } : {}),
            ...(f.createdAtBefore ? { lte: f.createdAtBefore } : {}),
          }
        : undefined;

    const evidenceSourceFilter = f?.evidenceSourceType
      ? {
          evidenceLinks: {
            some: {
              evidence: {
                sourceType:
                  f.evidenceSourceType as unknown as PrismaEvidenceSourceKind,
              },
            },
          },
        }
      : undefined;

    const where: Prisma.ClaimWhereInput = {
      AND: [
        claimWorkspaceWhere(authUserId),
        ...(textFilter ? [{ text: textFilter }] : []),
        ...(f?.lifecycle ? [{ status: f.lifecycle }] : []),
        ...(createdAt ? [{ createdAt }] : []),
        ...(evidenceSourceFilter ? [evidenceSourceFilter] : []),
      ],
    };

    return this.prisma.claim.findMany({
      where,
      orderBy: claimOrderBy(input.orderBy),
      take: input.limit,
      skip: input.offset,
    });
  }

  @Query(evidenceList, {
    description:
      'ADR-033: Non-semantic evidence search (deterministic order; required limit/offset).',
  })
  async searchEvidence(
    @Args('input', { type: searchEvidenceInputType })
    input: SearchEvidenceInput,
    @Context() ctx?: GqlContext,
  ) {
    const authUserId = getGqlAuthUserId(ctx);
    if (!authUserId) return [];

    validateSearchPagination(input.limit, input.offset);

    const textFilter = prismaStringFilter(
      input.queryText,
      input.matchMode,
      input.caseSensitive,
    );

    const visibilityWhere: Prisma.EvidenceWhereInput = {
      OR: [
        { sourceDocument: { userId: authUserId } },
        {
          sourceType: {
            in: [
              PrismaEvidenceSourceKind.URL,
              PrismaEvidenceSourceKind.HTML_PAGE,
            ],
          },
          createdBy: authUserId,
        },
      ],
    };

    const f = input.filters;
    const createdAt =
      f?.createdAtAfter || f?.createdAtBefore
        ? {
            ...(f.createdAtAfter ? { gte: f.createdAtAfter } : {}),
            ...(f.createdAtBefore ? { lte: f.createdAtBefore } : {}),
          }
        : undefined;

    const sourceTypeWhere = f?.sourceType
      ? {
          sourceType: f.sourceType as unknown as PrismaEvidenceSourceKind,
        }
      : undefined;

    const textOr =
      textFilter === undefined
        ? undefined
        : {
            OR: [{ snippet: textFilter }, { sourceUrl: textFilter }],
          };

    const where: Prisma.EvidenceWhereInput = {
      AND: [
        visibilityWhere,
        ...(sourceTypeWhere ? [sourceTypeWhere] : []),
        ...(createdAt ? [{ createdAt }] : []),
        ...(textOr ? [textOr] : []),
      ],
    };

    return this.prisma.evidence.findMany({
      where,
      orderBy: evidenceOrderBy(input.orderBy),
      take: input.limit,
      skip: input.offset,
    });
  }
}
