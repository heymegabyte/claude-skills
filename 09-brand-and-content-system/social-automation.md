---
name: "Social Automation"
version: "1.1.0"
updated: "2026-04-23"
description: "Auto-post via Postiz (self-hosted Coolify) on deploy. X/Twitter, LinkedIn, Reddit, GitHub, Threads, TikTok, Pinterest+. Platform-specific copy in Brian's voice, OG images, Playwright verification."
---

# Social Automation via Postiz

## Postiz Instance
- **URL** — https://postiz.megabyte.space
- **Connected platforms** — X/Twitter, LinkedIn, Reddit, GitHub, Threads, Facebook, TikTok, Pinterest, Dribbble, Discord, Slack, Mastodon, Telegram, Beehiiv

## When to Auto-Post
- New product launch (first deploy of a domain)
- Major feature additions (new sections, new integrations)
- Milestone achievements (donation goals met, impact numbers)
- **NOT for** — bug fixes, style tweaks, skill updates, internal changes

## Post Generation
1. Summarize the change in 1-2 sentences (Brian's voice — sharp, punchy)
2. Include the site URL
3. Include the OG image URL for visual preview
4. Add relevant hashtags (max 5)
5. Customize per platform:
   - **X/Twitter** — 280 chars max, punchy, 2-3 hashtags
   - **LinkedIn** — professional tone, 1-2 paragraphs, link in body
   - **Reddit** — subreddit-appropriate title, link post
   - **Facebook** — casual, include image, tag @HeyMegabyte

## Postiz API
```bash
# Create a post
curl -X POST "https://postiz.megabyte.space/api/posts" \
  -H "Authorization: Bearer POSTIZ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Post text here",
    "platforms": ["twitter", "linkedin"],
    "media": ["https://domain.com/og-image.png"],
    "schedule": "now"
  }'
```

## Quality Verification
After posting, verify the post rendered correctly:
1. Get the public share URL from the Postiz API response
2. Use Playwright to screenshot the share URL
3. Visual inspection — verify image loaded, text not truncated, link works
4. If issues found — debug, fix, repost

## Iterative Improvement
Track which posts get engagement. Over time:
- Which platforms drive the most traffic?
- Which post formats get the most engagement?
- What time of day performs best?

Log this in PostHog for analysis.

## Coolify Access
Postiz runs on Coolify. If the API is down:
1. Check Coolify status — `curl coolify.megabyte.space/api/v1/services`
2. Restart the service if needed via Coolify API
3. Log the outage for future reference

## MCP Tools Available

### Postiz MCP (`mcp__postiz__*`)
- **`integrationSchedulePostTool`** — schedule a post to connected platforms with date / time
- **`integrationList`** — list all connected platform integrations
- **`integrationSchema`** — get schema for a specific integration (required fields, limits)
- **`generateImageTool`** — generate social preview images with AI
- **`generateVideoTool`** — generate short video clips for social
- **`generateVideoOptions`** — get available video generation options
- **`videoFunctionTool`** — execute video processing functions
- **`triggerTool`** — trigger immediate post (bypass scheduling)
- **`ask_postiz`** — ask Postiz AI for post copy suggestions

### Coolify MCP (`mcp__coolify__*`) — for Postiz service health
- **`diagnose_app`** — diagnose Postiz service health
- **`get_service`** — get Postiz service details
- **`control`** — restart Postiz if it's down

### PostHog MCP (`mcp__posthog__*`) — for engagement tracking
- **`authenticate`** — connect to PostHog for social analytics

## Posting Workflows

### Launch Day Social Sequence
When a new site launches, execute this sequence:

1. **T+0 min** — Post to X/Twitter (highest immediacy audience)
2. **T+15 min** — Post to LinkedIn (professional framing)
3. **T+30 min** — Post to Reddit (relevant subreddit, link post)
4. **T+1 hr** — Post to Facebook, Threads (broader reach)
5. **T+2 hr** — Post to Discord, Slack channels

```typescript
// Example: Schedule the full launch sequence
const platforms = ['twitter', 'linkedin', 'reddit', 'facebook', 'threads'];
const delays = [0, 15, 30, 60, 120]; // minutes

for (let i = 0; i < platforms.length; i++) {
  const scheduleTime = new Date(Date.now() + delays[i] * 60000);
  // Use mcp__postiz__integrationSchedulePostTool with platform + scheduleTime
}
```

### Social Preview Image Generation
Before posting, generate an OG-quality social image:
1. Call `mcp__postiz__generateImageTool` with site title + tagline
2. If custom image exists (OG image from site), use that instead
3. Verify image dimensions — 1200×630 for OG, 1080×1080 for Instagram / Threads
4. Fallback — screenshot the hero section via Playwright at 1200×630

## Computer Use Integration
Use `mcp__computer-use__*` tools for visual verification of posted content:

1. **Post verification** — after scheduling via MCP, open the platform in browser and screenshot to confirm the post rendered with correct image, text, and link
2. **Engagement monitoring** — screenshot Postiz dashboard at `https://postiz.megabyte.space` to check engagement metrics after 24 hours
3. **Platform-specific debugging** — if a post looks wrong on a specific platform, screenshot the live post to diagnose formatting issues

```
Workflow: Post → Wait 60s → Screenshot platform → AI visual check → Flag issues
```

## Acceptance Criteria
1. Post reaches all specified platforms — `mcp__postiz__integrationList` confirms connected, API returns 200 per platform
2. OG image renders correctly — Playwright screenshot of share URL shows image loaded (not broken / missing)
3. Text not truncated — post text is within platform character limits (280 X, 3000 LinkedIn, 300 Reddit title)
4. Link is clickable and resolves — fetch the URL in the post body, confirm 200 response
5. Hashtags present and relevant — 2-5 hashtags per post, no banned / spam tags
6. Launch sequence timing correct — posts staggered per the launch day sequence (not all simultaneous)
7. No duplicate posts — check Postiz post history, no identical content within 24 hours
8. PostHog event tracked — `social_post_published` event fires with platform + URL properties
