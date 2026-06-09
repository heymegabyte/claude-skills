/** @type {import('semantic-release').GlobalConfig} */
module.exports = {
  branches: ['main', 'master'],
  extends: ['@megabytelabs/semantic-release-config'],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventional-changelog-emoji-config' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventional-changelog-emoji-config' }],
    '@semantic-release/changelog',
    '@semantic-release/npm',
    ['@HeyMegabyte/semantic-release-gh', { repositoryUrl: process.env.REPOSITORY_URL }],
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
      message: '🔖 chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    }],
  ],
};
