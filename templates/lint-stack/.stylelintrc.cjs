/**
 * Stylelint 16 config — mainstream canonical chain (inspired by stylelint-config-so-pretty
 * on GitLab; rewritten to latest stable plugins).
 * Per rules/lint-doctrine.md.
 */
module.exports = {
  extends: [
    'stylelint-config-standard',     // 1.1M+ weekly DLs — official baseline
    'stylelint-config-recommended',  // 1.4M+ weekly DLs — turn-on safety rules
    'stylelint-config-clean-order',  // ~25k weekly — property ordering
  ],
  rules: {
    'no-descending-specificity': null,  // common false-positive in component CSS
    'selector-class-pattern': null,     // allow utility-class names (Tailwind-friendly)
  },
};
