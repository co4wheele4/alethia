import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@prisma/client';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

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
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') {
                return 'test-secret';
              }
              return undefined;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    strategy = moduleRef.get<JwtStrategy>(JwtStrategy);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  describe('validate', () => {
    it('should return user when found', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
    });

    it('should use role from payload when provided', async () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'ADMIN',
      };
      const userWithoutRole = { ...mockUser, role: null as unknown as string };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(userWithoutRole as User);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        ...userWithoutRole,
        role: 'ADMIN',
      });
    });

    it('should use user role when payload role is not provided', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };
      const userWithRole = { ...mockUser, role: 'ADMIN' };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(userWithRole);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        ...userWithRole,
        role: 'ADMIN',
      });
    });

    it('should use default role when neither payload nor user has role', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };
      const userWithoutRole = { ...mockUser, role: null as unknown as string };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(userWithoutRole as User);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        ...userWithoutRole,
        role: 'USER',
      });
    });

    it('should use default role when user role is undefined', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };
      const userWithoutRole = {
        ...mockUser,
        role: undefined as unknown as string,
      };

      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(userWithoutRole as User);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        ...userWithoutRole,
        role: 'USER',
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { sub: 'non-existent-id', email: 'test@example.com' };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should use default secret when JWT_SECRET not configured', async () => {
      const mockPrismaService = {
        user: {
          findUnique: jest.fn(),
        },
      };

      const moduleRef: Awaited<
        ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
      > = await Test.createTestingModule({
        providers: [
          JwtStrategy,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
          {
            provide: PrismaService,
            useValue: mockPrismaService,
          },
        ],
      }).compile();

      const strategyWithDefault = moduleRef.get<JwtStrategy>(JwtStrategy);
      const payload = { sub: 'user-id', email: 'test@example.com' };

      jest
        .spyOn(mockPrismaService.user, 'findUnique')
        .mockResolvedValue(mockUser);

      const result = await strategyWithDefault.validate(payload);

      expect(result).toEqual(mockUser);
    });
  });
});
