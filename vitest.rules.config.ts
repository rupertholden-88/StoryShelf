import { defineConfig } from "vitest/config";

// Security rules tests; they need the Firestore emulator (npm run test:rules starts it).
export default defineConfig({
  test: { include: ["tests/rules/**/*.test.ts"], testTimeout: 20000, fileParallelism: false },
});
