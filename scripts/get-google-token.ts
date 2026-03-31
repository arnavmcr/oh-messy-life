// One-time script: exchange an OAuth2 auth code for a refresh token.
// Run: node_modules/.bin/tsx scripts/get-google-token.ts
//
// Before running:
// 1. Create an OAuth2 client in Google Cloud Console (Photos Library API scope)
// 2. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local
// 3. Add http://localhost:3000/oauth2callback as an authorised redirect URI
//
// This script prints an auth URL. Open it, approve access, then paste the
// resulting ?code= param back when prompted. The refresh token is printed to stdout.

import 'dotenv/config';
import { google } from 'googleapis';
import * as readline from 'readline';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('[ERROR] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback',
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/photoslibrary.readonly'],
  prompt: 'consent',
});

console.log('\nOpen this URL in your browser:\n');
console.log(authUrl);
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the `code` query parameter from the redirect URL: ', async (code) => {
  rl.close();
  const { tokens } = await oauth2Client.getToken(code.trim());
  console.log('\n[OK] Refresh token:');
  console.log(tokens.refresh_token);
  console.log('\nPaste this into .env.local as GOOGLE_REFRESH_TOKEN=<value>');
});
