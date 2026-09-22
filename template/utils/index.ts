/**
 * index.ts — Barrel export for template/utils/
 *
 * Re-exports all utilities from this directory. Import from this file in
 * application code rather than individual utility files — avoids deep import
 * paths and makes tree-shaking straightforward.
 *
 * @module utils
 *
 * @example
 *   import { hashEmail, slugify, fetchWithRetry } from '@/utils';
 *
 * @example
 *   import { generateIdempotencyKey, setDeprecation } from '@/utils';
 */

// ---------------------------------------------------------------------------
// scrub-pii — PII hashing and redaction
// ---------------------------------------------------------------------------

export {
  hashEmail,
  hashIp,
  scrubPii,
  redactPii,
} from "./scrub-pii.ts";

// ---------------------------------------------------------------------------
// fetch-with-retry — Production-grade fetch with backoff and circuit breaker
// ---------------------------------------------------------------------------

export {
  FetchRetryExhaustedError,
  TimeoutError,
  CircuitOpenError,
  isRetryable,
  withTimeout,
  circuitBreaker,
  fetchWithRetry,
} from "./fetch-with-retry.ts";

export type {
  RetryOptions,
  CircuitBreakerOptions,
} from "./fetch-with-retry.ts";

// ---------------------------------------------------------------------------
// slug — Slug generation and validation
// ---------------------------------------------------------------------------

export {
  SlugInputError,
  unicodeNormalize,
  slugify,
  isValidSlug,
  slugifyCollision,
} from "./slug.ts";

export type { SlugifyOptions } from "./slug.ts";

// ---------------------------------------------------------------------------
// date — Date formatting, parsing, and arithmetic
// ---------------------------------------------------------------------------

export {
  InvalidDateError,
  isValidDate,
  formatISO,
  formatHuman,
  relative,
  addDuration,
  parseFlexible,
} from "./date.ts";

export type { Duration, FormatHumanOptions } from "./date.ts";

// ---------------------------------------------------------------------------
// zod-validate — Zod boundary validation helpers
// ---------------------------------------------------------------------------

export {
  RequestValidationError,
  ResponseValidationError,
  EnvValidationError,
  safeBoundary,
  validateRequest,
  validateResponse,
  validateEnv,
} from "./zod-validate.ts";

export type {
  BoundaryResult,
  SafeBoundaryOptions,
  ValidateRequestOptions,
} from "./zod-validate.ts";

// ---------------------------------------------------------------------------
// deprecation-headers — RFC 8594 deprecation/sunset header helpers
// ---------------------------------------------------------------------------

export {
  DeprecationDateParseError,
  setDeprecation,
  getDeprecationDate,
  isDeprecated,
} from "./deprecation-headers.ts";

export type {
  DeprecationOptions,
  HonoContextLike as DeprecationHonoContextLike,
} from "./deprecation-headers.ts";

// ---------------------------------------------------------------------------
// bitwarden-token-cache — Bitwarden OAuth2 client_credentials token cache
// ---------------------------------------------------------------------------

export {
  BitwardenAuthError,
  getBitwardenToken,
  invalidateBitwardenToken,
} from "./bitwarden-token-cache.ts";

export type {
  BitwardenTokenOptions,
} from "./bitwarden-token-cache.ts";

// ---------------------------------------------------------------------------
// oauth2-client-credentials-cache — Generic OAuth2 client_credentials cache
// ---------------------------------------------------------------------------

export {
  OAuth2AuthError,
  createOAuth2ClientCredentialsCache,
} from "./oauth2-client-credentials-cache.ts";

export type {
  OAuth2ClientCredentialsOptions,
  OAuth2TokenCache,
} from "./oauth2-client-credentials-cache.ts";

// ---------------------------------------------------------------------------
// auth0-token-cache — Auth0 M2M OAuth2 client_credentials token cache
// ---------------------------------------------------------------------------

export {
  Auth0AuthError,
  getAuth0Token,
  invalidateAuth0Token,
} from "./auth0-token-cache.ts";

export type {
  Auth0TokenOptions,
} from "./auth0-token-cache.ts";

// ---------------------------------------------------------------------------
// okta-token-cache — Okta OAuth2 client_credentials token cache
// ---------------------------------------------------------------------------

export {
  OktaAuthError,
  getOktaToken,
  invalidateOktaToken,
} from "./okta-token-cache.ts";

export type {
  OktaTokenOptions,
} from "./okta-token-cache.ts";

// ---------------------------------------------------------------------------
// cognito-token-cache — AWS Cognito OAuth2 client_credentials token cache
// ---------------------------------------------------------------------------

export {
  CognitoAuthError,
  getCognitoToken,
  invalidateCognitoToken,
} from "./cognito-token-cache.ts";

export type {
  CognitoTokenOptions,
} from "./cognito-token-cache.ts";

// ---------------------------------------------------------------------------
// oauth2-pkce-cache — OAuth2 Authorization Code + PKCE flow (user-facing)
// ---------------------------------------------------------------------------

export {
  Oauth2PkceError,
  generatePkceVerifierAndChallenge,
  createAuth0PkceClient,
} from "./oauth2-pkce-cache.ts";

export type {
  Auth0PkceClientOptions,
  GetAuthorizeUrlOptions,
  PkceTokenResponse,
  PkceVerifierAndChallenge,
  Auth0PkceClient,
} from "./oauth2-pkce-cache.ts";

// ---------------------------------------------------------------------------
// mcp-error-response — MCP tool result helpers with correct isError semantics
// ---------------------------------------------------------------------------

export {
  mcpOk,
  mcpHttpError,
  mcpCaughtError,
  mcpValidationError,
  mcpSizeLimitError,
  mcpFetch,
} from "./mcp-error-response.ts";

export type {
  McpContentBlock,
  McpToolResult,
  McpErrorPayload,
} from "./mcp-error-response.ts";

// ---------------------------------------------------------------------------
// idempotency — Idempotency key generation, parsing, and KV dedup
// ---------------------------------------------------------------------------

export {
  MissingIdempotencyKeyError,
  InvalidIdempotencyKeyError,
  IdempotencyKVError,
  generateIdempotencyKey,
  parseIdempotencyKey,
  requireIdempotencyKey,
  idempotencyCheck,
} from "./idempotency.ts";

export type {
  GenerateIdempotencyKeyOpts,
  HonoContextLike as IdempotencyHonoContextLike,
  KVNamespaceLike,
  IdempotencyCheckResult,
} from "./idempotency.ts";
