import cron from 'node-cron';
import { load, refresh } from './token-store.js';
import { getTodaySleep } from './fitbit-sleep.js';

console.log('⏰ Fitbit 스케줄러 기동 – 매일 02:00 실행');

// 매일 02:00 (서버의 로컬 타임존 기준) 실행
cron.schedule('0 2 * * *', async () => {
  try {
    const stored = load();
    const token = (Date.now() >= stored.expires_at)
      ? await refresh(stored.refresh_token)
      : stored.access_token;

    await getTodaySleep(token);
  } catch (e) {
    console.error('스케줄러 오류', e.message);
  }
});