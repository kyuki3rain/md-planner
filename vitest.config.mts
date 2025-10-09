import { URL, fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const alias = [
  { find: "@domain", replacement: fileURLToPath(new URL("./src/domain", import.meta.url)) },
  {
    find: "@application",
    replacement: fileURLToPath(new URL("./src/application", import.meta.url)),
  },
  {
    find: "@infrastructure",
    replacement: fileURLToPath(new URL("./src/infrastructure", import.meta.url)),
  },
  { find: "@interface", replacement: fileURLToPath(new URL("./src/interface", import.meta.url)) },
  { find: "@shared", replacement: fileURLToPath(new URL("./src/shared", import.meta.url)) },
];

export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts", "src/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/out/**"],
    reporters: ["default"],
    coverage: {
      enabled: false,
    },
  },
});
