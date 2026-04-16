import { PrismaClient } from '@prisma/client';

const isCli =
  process.env.npm_lifecycle_event === 'cli' ||
  process.env.npm_lifecycle_event === 'command';

const isProduction = process.env.NODE_ENV === 'production';

// Prisma 7 union type requires adapter | accelerateUrl, but direct
// DATABASE_URL connections work fine with neither — cast needed.
const prisma = new PrismaClient({
  log:
    isCli || isProduction
      ? ['warn', 'error']
      : ['query', 'info', 'warn', 'error'],
} as ConstructorParameters<typeof PrismaClient>[0]);

export default prisma;
