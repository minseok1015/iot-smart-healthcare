// SPDX-License-Identifier: Apache-2.0
// Lambda: /auth/fitbit/callback (로그 → Fitbit 권한 콜백)
import fetch from "node-fetch";
import { Signer } from "@aws-sdk/rds-signer";
import mysql from "mysql2/promise";

// ---------- RDS IAM 연결 ----------
const dbCfg = {
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,       
  database: process.env.DB_NAME,
  ssl:      "Amazon RDS"                  
};

async function getConn() {
  console.log("Connecting to RDS with password...");
  return mysql.createConnection(dbCfg);
}

// ---------- Lambda 핸들러 ----------
export const handler = async (event) => {
  console.log("▶ /auth/fitbit/callback invoked", { query: event.queryStringParameters });
  try {
    // 파라미터 추출
    const { code, state: returnedState } = event.queryStringParameters ?? {};
    console.log("Parsed parameters", { code, returnedState });

    // 필수 파라미터 확인
    if (!code) {
      console.warn("Missing code parameter");
      return { statusCode: 400, body: "Missing ?code" };
    }

    // Fitbit 토큰 교환
    const basic = Buffer.from(
      `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`
    ).toString("base64");
    console.log("Basic auth header prepared");

    const body = new URLSearchParams({
      grant_type:   "authorization_code",
      client_id:    process.env.FITBIT_CLIENT_ID,
      redirect_uri: process.env.FITBIT_REDIRECT_URI,
      code
    });
    console.log("Request body for token exchange", body.toString());

    console.log("Sending token exchange request to Fitbit");
    const tokenRes = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });
    console.log("Token exchange response status", tokenRes.status);

    if (!tokenRes.ok) {
      const errTxt = await tokenRes.text();
      console.error("Fitbit token error:", errTxt);
      return { statusCode: 502, body: "Token exchange failed" };
    }

    const tok = await tokenRes.json();
    console.log("Token response JSON", tok);
    const {
      access_token,
      refresh_token,
      user_id,
      expires_in,
      token_type,
      scope
    } = tok;

    // RDS 저장 
    console.log("Upserting token in RDS for user", user_id);
    const conn = await getConn();
    
    try {
      await conn.execute(
        `REPLACE INTO UserToken
           (user_id, fitbit_id, access_token, refresh_token,
            token_type, scope, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))`,
        ["1", user_id, access_token, refresh_token, token_type, scope, expires_in ]
      );
      console.log("RDS upsert successful for user", user_id);
    } finally {
      await conn.end();
      console.log("Closed RDS connection");
    }

    // 성공 응답
    console.log("Redirecting to login success page");
    return {
      statusCode: 302,
      headers: { Location: "https://sleep-keeper.vercel.app/home/?status=success" },
      body: "get token success"
    };
  } catch (e) {
    console.error("💥 Unhandled error in /auth/fitbit/callback:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
