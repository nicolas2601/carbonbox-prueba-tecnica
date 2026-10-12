import { defineConfig } from "vitest/config";
import unitConfig from "../vitest.config.ts";

export default defineConfig({
  ...unitConfig,
  test: {
    ...unitConfig.test,
    projects: ["./vitest.config.ts", "./vitest.integration.config.ts"],
    fileParallelism: false,
  },
});
