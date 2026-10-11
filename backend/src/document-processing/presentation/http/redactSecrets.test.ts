import Fastify from "fastify";
import { expect, it } from "vitest";
import { HTTP_LOG_REDACTION, redactSecrets } from "./redactSecrets";

it.each([
  ["postgresql://user:password@host/db", "postgresql://***@host/db"],
  ["HTTPS://token@host/path", "HTTPS://***@host/path"],
  ["mysql://user:p%40ss@host/db and postgres://other:secret@host2/db", "mysql://***@host/db and postgres://***@host2/db"],
  ["postgresql://host/db", "postgresql://host/db"],
  ["Connection refused", "Connection refused"],
  ["", ""],
])("Masks URL user information without losing host: %s", (input, expected) => {
  expect(redactSecrets(input)).toBe(expected);
});

it("Native logger redaction hides authorization and cookie while preserving other headers", async () => {
  const logs: string[] = [];
  const server = Fastify({ logger: {
    level: "info", redact: HTTP_LOG_REDACTION,
    serializers: { req: value => ({ headers: value.headers }) },
    stream: { write: line => { logs.push(line); } },
  } });
  server.get("/log", async request => {
    request.log.info({ req: { headers: request.headers } }, "Headers recorded");
    return { status: "ok" };
  });
  try {
    await server.inject({ url: "/log", headers: {
      authorization: "Bearer example-token", cookie: "session=example-cookie", "x-safe": "visible",
    } });
    const event = logs.map(line => JSON.parse(line)).find(value => value.msg === "Headers recorded");
    expect(event.req.headers.authorization).toBe("[Redacted]");
    expect(event.req.headers.cookie).toBe("[Redacted]");
    expect(event.req.headers["x-safe"]).toBe("visible");
    expect(logs.join("\n")).not.toContain("example-token");
    expect(logs.join("\n")).not.toContain("example-cookie");
  } finally { await server.close(); }
});
