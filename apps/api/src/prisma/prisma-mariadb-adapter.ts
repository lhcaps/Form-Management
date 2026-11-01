import { PrismaMariaDb } from '@prisma/adapter-mariadb';

export function createPrismaMariaDbAdapter(
  databaseUrl = process.env.DATABASE_URL,
): PrismaMariaDb {
  if (!databaseUrl)
    throw new Error(
      'DATABASE_URL is required to initialize the Prisma MariaDB adapter.',
    );

  const url = new URL(databaseUrl);
  if (url.protocol !== 'mysql:')
    throw new Error(
      'DATABASE_URL must use the mysql:// scheme for the Prisma MariaDB adapter.',
    );

  const database = decodeURIComponent(url.pathname.replace(/^\//u, ''));
  if (!database) throw new Error('DATABASE_URL must include a database name.');

  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: Number(url.searchParams.get('connection_limit') ?? 10),
    connectTimeout: Number(url.searchParams.get('connect_timeout') ?? 5) * 1000,
    acquireTimeout: Number(url.searchParams.get('pool_timeout') ?? 10) * 1000,
    idleTimeout: 300,
  });
}
