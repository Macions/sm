// check-prisma.ts
import { PrismaClient } from '@prisma/client';
import { logger } from "./src/utils/logger";
const prisma = new PrismaClient();

logger.debug('Dostępne modele Prisma:');
logger.debug(Object.keys(prisma).filter(key => !key.startsWith('_')));