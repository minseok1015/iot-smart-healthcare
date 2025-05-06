const { loadToken, refreshToken } = require('./token-store');
const { fetchTodaySleep } = require('./fitbit-sleep');

async function test() {
  const stored = loadToken();
  const token =
    Date.now() >= stored.expires_at
      ? await refreshToken(stored.refresh_token)
      : stored.access_token;

  await fetchTodaySleep(token);
}

test().catch(console.error);

module.exports = { test };
