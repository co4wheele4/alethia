import { Test, TestingModule } from '@nestjs/testing';
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
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
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
    expect(module).toBeDefined();
  });

  it('should provide AuthService', () => {
    const authService = module.get<AuthService>(AuthService);
    expect(authService).toBeDefined();
  });

  it('should provide JwtStrategy', () => {
    const jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    expect(jwtStrategy).toBeDefined();
  });

  it('should provide AuthResolver', () => {
    const authResolver = module.get<AuthResolver>(AuthResolver);
    expect(authResolver).toBeDefined();
  });

  it('should provide PrismaService', () => {
    const prismaService = module.get<PrismaService>(PrismaService);
    expect(prismaService).toBeDefined();
  });

  it('should export AuthService', () => {
    const exportedService = module.get<AuthService>(AuthService);
    expect(exportedService).toBeDefined();
  });

  it('should export JwtModule', () => {
    const jwtModule = module.get(JwtModule);
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
      const testModule = await Test.createTestingModule({
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

      const jwtModule = testModule.get(JwtModule);
      expect(jwtModule).toBeDefined();
      await testModule.close();
    });

    it('should use default JWT_SECRET when not provided', async () => {
      const testModule = await Test.createTestingModule({
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

      const jwtModule = testModule.get(JwtModule);
      expect(jwtModule).toBeDefined();
      await testModule.close();
    });

    it('should use JWT_EXPIRES_IN from config when provided', async () => {
      process.env.JWT_EXPIRES_IN = '30d';
      const testModule = await Test.createTestingModule({
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

      const jwtModule = testModule.get(JwtModule);
      expect(jwtModule).toBeDefined();
      delete process.env.JWT_EXPIRES_IN;
      await testModule.close();
    });

    it('should use default JWT_EXPIRES_IN when not provided', async () => {
      const testModule = await Test.createTestingModule({
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

      const jwtModule = testModule.get(JwtModule);
      expect(jwtModule).toBeDefined();
      await testModule.close();
    });
  });
});
