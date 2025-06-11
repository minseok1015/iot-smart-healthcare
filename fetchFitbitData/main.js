// SPDX-License-Identifier: Apache-2.0
// Lambda: /auth/fitbit/collect-sleep (로그 → 모든 유저의 수면 데이터 수집)
import mysql from "mysql2/promise";
import fetch from "node-fetch";

// ─── 1. 환경 변수 가져오기 ───────────────────────────────
const {
  DB_HOST,
  DB_PORT = "3306",
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  FITBIT_CLIENT_ID,
  FITBIT_CLIENT_SECRET
} = process.env;

// ─── 2. MySQL 연결 함수 ──────────────────────────────────
async function getConnection() {
  return mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: "Amazon RDS"
  });
}

// ─── 3. 토큰 검증 및 리프레시 ─────────────────────────────
async function ensureValidToken(userId) {
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute(
      `SELECT fitbit_id, access_token, refresh_token, token_type, scope, expires_at
         FROM UserToken
        WHERE user_id = ?`,
      [userId]
    );
    if (rows.length === 0) {
      throw new Error(`UserToken 레코드를 찾을 수 없습니다. user_id=${userId}`);
    }
    const tokenRow = rows[0];
    const nowUtc = new Date();
    const expiresAt = new Date(tokenRow.expires_at);

    // 만료 시 리프레시
    if (expiresAt.getTime() <= nowUtc.getTime()) {
      console.log(`[토큰 재발급] userId=${userId} : 기존 access_token 만료`);
      const basicAuth = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenRow.refresh_token
      });
      const tokenRes = await fetch("https://api.fitbit.com/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Fitbit 리프레시 토큰 요청 실패: ${tokenRes.status} ${errText}`);
      }
      const newTok = await tokenRes.json();
      const {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: newExpiresIn,
        token_type: newTokenType,
        scope: newScope
      } = newTok;
      await conn.execute(
        `UPDATE UserToken
            SET access_token  = ?,
                refresh_token = ?,
                token_type    = ?,
                scope         = ?,
                expires_at    = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND)
          WHERE user_id = ?`,
        [newAccessToken, newRefreshToken, newTokenType, newScope, newExpiresIn, userId]
      );
      console.log(`[DB 업데이트] 새 access_token 저장 (userId=${userId})`);
      return {
        fitbit_id: tokenRow.fitbit_id,
        access_token: newAccessToken
      };
    }
    return {
      fitbit_id: tokenRow.fitbit_id,
      access_token: tokenRow.access_token
    };
  } finally {
    await conn.end();
  }
}

// ─── 4. Fitbit API 호출 함수 ─────────────────────────────
async function fetchFitbitSleep(fitbitId, accessToken) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const date = `${yyyy}-${mm}-${dd}`;
  const url = `https://api.fitbit.com/1.2/user/${fitbitId}/sleep/date/${date}.json`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fitbit 수면 데이터 요청 실패: ${res.status} ${err}`);
  }
  return res.json();
}

// ─── 5. Lambda 핸들러: 모든 토큰 보유 유저 대상 ───────────
export const handler = async (event) => {
  let summary = [];
  try {
    // 토큰 보유 유저 조회
    const connMain = await getConnection();
    const [users] = await connMain.execute(
      `SELECT DISTINCT user_id FROM UserToken`
    );
    await connMain.end();
    if (!users.length) {
      return { statusCode: 204, body: "토큰 보유 유저가 없습니다." };
    }

    // 개별 유저 처리
    for (const row of users) {
      const userId = row.user_id;
      try {
        // 토큰 유효화
        const { fitbit_id, access_token } = await ensureValidToken(userId);
        // Fitbit 수면 데이터 조회
        const sleepData = await fetchFitbitSleep(fitbit_id, access_token);
        const allLogs = sleepData.sleep || [];
        if (!allLogs.length) {
          summary.push({ userId, status: 'no_data' });
          continue;
        }
        const mainSleep = allLogs.find(s=>s.isMainSleep) || allLogs[0];
        // DB 저장
        const conn = await getConnection();
        await conn.beginTransaction();
        // SleepData
        const [sleepRes] = await conn.execute(
          `INSERT INTO SleepData (sleep_date, sleep_score, total_sleep_minutes, user_id)
           VALUES (?, ?, ?, ?)`,
          [mainSleep.dateOfSleep, mainSleep.efficiency, mainSleep.minutesAsleep, userId]
        );
        const sleepId = sleepRes.insertId;
        // Summary
        const summaryList = Array.isArray(mainSleep.levels?.summary)
          ? mainSleep.levels.summary
          : Object.entries(mainSleep.levels?.summary || {}).map(([lvl, info]) => ({ level: lvl, count: info.count, minutes: info.minutes }));
        for (const s of summaryList) {
          await conn.execute(
            `INSERT INTO SleepLevelSummary (sleep_id, level, count, minutes)
             VALUES (?, ?, ?, ?)`,
            [sleepId, s.level, s.count, s.minutes]
          );
        }
        // Detail
        for (const d of mainSleep.levels?.data || []) {
          await conn.execute(
            `INSERT INTO SleepLevelDetail (sleep_id, start_time, level, duration_sec)
             VALUES (?, ?, ?, ?)`,
            [sleepId, d.dateTime, d.level, d.seconds]
          );
        }
        await conn.commit();
        await conn.end();
        summary.push({ userId, status: 'saved', sleepId });
      } catch (err) {
        console.error(`User ${userId} 처리 중 오류:`, err);
        summary.push({ userId, status: 'error', error: err.message });
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ results: summary })
    };
  } catch (e) {
    console.error("전체 처리 오류:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
