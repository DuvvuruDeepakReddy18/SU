import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

// End-to-end specs: boot the real Nest app against a live Postgres + Redis
// (the docker compose stack, or the CI service containers). Run serially —
// they share one app instance and touch the database.
//
// SWC transform is required: Nest's dependency injection resolves providers by
// emitted decorator metadata, which Vitest's default esbuild transformer
// strips. unplugin-swc re-enables `emitDecoratorMetadata` so DI works.
export default defineConfig({
  plugins: [
    swc.vite({
      jsc: {
        target: 'es2021',
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
  test: {
    environment: 'node',
    globals: false,
    include: ['test/**/*.e2e.spec.ts'],
    hookTimeout: 60_000,
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
