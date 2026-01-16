import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@prisma/client';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$10$testhash',
    role: 'USER',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const moduleRef: Awaited<
      ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
    > = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    jwtService = moduleRef.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user when found', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          passwordHash: true,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password',
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.validateUser('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.validateUser('test@example.com', 'wrong-password'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when passwordHash is missing (legacy)', async () => {
      const userWithoutHash = { ...mockUser, passwordHash: null };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(userWithoutHash);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow('Password not set for this account');
    });

    it('should throw InternalServerErrorException when auth schema is stale (missing column)', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue(new Error('column "passwordHash" does not exist'));

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow('Auth schema is not migrated');
    });

    it('should treat non-Error thrown values as missing-column errors when applicable', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue('column "passwordHash" does not exist');

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should rethrow unexpected prisma errors', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue(new Error('boom'));

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow('boom');
    });
  });

  describe('login', () => {
    it('should return access token and user', () => {
      const mockToken = 'mock-jwt-token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = service.login(mockUser);

      expect(result).toEqual({
        access_token: mockToken,
        user: mockUser,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });

    it('should use default role when user role is null', () => {
      const mockToken = 'mock-jwt-token';
      const userWithoutRole = { ...mockUser, role: null as unknown as string };
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = service.login(userWithoutRole as unknown as User);

      expect(result).toEqual({
        access_token: mockToken,
        user: userWithoutRole,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: userWithoutRole.email,
        sub: userWithoutRole.id,
        role: 'USER',
      });
    });

    it('should use default role when user role is undefined', () => {
      const mockToken = 'mock-jwt-token';
      const userWithoutRole = {
        ...mockUser,
        role: undefined as unknown as string,
      };
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = service.login(userWithoutRole as unknown as User);

      expect(result).toEqual({
        access_token: mockToken,
        user: userWithoutRole,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: userWithoutRole.email,
        sub: userWithoutRole.id,
        role: 'USER',
      });
    });
  });

  describe('validateToken', () => {
    it('should return decoded token when valid', () => {
      const mockToken = 'valid-token';
      const mockPayload = {
        email: 'test@example.com',
        sub: 'user-id',
        iat: 1234567890,
        exp: 1234571490,
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);

      const result = service.validateToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken);
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      const mockToken = 'invalid-token';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.validateToken(mockToken)).toThrow(
        UnauthorizedException,
      );
      expect(() => service.validateToken(mockToken)).toThrow('Invalid token');
    });
  });

  describe('register', () => {
    it('should create new user and return user object', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      const newUser = {
        ...mockUser,
        email: 'new@example.com',
        name: 'New User',
        passwordHash: '$2b$10$hash',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(newUser);

      const result = await service.register(
        'new@example.com',
        'Password123!',
        'New User',
      );

      expect(result).toEqual(newUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          passwordHash: true,
        },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: 'New User',
          passwordHash: '$2b$10$hash',
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
    });

    it('should create user without name when name is not provided', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');
      const newUser = {
        ...mockUser,
        email: 'new@example.com',
        name: null,
        passwordHash: '$2b$10$hash',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(newUser);

      const result = await service.register('new@example.com', 'Password123!');

      expect(result).toEqual(newUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          passwordHash: true,
        },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: null,
          passwordHash: '$2b$10$hash',
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
    });

    it('should throw UnauthorizedException when password is too short', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      await expect(
        service.register('new@example.com', 'short', 'New User'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.register('new@example.com', 'short', 'New User'),
      ).rejects.toThrow('Password is too short');
    });

    it('should throw UnauthorizedException when user already exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.register('test@example.com', 'Password123!', 'Test User'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.register('test@example.com', 'Password123!', 'Test User'),
      ).rejects.toThrow('User with this email already exists');
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when schema is stale while checking existing user', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue(new Error('column "passwordHash" does not exist'));

      await expect(
        service.register('new@example.com', 'Password123!', 'New User'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should rethrow unexpected prisma errors while checking existing user', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockRejectedValue(new Error('boom'));

      await expect(
        service.register('new@example.com', 'Password123!', 'New User'),
      ).rejects.toThrow('boom');
    });

    it('should upgrade legacy user without passwordHash by setting a new password', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');

      const legacyUser = { ...mockUser, passwordHash: null, name: null };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(legacyUser);

      const updated = {
        ...mockUser,
        passwordHash: '$2b$10$newhash',
        name: 'Upgraded Name',
      };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updated);

      const result = await service.register(
        mockUser.email,
        'Password123!',
        'Upgraded Name',
      );

      expect(result).toEqual(updated);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: legacyUser.id },
        data: {
          passwordHash: '$2b$10$newhash',
          name: 'Upgraded Name',
        },
      });
    });

    it('should preserve existing legacy user name during upgrade', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');

      const legacyUser = {
        ...mockUser,
        passwordHash: null,
        name: 'Existing Name',
      };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(legacyUser);

      const updated = {
        ...mockUser,
        passwordHash: '$2b$10$newhash',
        name: 'Existing Name',
      };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updated);

      const result = await service.register(
        mockUser.email,
        'Password123!',
        'Ignored Name',
      );

      expect(result).toEqual(updated);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: legacyUser.id },
        data: {
          passwordHash: '$2b$10$newhash',
          name: 'Existing Name',
        },
      });
    });

    it('should set legacy user name to null when not provided', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');

      const legacyUser = { ...mockUser, passwordHash: null, name: null };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(legacyUser);

      const updated = {
        ...mockUser,
        passwordHash: '$2b$10$newhash',
        name: null,
      };
      jest.spyOn(prismaService.user, 'update').mockResolvedValue(updated);

      const result = await service.register(mockUser.email, 'Password123!');

      expect(result).toEqual(updated);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: legacyUser.id },
        data: {
          passwordHash: '$2b$10$newhash',
          name: null,
        },
      });
    });

    it('should throw InternalServerErrorException when schema is stale during legacy upgrade update', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');

      const legacyUser = { ...mockUser, passwordHash: null, name: null };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(legacyUser);
      jest
        .spyOn(prismaService.user, 'update')
        .mockRejectedValue(new Error('column "passwordHash" does not exist'));

      await expect(
        service.register(mockUser.email, 'Password123!', 'Upgraded Name'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should rethrow unexpected errors during legacy upgrade update', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$newhash');

      const legacyUser = { ...mockUser, passwordHash: null, name: null };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(legacyUser);
      jest
        .spyOn(prismaService.user, 'update')
        .mockRejectedValue(new Error('boom'));

      await expect(
        service.register(mockUser.email, 'Password123!', 'Upgraded Name'),
      ).rejects.toThrow('boom');
    });

    it('should throw InternalServerErrorException when schema is stale during user create', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.user, 'create')
        .mockRejectedValue(new Error('column "passwordHash" does not exist'));

      await expect(
        service.register('new@example.com', 'Password123!', 'New User'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should rethrow unexpected errors during user create', async () => {
      const bcrypt = await import('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hash');

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.user, 'create')
        .mockRejectedValue(new Error('boom'));

      await expect(
        service.register('new@example.com', 'Password123!', 'New User'),
      ).rejects.toThrow('boom');
    });
  });
});
