import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";
import { testDatabaseUrl } from "./testDatabaseUrl";

export function integrationClient(): PrismaClient {
  const connectionString = testDatabaseUrl(process.env.DATABASE_URL);
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export async function truncateTables(client: PrismaClient): Promise<void> {
  testDatabaseUrl(process.env.DATABASE_URL);
  const database = await client.$queryRaw<{ database: string }[]>`SELECT current_database() AS database`;
  if (database[0]?.database !== "carbonbox_test") throw new Error("Refusing to truncate a non-test database");
  await client.$executeRaw`TRUNCATE TABLE uploads CASCADE`;
}
