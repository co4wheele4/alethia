import { getUserIdFromToken } from '../../../lib/utils/jwt';

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

describe('jwt utils', () => {
  it('returns null for missing token', () => {
    expect(getUserIdFromToken(null)).toBeNull();
  });

  it('returns null for non-JWT strings', () => {
    expect(getUserIdFromToken('not-a-jwt')).toBeNull();
    expect(getUserIdFromToken('a.b')).toBeNull();
  });

  it('returns sub when jwtDecode succeeds', () => {
    const { jwtDecode } = jest.requireMock('jwt-decode') as { jwtDecode: jest.Mock };
    jwtDecode.mockReturnValue({ sub: 'user-123' });

    expect(getUserIdFromToken('a.b.c')).toBe('user-123');
  });

  it('returns null when jwtDecode succeeds but sub is missing', () => {
    const { jwtDecode } = jest.requireMock('jwt-decode') as { jwtDecode: jest.Mock };
    jwtDecode.mockReturnValue({ email: 'x@example.com' });

    expect(getUserIdFromToken('a.b.c')).toBeNull();
  });

  it('returns null when jwtDecode throws', () => {
    const { jwtDecode } = jest.requireMock('jwt-decode') as { jwtDecode: jest.Mock };
    jwtDecode.mockImplementation(() => {
      throw new Error('bad token');
    });

    expect(getUserIdFromToken('a.b.c')).toBeNull();
  });
});

