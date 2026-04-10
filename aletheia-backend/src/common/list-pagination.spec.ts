import { assertAdr034ListPagination } from './list-pagination';
import { GQL_ERROR_CODES } from '../graphql/errors/graphql-error-codes';

describe('assertAdr034ListPagination', () => {
  it('accepts in-range values', () => {
    expect(() => assertAdr034ListPagination(1, 0)).not.toThrow();
    expect(() => assertAdr034ListPagination(500, 10)).not.toThrow();
  });

  it('rejects limit above cap', () => {
    expect(() => assertAdr034ListPagination(501, 0)).toThrow(
      GQL_ERROR_CODES.INVALID_LIST_PAGINATION,
    );
  });
});
