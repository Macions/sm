// check-prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

logger.debug('Dostępne modele Prisma:');
logger.debug(Object.keys(prisma).filter(key => !key.startsWith('_')));