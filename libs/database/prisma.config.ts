import path from "node:path";
import type { PrismaConfig } from "prisma";

export default {
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "schema", "migrations"),
  },
  views: {
    path: path.join("db", "views"),
  },
  typedSql: {
    path: path.join("db", "queries"),
  },
} satisfies PrismaConfig;
