import "dotenv/config";
import { defineConfig } from "prisma/config";

// The fallback keeps `prisma generate` working on a fresh clone before .env exists.
const DEFAULT_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/document_processing";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL },
});
