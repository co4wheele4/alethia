import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@prisma/prisma.service';
import { User } from '@prisma/client';
// import * as bcrypt from 'bcrypt'; // TODO: Add when password field is added to User model

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateUser(email: string, _password: string): Promise<User> {
    // Note: This is a placeholder. You'll need to add a password field to the User model
    // For now, this is a basic implementation structure
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: Add password field to User model and implement password hashing
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   throw new UnauthorizedException('Invalid credentials');
    // }

    return user;
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
