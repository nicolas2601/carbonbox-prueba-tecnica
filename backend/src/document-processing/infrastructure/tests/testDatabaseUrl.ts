export function testDatabaseUrl(value: string | undefined): string {
  if (!value) throw new Error("Set DATABASE_URL to the local carbonbox_test database");
  const url = new URL(value);
  if (url.pathname !== "/carbonbox_test" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || !["postgresql:", "postgres:"].includes(url.protocol)) {
    throw new Error("Integration tests only operate on local carbonbox_test");
  }
  return value;
}
