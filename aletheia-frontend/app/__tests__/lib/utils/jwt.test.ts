import { jwtDecode } from 'jwt-decode';
import { getUserIdFromToken } from '../../../lib/utils/jwt';

vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
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
    vi.mocked(jwtDecode).mockReturnValue({ sub: 'user-123' });

    expect(getUserIdFromToken('a.b.c')).toBe('user-123');
  });

  it('returns null when jwtDecode succeeds but sub is missing', () => {
    vi.mocked(jwtDecode).mockReturnValue({ email: 'x@example.com' });

    expect(getUserIdFromToken('a.b.c')).toBeNull();
  });

  it('returns null when jwtDecode throws', () => {
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error('bad token');
    });

    expect(getUserIdFromToken('a.b.c')).toBeNull();
  });
});

