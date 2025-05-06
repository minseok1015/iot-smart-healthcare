import axios from 'axios';
import { uploadSleepLog } from './s3-client.js';

export async function fetchTodaySleep(accessToken) {
  const date = new Date().toISOString().slice(0, 10);
  const url  = `https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`;
  const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  
  console.log(data);
  console.log('\n수면 데이터 수신 성공');
  
  await uploadSleepLog(data);
}