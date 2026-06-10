import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
  },
  css: {
    modules: {
      classNameStrategy: 'non-scoped',
    },
  },
});
