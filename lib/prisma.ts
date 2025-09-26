import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

const prisma = global.__prisma__ ?? new PrismaClient();

// In dev, keep a single instance across HMR reloads
if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}

export default prisma;
