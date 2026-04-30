# Verification Loop (MANDATORY)
TDD: failing Playwright test FIRST→implement→pass. Real user flows: homepage→navigate via clicks/keyboard→interact→verify. Test account test@megabyte.space (TEST_USER_PASSWORD).
Code change→SPEC.md→failing tests(PROD_URL)→implement slice-by-slice→deploy+purge→E2E 6bp→screenshot→AI vision→fix→redeploy(max 3)→DONE when all pass.
Ralph Loop: SPEC.md+progress.md→pick AC→test→build→deploy→verify→mark done→next. Context>60%→save+spawn fresh. All ACs done→recommendations loop→zero remain.
Playwright v1.59+: AI agents (Planner→design tests|Generator→write code|Healer→auto-fix broken selectors). Use Healer for flaky selector recovery before manual rewrite. MCP a11y tree testing preferred over screenshot-based assertions — more reliable, faster, catches real a11y issues.
Visual regression: Percy AI Visual Review (3x reduction, 40% false positive filtering) for full-page|Chromatic for component-level via Storybook|pixelmatch for local dev. Three-tier: local→PR→deploy.
No screenshot=not verified. No test=not done. No deploy=not shipped. Crons=monitoring ONLY.
Console errors=not done. After every deploy, check browser console for CSP violations, JS errors, failed resource loads. Fix ALL before marking task complete. Never ship a page with console errors — they indicate broken functionality (blocked scripts, missing resources, CSP mismatches).
Value extraction every prompt: universal→~/.claude/ | project→./.claude/ (path-scoped). New projects auto-scaffold .claude/+SPEC.md+tests.
