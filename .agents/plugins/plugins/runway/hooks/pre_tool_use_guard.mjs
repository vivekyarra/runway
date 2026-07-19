#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { evaluatePatchGuard, hookResponse } from './guard-core.mjs'

function denyMalformedInput() {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: 'Runway blocked this patch because the Codex hook input was not valid JSON.',
    },
  }
}

try {
  const input = JSON.parse(readFileSync(0, 'utf8'))
  const response = hookResponse(evaluatePatchGuard(input, process.env))
  if (response) process.stdout.write(`${JSON.stringify(response)}\n`)
} catch {
  process.stdout.write(`${JSON.stringify(denyMalformedInput())}\n`)
}
