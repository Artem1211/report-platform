import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default defineConfig([
  globalIgnores(['node_modules', 'dist', 'prisma']),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      prettier,
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-param-reassign': ['error', { props: false }],
      'no-console': ['error', { allow: ['error', 'debug', 'info', 'log'] }],
      'no-return-await': 'error',
      'prefer-destructuring': ['error', { array: false, object: true }],

      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      '@typescript-eslint/consistent-type-assertions': 'off',

      'no-nested-ternary': 'error',

      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      'arrow-body-style': 'off',

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'warn',
      'prettier/prettier': 'error',
    },
  },
]);
