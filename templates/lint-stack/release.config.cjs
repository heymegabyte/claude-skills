/**
 * semantic-release config — gitmoji-aware via semantic-release-gitmoji (mainstream,
 * 50k+ weekly DLs). Replaces GitLab @megabytelabs/semantic-release-config inspiration.
 * Per rules/lint-doctrine.md.
 */
module.exports = {
  branches: ['main', 'master'],
  plugins: [
    // gitmoji-aware analyzer + release-notes (replaces @semantic-release/commit-analyzer
    // + @semantic-release/release-notes-generator for emoji-prefixed commits)
    [
      'semantic-release-gitmoji',
      {
        releaseRules: {
          major: ['💥', ':boom:'],
          minor: ['✨', ':sparkles:', '🎉', ':tada:'],
          patch: ['🐛', ':bug:', '🩹', ':adhesive_bandage:', '🚑', ':ambulance:', '🔒', ':lock:'],
        },
        releaseNotes: {
          template: undefined,  // use built-in
          partials: { commitTemplate: undefined },
          helpers: undefined,
        },
      },
    ],
    '@semantic-release/changelog',
    '@semantic-release/npm',
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        message: '🔖 chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
