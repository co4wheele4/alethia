import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const moduleRef: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>["compile"]>> = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
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
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
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
      const newUser = {
        ...mockUser,
        email: 'new@example.com',
        name: 'New User',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(newUser);

      const result = await service.register('new@example.com', 'New User');

      expect(result).toEqual(newUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: 'New User',
        },
      });
    });

    it('should create user without name when name is not provided', async () => {
      const newUser = {
        ...mockUser,
        email: 'new@example.com',
        name: null,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(newUser);

      const result = await service.register('new@example.com');

      expect(result).toEqual(newUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          name: null,
        },
      });
    });

    it('should throw UnauthorizedException when user already exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(
        service.register('test@example.com', 'Test User'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.register('test@example.com', 'Test User'),
      ).rejects.toThrow('User with this email already exists');
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });
});
