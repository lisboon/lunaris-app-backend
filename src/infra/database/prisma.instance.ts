import { PrismaClient } from '@prisma/client';

const isCli =
  process.env.npm_lifecycle_event === 'cli' ||
  process.env.npm_lifecycle_event === 'command';

const isProduction = process.env.NODE_ENV === 'production';

const prisma = new PrismaClient({
  log:
    isCli || isProduction
      ? ['warn', 'error']
      : ['query', 'info', 'warn', 'error'],
});

export default prisma;
