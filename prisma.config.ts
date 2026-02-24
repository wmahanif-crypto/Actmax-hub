import { defineConfig } from '@prisma/config';

export default defineConfig({
  // @ts-ignore
  engine: 'library',
  datasource: {
    // @ts-ignore
    url: process.env.DATABASE_URL,
  },
});