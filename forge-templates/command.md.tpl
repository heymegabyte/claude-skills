---
description: "{{SUMMARY}}"
argument-hint: {{ARGUMENT_HINT}}
allowed-tools: Bash
---

# {{METHOD}} {{PATH}}

{{DESCRIPTION}}

## Parameters

{{PARAM_TABLE}}

## Request

```bash
# Set env vars first:
# export API_TOKEN=<your-token>
{{PATH_PARAM_EXPORTS}}

{{CURL_EXAMPLE}}
```

{{BODY_SECTION}}

## Response

{{RESPONSE_SCHEMA}}

## Error Handling

- `400` — Bad request / validation error. Check param types and required fields.
- `401` — Auth failed. Verify `$API_TOKEN` is set correctly.
- `403` — Forbidden. Check OAuth scopes or API key permissions.
- `404` — Resource not found. Verify path params.
- `429` — Rate limited. Implement exponential backoff.
- `500` / `503` — Server error. Retry with backoff; log the request ID from response headers.

## Claude Guidance

When the user invokes this command:
1. Confirm all required path params are available from context or prompt for them.
2. Run the curl command substituting real values.
3. Parse the JSON response and summarize the key fields.
4. Surface any error clearly with the HTTP status and response body.
