import {
  contractError,
  GQL_ERROR_CODES,
} from '../graphql/errors/graphql-error-codes';

/** ADR-034: Maximum rows returned per list query (operational bound). */
export const ADR034_MAX_LIST_LIMIT = 500;

export function assertAdr034ListPagination(
  limit: number,
  offset: number,
): void {
  if (
    !Number.isFinite(limit) ||
    !Number.isFinite(offset) ||
    limit < 1 ||
    offset < 0 ||
    limit > ADR034_MAX_LIST_LIMIT
  ) {
    throw contractError(GQL_ERROR_CODES.INVALID_LIST_PAGINATION);
  }
}
