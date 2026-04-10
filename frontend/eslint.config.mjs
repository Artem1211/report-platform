import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default defineConfig([
  globalIgnores(['node_modules', 'dist']),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      react,
      'react-hooks': reactHooks,
      prettier,
      '@typescript-eslint': tseslint,
    },
    rules: {
      'no-param-reassign': [
        'error',
        {
          props: false,
        },
      ],
      'no-console': [
        'error',
        {
          allow: ['error', 'debug', 'info'],
        },
      ],
      'no-return-await': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: true,
        },
      ],

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'react/react-in-jsx-scope': 'off',

      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      '@typescript-eslint/consistent-type-assertions': [
        'warn',
        {
          assertionStyle: 'never',
        },
      ],

      'no-nested-ternary': 'error',
      'react/require-default-props': 'off',

      'react/jsx-filename-extension': [
        'error',
        {
          extensions: ['.tsx'],
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      'react/jsx-key': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-no-constructed-context-values': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/no-this-in-sfc': 'off',
      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react/function-component-definition': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'arrow-body-style': 'off',

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'warn',
      'prettier/prettier': 'error',
    },
  },
]);
