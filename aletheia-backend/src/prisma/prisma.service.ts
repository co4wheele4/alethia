import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private readonly hasExplicitDatasourceUrl: boolean;

  constructor() {
    // Prisma 7 in this repo uses the query-compiler client, which requires an adapter.
    // We wire a Postgres adapter backed by `pg` Pool.
    const datasourceUrl = process.env.DATABASE_URL;
    const hasExplicitDatasourceUrl = Boolean(
      datasourceUrl && datasourceUrl.trim().length > 0,
    );

    const connectionString =
      datasourceUrl && datasourceUrl.trim().length > 0
        ? datasourceUrl
        : 'postgresql://user:password@localhost:5432/aletheia_test';

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
    this.hasExplicitDatasourceUrl = hasExplicitDatasourceUrl;
  }

  async onModuleInit() {
    if (!this.hasExplicitDatasourceUrl) {
      // Fail fast in real app boot; unit tests that don't initialize the module can still compile.
      throw new Error('DATABASE_URL is required to initialize PrismaService.');
    }
    // Log which database we're connecting to
    const dbUrl = process.env.DATABASE_URL || '';
    const dbMatch = dbUrl.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : 'unknown';
    this.logger.log(`Connecting to database: ${dbName}`);

    await this.$connect();
    this.logger.log(`Successfully connected to database: ${dbName}`);
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
