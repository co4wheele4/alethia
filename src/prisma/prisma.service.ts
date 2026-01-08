import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    // Log which database we're connecting to
    const dbUrl = process.env.DATABASE_URL || '';
    const dbMatch = dbUrl.match(/\/([^\/\?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : 'unknown';
    this.logger.log(`Connecting to database: ${dbName}`);
    
    await this.$connect();
    this.logger.log(`Successfully connected to database: ${dbName}`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
