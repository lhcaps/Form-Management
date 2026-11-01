import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// `prisma generate` must be runnable before a local database is provisioned.
// Migration and runtime commands still receive DATABASE_URL from their controlled env.
const databaseUrl = process.env.DATABASE_URL ?? 'mysql://prisma:prisma@127.0.0.1:3306/prisma';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
