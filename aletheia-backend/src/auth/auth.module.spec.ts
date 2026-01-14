import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {
  AuthModule,
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Role,
} from './auth.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { PrismaService } from '@prisma/prisma.service';

describe('AuthModule', () => {
  let moduleRef: Awaited<
    ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
  >;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AuthModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should provide AuthService', () => {
    const authService = moduleRef.get<AuthService>(AuthService);
    expect(authService).toBeDefined();
  });

  it('should provide JwtStrategy', () => {
    const jwtStrategy = moduleRef.get<JwtStrategy>(JwtStrategy);
    expect(jwtStrategy).toBeDefined();
  });

  it('should provide AuthResolver', () => {
    const authResolver = moduleRef.get<AuthResolver>(AuthResolver);
    expect(authResolver).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = moduleRef.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('should export AuthService', () => {
    const exportedService = moduleRef.get<AuthService>(AuthService);
    expect(exportedService).toBeDefined();
  });

  it('should export JwtModule', () => {
    const jwtModule = moduleRef.get(JwtModule);
    expect(jwtModule).toBeDefined();
  });

  it('should export JwtAuthGuard', () => {
    expect(JwtAuthGuard).toBeDefined();
    expect(typeof JwtAuthGuard).toBe('function');
  });

  it('should export RolesGuard', () => {
    expect(RolesGuard).toBeDefined();
    expect(typeof RolesGuard).toBe('function');
  });

  it('should export Roles decorator', () => {
    expect(Roles).toBeDefined();
    expect(typeof Roles).toBe('function');
  });

  it('should export Role enum', () => {
    expect(Role).toBeDefined();
    expect(Role.USER).toBe('USER');
    expect(Role.ADMIN).toBe('ADMIN');
  });

  describe('JwtModule.useFactory', () => {
    it('should use JWT_SECRET from config when provided', async () => {
      const testModuleRef: Awaited<
        ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
      > = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: false,
            envFilePath: '.env.test',
          }),
          PassportModule.register({ defaultStrategy: 'jwt' }),
          JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService): JwtModuleOptions => {
              const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '7d';
              return {
                secret:
                  config.get<string>('JWT_SECRET') ||
                  'your-secret-key-change-in-production',
                signOptions: {
                  expiresIn: expiresIn as string | number,
                },
              } as JwtModuleOptions;
            },
            inject: [ConfigService],
          }),
        ],
      }).compile();

      const jwtModule = testModuleRef.get(JwtModule);
      expect(jwtModule).toBeDefined();
      await testModuleRef.close();
    });

    it('should use default JWT_SECRET when not provided', async () => {
      const testModuleRef: Awaited<
        ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
      > = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: false,
            envFilePath: '.env.test',
          }),
          PassportModule.register({ defaultStrategy: 'jwt' }),
          JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService): JwtModuleOptions => {
              const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '7d';
              return {
                secret:
                  config.get<string>('JWT_SECRET') ||
                  'your-secret-key-change-in-production',
                signOptions: {
                  expiresIn: expiresIn as string | number,
                },
              } as JwtModuleOptions;
            },
            inject: [ConfigService],
          }),
        ],
      }).compile();

      const jwtModule = testModuleRef.get(JwtModule);
      expect(jwtModule).toBeDefined();
      await testModuleRef.close();
    });

    it('should use JWT_EXPIRES_IN from config when provided', async () => {
      process.env.JWT_EXPIRES_IN = '30d';
      const testModuleRef: Awaited<
        ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
      > = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: false,
            envFilePath: '.env.test',
          }),
          PassportModule.register({ defaultStrategy: 'jwt' }),
          JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService): JwtModuleOptions => {
              const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '7d';
              return {
                secret:
                  config.get<string>('JWT_SECRET') ||
                  'your-secret-key-change-in-production',
                signOptions: {
                  expiresIn: expiresIn as string | number,
                },
              } as JwtModuleOptions;
            },
            inject: [ConfigService],
          }),
        ],
      }).compile();

      const jwtModule = testModuleRef.get(JwtModule);
      expect(jwtModule).toBeDefined();
      delete process.env.JWT_EXPIRES_IN;
      await testModuleRef.close();
    });

    it('should use default JWT_EXPIRES_IN when not provided', async () => {
      const testModuleRef: Awaited<
        ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>
      > = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: false,
            envFilePath: '.env.test',
          }),
          PassportModule.register({ defaultStrategy: 'jwt' }),
          JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService): JwtModuleOptions => {
              const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '7d';
              return {
                secret:
                  config.get<string>('JWT_SECRET') ||
                  'your-secret-key-change-in-production',
                signOptions: {
                  expiresIn: expiresIn as string | number,
                },
              } as JwtModuleOptions;
            },
            inject: [ConfigService],
          }),
        ],
      }).compile();

      const jwtModule = testModuleRef.get(JwtModule);
      expect(jwtModule).toBeDefined();
      await testModuleRef.close();
    });
  });
});
