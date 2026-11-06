import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Prettier owns formatting, so turn off the ESLint rules that overlap with it
  prettier,
  globalIgnores(['.next/**', 'next-env.d.ts', 'types_db.ts'])
]);
