import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private isMissingColumnError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    // Prisma/Postgres "column does not exist" typically includes this phrase; keep it broad.
    return msg.toLowerCase().includes('column') && msg.toLowerCase().includes('does not exist');
  }

  async validateUser(email: string, password: string): Promise<User> {
    let user: User | null = null;
    try {
      // Explicit select for stable auth behavior.
      user = await this.prisma.user.findUnique({
        where: { email },
        // Keep selection explicit so we can provide a clearer error when schema is stale.
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          passwordHash: true,
        },
      });
    } catch (e: unknown) {
      if (this.isMissingColumnError(e)) {
        throw new InternalServerErrorException(
          'Auth schema is not migrated. Apply latest database migrations and restart the backend.',
        );
      }
      throw e;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Backward safety: legacy users may not have password hashes.
    // We do NOT treat that as a successful login, but we do provide a clear message.
    const passwordHash = (user as unknown as { passwordHash?: string | null }).passwordHash ?? null;
    if (!passwordHash) {
      throw new UnauthorizedException('Password not set for this account. Re-register to set a password.');
    }

    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async register(email: string, password: string, name?: string): Promise<User> {
    if (!password || password.trim().length < 8) {
      // Keep message generic; frontend can enforce stronger validation.
      throw new UnauthorizedException('Password is too short');
    }

    // Check if user already exists
    let existingUser: { id: string; passwordHash: string | null; name: string | null; email: string; role: string; createdAt: Date } | null =
      null;
    try {
      existingUser = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          passwordHash: true,
        },
      });
    } catch (e: unknown) {
      if (this.isMissingColumnError(e)) {
        throw new InternalServerErrorException(
          'Auth schema is not migrated. Apply latest database migrations and restart the backend.',
        );
      }
      throw e;
    }

    if (existingUser) {
      // Legacy upgrade path: if the account predates password auth (no hash), allow "register" to set a password.
      if (!existingUser.passwordHash) {
        const passwordHash = await bcrypt.hash(password, 12);
        try {
          return await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              passwordHash,
              // Only set name if the legacy account doesn't already have one.
              name: existingUser.name ?? (name || null),
            },
          });
        } catch (e: unknown) {
          if (this.isMissingColumnError(e)) {
            throw new InternalServerErrorException(
              'Auth schema is not migrated. Apply latest database migrations and restart the backend.',
            );
          }
          throw e;
        }
      }
      throw new UnauthorizedException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user
    try {
      return await this.prisma.user.create({
        data: {
          email,
          name: name || null,
          passwordHash,
        },
      });
    } catch (e: unknown) {
      if (this.isMissingColumnError(e)) {
        throw new InternalServerErrorException(
          'Auth schema is not migrated. Apply latest database migrations and restart the backend.',
        );
      }
      throw e;
    }

  }

  login(user: User) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role || 'USER',
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  validateToken(token: string): {
    email: string;
    sub: string;
    iat?: number;
    exp?: number;
  } {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
