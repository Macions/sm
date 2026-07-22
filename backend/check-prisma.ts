// check-prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Dostępne modele Prisma:');
console.log(Object.keys(prisma).filter(key => !key.startsWith('_')));