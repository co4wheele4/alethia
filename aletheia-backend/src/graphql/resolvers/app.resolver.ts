import { Query, Resolver } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { Lesson } from '../../graphql/models/lesson.model';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class AppResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => String)
  hello() {
    return 'Hello, Aletheia!';
  }

  @Query(() => [Lesson])
  @UseGuards(JwtAuthGuard)
  async lessons() {
    return await this.prisma.lesson.findMany();
  }
}
