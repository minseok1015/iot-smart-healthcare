## 1️⃣ Mosquitto MQTT 브로커 설치

### 🔹 macOS (Homebrew 설치)

```bash
brew install mosquitto
brew services start mosquitto  # 백그라운드 실행 (선택)
```

### 🔹 Ubuntu (WSL or Linux) → EC2할때

```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

설치 확인:

```bash

mosquitto -v
```

## 2️⃣ 테스트용 메시지 발행 & 수신

### 🔸 Subscriber 터미널

```bash
mosquitto_sub -h localhost -t /sensor/data
```

### 🔸 Publisher 터미널

```bash
mosquitto_pub -h localhost -t /sensor/data -m "hello"
```

> 두 터미널에서 메시지가 정상적으로 전달되면 브로커가 잘 작동 중!

## 3️⃣ Express 서버 만들기

### 📁 `receiver.js`

```bash
npm init -y
npm install express
```

```jsx
// receiver.js
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/receive', (req, res) => {
  console.log('[Express] Received:', req.body);
  res.send('OK');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

실행:

```bash
node receiver.js
```

---

## 4️⃣ MQTT 메시지 수신 & Axios로 전달

### 📁 `mqtt-subscriber.js`

```bash
npm install mqtt axios
```

```jsx
// mqtt-subscriber.js
const mqtt = require('mqtt');
const axios = require('axios');

const client = mqtt.connect('mqtt://localhost');

client.on('connect', () => {
  console.log('[MQTT] Connected');
  client.subscribe('/sensor/data');
});

client.on('message', async (topic, message) => {
  const payload = {
    topic,
    data: message.toString(),
    time: new Date().toISOString(),
  };

  console.log('[MQTT] Received:', payload);

  try {
    await axios.post('http://localhost:3000/receive', payload);
    console.log('[Axios] POST success');
  } catch (err) {
    console.error('[Axios] POST failed:', err.message);
  }
});
```

실행:

```bash
node mqtt-subscriber.js
```

---

## 5️⃣ 테스트

```bash
mosquitto_pub -h localhost -t /sensor/data -m '{"temp": 23.5, "light": 300}'
```

Express 콘솔에 아래처럼 출력되면 성공

```css
[Express] Received: { topic: '/sensor/data', data: '{"temp": 23.5, "light": 300}', time: '...' }
```
