/**
 * Prettier config — extends GitLab @megabytelabs prettier-config-sexy-mode
 * + prettier-plugin-package-perfection for package.json key/script ordering.
 * Per rules/lint-doctrine.md.
 */
module.exports = {
  ...require('prettier-config-sexy-mode'),
  plugins: [
    ...((require('prettier-config-sexy-mode').plugins) || []),
    'prettier-plugin-package-perfection',
  ],
};
