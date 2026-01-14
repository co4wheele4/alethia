import { Test } from '@nestjs/testing';
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
    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = moduleRef.get<AuthResolver>(AuthResolver);
    authService = moduleRef.get<AuthService>(AuthService);
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

  describe('register', () => {
    it('should return access token after registration', async () => {
      const mockAccessToken = 'mock-jwt-token';
      const newUser = { ...mockUser, email: 'new@example.com' };

      jest.spyOn(authService, 'register').mockResolvedValue(newUser);
      jest.spyOn(authService, 'login').mockReturnValue({
        access_token: mockAccessToken,
        user: newUser,
      });

      const result = await resolver.register('new@example.com', 'New User');

      expect(result).toBe(mockAccessToken);
      expect(authService.register).toHaveBeenCalledWith(
        'new@example.com',
        'New User',
      );
      expect(authService.login).toHaveBeenCalledWith(newUser);
    });

    it('should return access token when registering without name', async () => {
      const mockAccessToken = 'mock-jwt-token';
      const newUser = { ...mockUser, email: 'new@example.com', name: null };

      jest.spyOn(authService, 'register').mockResolvedValue(newUser);
      jest.spyOn(authService, 'login').mockReturnValue({
        access_token: mockAccessToken,
        user: newUser,
      });

      const result = await resolver.register('new@example.com');

      expect(result).toBe(mockAccessToken);
      expect(authService.register).toHaveBeenCalledWith(
        'new@example.com',
        undefined,
      );
      expect(authService.login).toHaveBeenCalledWith(newUser);
    });

    it('should throw error when user already exists', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');

      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(
          new UnauthorizedException('User with this email already exists'),
        );

      await expect(
        resolver.register('existing@example.com', 'Test User'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        resolver.register('existing@example.com', 'Test User'),
      ).rejects.toThrow('User with this email already exists');
    });
  });
});
