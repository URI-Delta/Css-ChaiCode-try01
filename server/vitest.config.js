import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/css-visual-test',
    },
    include: ['tests/**/*.test.js'],
  },
});
