#!/usr/bin/env node
// Generate fresh, high-entropy secrets for a production (or rotation) deploy.
//
//   pnpm gen:secrets            # print three ready-to-paste lines
//   pnpm gen:secrets --json     # machine-readable, for piping into a secret store
//
// These three are what validate-env.ts hard-requires in production. Rotating a
// secret invalidates anything signed/encrypted with the old one:
//   • JWT_SECRET       → all existing access/refresh tokens (users re-login)
//   • NEXTAUTH_SECRET  → all NextAuth sessions (users re-login)
//   • ENCRYPTION_KEY   → all stored OAuth tokens (integrations must re-connect)
// Rotate JWT/NextAuth freely; rotate ENCRYPTION_KEY only when you can also
// clear or re-encrypt stored integration tokens.

import { randomBytes } from 'node:crypto';

const token = (bytes) => randomBytes(bytes).toString('base64url');

const secrets = {
  JWT_SECRET: token(48), // ~64 chars
  NEXTAUTH_SECRET: token(32), // ~43 chars
  ENCRYPTION_KEY: token(32), // run through scrypt at use; length is flexible
};

if (process.argv.includes('--json')) {
  process.stdout.write(JSON.stringify(secrets, null, 2) + '\n');
} else {
  console.log('\n# Fresh secrets — paste into your production env (never commit these):\n');
  for (const [k, v] of Object.entries(secrets)) console.log(`${k}=${v}`);
  console.log('\n# Rotating invalidates existing tokens/sessions — see scripts/gen-secrets.mjs.\n');
}
