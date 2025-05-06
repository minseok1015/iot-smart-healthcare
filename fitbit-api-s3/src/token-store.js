import fs from 'fs';
import axios from 'axios';
import { CLIENT_ID, CLIENT_SECRET, TOKEN_FILE } from './config.js';

export function loadToken() {
  if (!fs.existsSync(TOKEN_FILE)) throw new Error('token.json 없음 – OAuth 인증 필요');
  return JSON.parse(fs.readFileSync(TOKEN_FILE));
}

export function saveToken(obj) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(obj, null, 2));
}

export async function refreshToken(oldRefresh) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  const res = await axios.post(
    'https://api.fitbit.com/oauth2/token',
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: oldRefresh }),
    { headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  
  const { access_token, refresh_token, expires_in } = res.data;
  saveToken({ access_token, refresh_token, expires_at: Date.now() + expires_in * 1000 });
  
  console.log('토큰 재발급 완료');
  
  return access_token;
}