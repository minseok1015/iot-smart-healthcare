const axios           = require('axios');
const { uploadSleepLog } = require('./s3-client');   // 확장자 생략 가능

async function fetchTodaySleep(accessToken) {
  const date = new Date().toISOString().slice(0, 10);
  const url  = `https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`;

  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  console.log(data);
  console.log('\n수면 데이터 수신 성공');

  await uploadSleepLog(data);
}

module.exports = { fetchTodaySleep };
