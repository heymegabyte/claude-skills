#!/usr/bin/env node
/**
 * hook-health.mjs -- standalone hook health reporter.
 *
 * Reads the plugin settings.json (or any Claude Code settings), enumerates
 * all hook entries, resolves each command/path to a file on disk, and prints
 * a health table. Optionally checks hook-execution.log for recent errors.
 *
 * Usage:
 *   node bin/hook-health.mjs                    # plugin settings (default)
 *   node bin/hook-health.mjs ~/.claude/settings.json
 *   node bin/hook-health.mjs --log              # include log check
 *   node bin/hook-health.mjs --ci               # exit 1 on any missing
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";

const LOG_PATH = "/tmp/claude-hook-execution.log";

/* ── Helpers ────────────────────────────────────────────────────────────── */

function ok(msg) {
  return `\x1b[32mOK\x1b[0m  ${msg}`;
}
function warn(msg) {
  return `\x1b[33mWARN\x1b[0m ${msg}`;
}
function fail(msg) {
  return `\x1b[31mFAIL\x1b[0m ${msg}`;
}

/**
 * Resolve a command string to an absolute path.
 */
function resolveCommand(command) {
  if (!command || typeof command !== "string") return null;

  // Inline commands (pipes, multiline, shell builtins) -- no file reference.
  if (
    command.includes("|") ||
    command.includes("&&") ||
    command.includes(";") ||
    command.startsWith("mkdir") ||
    command.startsWith("echo") ||
    command.startsWith("git ") ||
    command.startsWith("osascript")
  ) {
    return null; // inline, not a file reference
  }

  // Full path.
  let expanded = command;
  if (expanded.startsWith("$HOME")) {
    expanded = expanded.replace("$HOME", process.env.HOME || "/Users/apple");
  }

  // Strip trailing `2>/dev/null || true` etc for path resolution.
  const clean = expanded
    .replace(/\s+2>[/\w.-]+(\s+\|\|\s+true)?\s*$/, "")
    .replace(/\s+\|\|\s+true\s*$/, "")
    .trim();

  // If it starts with a path (like /Users/... or $HOME/... or a relative path)
  if (clean.startsWith("/") || clean.startsWith("$HOME")) {
    return clean;
  }

  // Otherwise it might be `python3 /path/to/hook.py` – extract the second token.
  const parts = clean.split(/\s+/);
  for (const part of parts) {
    if (
      (part.startsWith("/") || part.startsWith("$HOME")) &&
      (part.endsWith(".py") || part.endsWith(".sh") || part.endsWith(".js") || part.endsWith(".mjs"))
    ) {
      return part.replace("$HOME", process.env.HOME || "/Users/apple");
    }
  }

  return null;
}

function fileExists(filePath) {
  try {
    return existsSync(filePath) && statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/* ── Main ──────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const ciMode = args.includes("--ci");
const checkLog = args.includes("--log");

// Determine which settings file to read.
const settingsPath = args.find((a) => !a.startsWith("--")) ||
  resolve(import.meta.dirname, "..", "settings.json");

let settings;
try {
  settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
} catch (err) {
  console.error(fail(`Cannot read settings: ${settingsPath} -- ${err.message}`));
  process.exit(ciMode ? 1 : 0);
}

const hooks = settings.hooks || {};
const entries = [];

for (const [event, eventList] of Object.entries(hooks)) {
  if (!Array.isArray(eventList)) continue;
  for (const group of eventList) {
    const matcher = group.matcher || "*";
    const hookList = group.hooks || [];
    for (const hook of hookList) {
      if (hook.type !== "command") continue;
      const filePath = resolveCommand(hook.command);
      entries.push({ event, matcher, command: hook.command, filePath });
    }
  }
}

/* ── Table ──────────────────────────────────────────────────────────────── */

const HEADER = `${"EVENT".padEnd(22)} ${"MATCHER".padEnd(24)} ${"STATUS".padEnd(8)} FILE`;
console.log(HEADER);
console.log("─".repeat(HEADER.length));

let missing = 0;
let total = 0;

for (const { event, matcher, command, filePath } of entries) {
  total++;
  if (filePath === null) {
    // Inline command -- no file to check.
    console.log(
      `${event.padEnd(22)} ${matcher.padEnd(24)} ${ok("inline").padEnd(8)} ${command.slice(0, 60)}`
    );
    continue;
  }
  const expanded = filePath;
  if (fileExists(expanded)) {
    console.log(
      `${event.padEnd(22)} ${matcher.padEnd(24)} ${ok("found").padEnd(8)} ${expanded}`
    );
  } else {
    missing++;
    console.log(
      `${event.padEnd(22)} ${matcher.padEnd(24)} ${fail("MISSING").padEnd(8)} ${expanded}`
    );
  }
}

/* ── Summary ────────────────────────────────────────────────────────────── */

console.log("");
console.log(`Total hook entries: ${total}`);
console.log(`Inline / no-file:   ${entries.filter((e) => e.filePath === null).length}`);
console.log(`Found on disk:      ${total - missing - entries.filter((e) => e.filePath === null).length}`);
console.log(`\x1b[31mMissing files:     ${missing}\x1b[0m`);

/* ── Optional log check ─────────────────────────────────────────────────── */

if (checkLog) {
  console.log("");
  const logFile = LOG_PATH;
  if (fileExists(logFile)) {
    try {
      const logText = readFileSync(logFile, "utf-8");
      const lines = logText.trim().split("\n");
      const recent = lines.slice(-10);
      const errors = recent.filter((l) =>
        l.toLowerCase().includes("error") || l.toLowerCase().includes("fail")
      );
      if (errors.length > 0) {
        console.log(warn(`Recent errors in ${LOG_PATH}:`));
        errors.forEach((e) => console.log(`  ${e}`));
      } else {
        console.log(ok(`${LOG_PATH} -- no recent errors (last ${recent.length} lines)`));
      }
    } catch (err) {
      console.log(warn(`Cannot read ${LOG_PATH}: ${err.message}`));
    }
  } else {
    console.log(warn(`${LOG_PATH} not found -- no hook execution log to check.`));
  }
}

/* ── CI gate ────────────────────────────────────────────────────────────── */

if (ciMode && missing > 0) {
  console.error(`\n[hook-health] CI FAIL: ${missing} hook file(s) missing.`);
  process.exit(1);
}

process.exit(0);
