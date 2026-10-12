import type { FastifyInstance } from "fastify";
import compress from "@fastify/compress";
import { constants } from "node:zlib";

const MIN_COMPRESS_BYTES = 1024;
export async function registerResponsePolicy(server: FastifyInstance): Promise<void> {
  server.addHook("onSend", async (request, reply, payload) => {
    if (request.url.startsWith("/api/v1/uploads")) reply.header("cache-control", "no-store");
    return payload;
  });
  await server.register(compress, { globalCompression: true, globalDecompression: false,
    threshold: MIN_COMPRESS_BYTES, encodings: ["gzip"], zlibOptions: { level: constants.Z_BEST_SPEED } });
}
