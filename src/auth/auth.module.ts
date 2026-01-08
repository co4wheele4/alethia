import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { PrismaService } from '@prisma/prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        return {
          secret:
            configService.get<string>('JWT_SECRET') ||
            'your-secret-key-change-in-production',
          signOptions: {
            expiresIn: expiresIn as string | number,
          },
        } as JwtModuleOptions;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, AuthResolver, PrismaService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

// Export guards and decorators for use in other modules
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { RolesGuard } from './guards/roles.guard';
export { Roles, Role } from './decorators/roles.decorator';
