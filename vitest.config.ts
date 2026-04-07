import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Spawning `node src/cli.ts` (integration tests) can exceed 5s on slow CI runners.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
