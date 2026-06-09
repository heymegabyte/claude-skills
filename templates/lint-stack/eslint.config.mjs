/**
 * ESLint 9 flat config — mainstream canonical chain (inspired by GitLab
 * @megabyte/eslint-config; rewritten to latest stable plugins).
 * Per rules/lint-doctrine.md.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import promise from 'eslint-plugin-promise';
import nodePlugin from 'eslint-plugin-n';
import sonarjs from 'eslint-plugin-sonarjs';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  perfectionist.configs['recommended-natural'],
  security.configs.recommended,
  unicorn.configs.recommended,
  promise.configs['flat/recommended'],
  nodePlugin.configs['flat/recommended-script'],
  sonarjs.configs.recommended,         // cognitive complexity, duplicate strings, dead stores, real bugs
  importPlugin.flatConfigs.recommended, // import/export hygiene, no-cycle, no-self-import
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Brian-voice overrides — uncomment / adjust per project
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'n/no-missing-import': 'off', // TypeScript handles it
    },
  },
  {
    ignores: ['dist/**', 'build/**', 'node_modules/**', '.next/**', 'coverage/**'],
  },
  // MUST be last — disables ESLint formatting rules that conflict with Prettier
  prettierConfig,
];
