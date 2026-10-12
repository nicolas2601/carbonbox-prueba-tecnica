import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import type { IConvictProps } from "../../../config/IConvictProps";

type Limits = Pick<IConvictProps, "rateLimitMax" | "uploadRateLimitMax" | "rateLimitWindowMs">;
export async function registerRateLimits(server: FastifyInstance, settings: Limits): Promise<void> {
  server.addHook("onRoute", route => {
    if (route.url === "/api/v1/uploads" && route.method === "POST") {
      route.config = { ...route.config, rateLimit: { max: settings.uploadRateLimitMax,
        timeWindow: settings.rateLimitWindowMs, groupId: "uploads" } };
    }
  });
  await server.register(rateLimit, { global: true, max: settings.rateLimitMax, timeWindow: settings.rateLimitWindowMs,
    allowList: request => request.method === "OPTIONS" });
}
