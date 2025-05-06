import { loadToken, refreshToken } from './token-store.js';
import { fetchTodaySleep }       from './fitbit-sleep.js';

async function main() {
  const stored = loadToken();
  const token  = (Date.now() >= stored.expires_at)
    ? await refreshToken(stored.refresh_token)
    : stored.access_token;
  await fetchTodaySleep(token);
}
main().catch(console.error);