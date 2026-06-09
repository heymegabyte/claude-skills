/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: 'conventional-changelog-gitmoji-config',
  rules: {
    // Mandate emoji at start of subject. Leading gitmoji is enforced by the
    // standalone gitmoji-enforce.sh lefthook step (belt+suspenders).
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
