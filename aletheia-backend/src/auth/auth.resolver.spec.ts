import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { User } from '@prisma/client';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: AuthService;

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return access token', async () => {
      const mockAccessToken = 'mock-jwt-token';

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockReturnValue({
        access_token: mockAccessToken,
        user: mockUser,
      });

      const result = await resolver.login('test@example.com', 'password');

      expect(result).toBe(mockAccessToken);
      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password',
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error when credentials are invalid', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');

      jest
        .spyOn(authService, 'validateUser')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(
        resolver.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
