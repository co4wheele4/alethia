import 'dotenv/config';

export const prismaConfig = {
  datasourceUrl: process.env.DATABASE_URL!,
};