import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../generated/prisma/client";

export function testDatabaseUrl(value: string | undefined): string {
  if (!value) throw new Error("Set DATABASE_URL to the local carbonbox_test database");
  const url = new URL(value);
  if (url.pathname !== "/carbonbox_test" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || !["postgresql:", "postgres:"].includes(url.protocol)) {
    throw new Error("Integration tests only operate on local carbonbox_test");
  }
  return value;
}

export function integrationClient(): PrismaClient {
  const connectionString = testDatabaseUrl(process.env.DATABASE_URL);
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export async function truncateTables(client: PrismaClient): Promise<void> {
  testDatabaseUrl(process.env.DATABASE_URL);
  await client.$executeRaw`TRUNCATE TABLE uploads CASCADE`;
}
