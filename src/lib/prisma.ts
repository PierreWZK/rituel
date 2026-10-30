import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Un seul client en dev : le rechargement à chaud recréerait une connexion à chaque modification.
const global_ = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  global_.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

if (process.env.NODE_ENV !== "production") global_.prisma = prisma;
