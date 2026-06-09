/**
 * ESLint flat config — extends @megabytelabs/eslint-config.
 * Per rules/lint-doctrine.md.
 *
 * @megabytelabs/eslint-config covers TS, JS, JSON, YAML, TOML.
 * Add project-specific overrides below.
 */
import megabyteConfig from '@megabytelabs/eslint-config';

export default [
  ...megabyteConfig,
  // Project-specific overrides go here
  {
    rules: {
      // Override defaults if needed
    },
  },
];
