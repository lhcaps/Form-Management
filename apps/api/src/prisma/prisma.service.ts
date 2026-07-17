import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaMariaDbAdapter } from './prisma-mariadb-adapter';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Constructing a Nest testing module must not open a connection. The real
    // environment requirement is enforced immediately before `$connect`.
    const adapter = createPrismaMariaDbAdapter(
      process.env.DATABASE_URL ?? 'mysql://prisma:prisma@127.0.0.1:3306/prisma',
    );
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required before Prisma connects.');
    }
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
