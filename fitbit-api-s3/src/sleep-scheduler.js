// scheduler.js
const cron               = require('node-cron');
const { load, refresh }  = require('./token-store');
const { getTodaySleep }  = require('./fitbit-sleep');

function startScheduler() {
  console.log('⏰ Fitbit 스케줄러 기동 – 매일 02:00 실행');

  // 매일 02:00
  cron.schedule('0 2 * * *', async () => {
    try {
      const stored = load();
      const token  = (Date.now() >= stored.expires_at)
        ? await refresh(stored.refresh_token)
        : stored.access_token;

      await getTodaySleep(token);
    } catch (e) {
      console.error('스케줄러 오류', e.message);
    }
  });
}

// 이 파일을 require 하면 바로 실행되길 원한다면 ↓
// startScheduler();

module.exports = { startScheduler };