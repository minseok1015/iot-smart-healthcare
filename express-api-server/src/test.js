const { loadToken, refreshToken } = require('./token-store');
const { fetchTodaySleep } = require('./fitbit-sleep');
const { addSleepData } = require('./sleep-store'); // ✅ 수면 데이터 저장소 연동

// 토큰 검사 및 수면 데이터 가져오기
async function fetchSleepData() {
  const stored = loadToken();
  const token =
    Date.now() >= stored.expires_at
      ? await refreshToken(stored.refresh_token)
      : stored.access_token;

  const sleepData = await fetchTodaySleep(token);
  return sleepData;
}

// 자동 호출되는 테스트 함수
async function test() {
  try {
    const data = await fetchSleepData();
    addSleepData(data); // 메모리에 저장
    console.log('수면 데이터 수신 성공');
  } catch (err) {
    console.error('수면 데이터 요청 실패:', err.message);
  }
}

test().catch(console.error);

module.exports = { test, fetchSleepData };
