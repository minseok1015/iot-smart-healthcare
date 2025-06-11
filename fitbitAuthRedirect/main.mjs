// SPDX-License-Identifier: Apache-2.0
// Lambda: /auth/fitbit  (로그인 → Fitbit 권한 화면으로 302 Redirect)

import { randomBytes } from "crypto";

// ---------- 환경변수 ----------
// FITBIT_CLIENT_ID      : Fitbit 앱 Client ID
// FITBIT_REDIRECT_URI   : 콘솔에 등록한 Redirect URI (이 Lambda의 API Gateway URL)
// FITBIT_SCOPE          : 공백 구분 scopes (예: "profile activity sleep heartrate")
//                        : 지정하지 않으면 기본 scope 사용

const AUTHORIZE_ENDPOINT = "https://www.fitbit.com/oauth2/authorize";

// ---------- Lambda 핸들러 ----------
export const handler = async () => {
  // 1) CSRF 방지용 state 값 생성 (16바이트 난수 → hex)
  const state = randomBytes(16).toString("hex");

  // 2) Fitbit authorize URL 구성
  const url = new URL(AUTHORIZE_ENDPOINT);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", process.env.FITBIT_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.FITBIT_REDIRECT_URI);
  url.searchParams.set("scope", process.env.FITBIT_SCOPE || "profile activity sleep");
  url.searchParams.set("state", state);

  // 3) (선택) state 값을 HttpOnly 쿠키에 저장 — 콜백에서 검증에 사용
  const cookie = [
    `fitbit_oauth_state=${state}`,
    "Path=/",
    "Max-Age=900",   // 15분
    "HttpOnly",
    "SameSite=Lax"
  ].join("; ");

  // 4) 302 Redirect 응답
  return {
    statusCode: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": cookie
    }
  };
};
