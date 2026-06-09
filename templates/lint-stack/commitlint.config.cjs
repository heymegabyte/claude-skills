/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['conventional-changelog-emoji-config'],
  rules: {
    // Mandate emoji at start of subject. The leading gitmoji or unicode emoji
    // is enforced both here AND by the gitmoji-enforce lefthook step (belt+suspenders).
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
