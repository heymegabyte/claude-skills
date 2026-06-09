/**
 * Shared real-browser User-Agent constant for every site-generation crawler.
 * Per rules/fetch-defaults.md — must mirror current Chrome stable to avoid
 * CF Bot Management / Akamai / Imperva fingerprinting outdated UAs as bots.
 *
 * Verify quarterly via:
 *   curl -s 'https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Mac&num=1' | jq -r '.[0].version'
 *
 * Last updated: 2026-06-08 → Chrome 149.0.7827.55
 */
export const REAL_UA_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

export const REAL_UA_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1';

/** Companion headers — pair with UA per fetch-defaults.md */
export const REAL_HEADERS = {
  'User-Agent': REAL_UA_DESKTOP,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-User': '?1',
  'Sec-Fetch-Dest': 'document',
  'Upgrade-Insecure-Requests': '1',
};

export default REAL_UA_DESKTOP;
