/**
 * Prettier 3 config — Brian-voice defaults (inspired by prettier-config-sexy-mode
 * on GitLab; rewritten to latest mainstream).
 * Per rules/lint-doctrine.md.
 */
module.exports = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  plugins: [
    'prettier-plugin-packagejson',       // 1.4M+ weekly DLs — sorts package.json keys
    'prettier-plugin-organize-imports',  // 1.2M+ weekly DLs — sorts + dedupes ES imports
  ],
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: { proseWrap: 'preserve' },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: { singleQuote: false },
    },
  ],
};
