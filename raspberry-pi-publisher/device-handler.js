const awsIot = require('aws-iot-device-sdk');
const sensor = require('node-dht-sensor').promises;

// MQTT 설정
const device = awsIot.device({
  keyPath: './private.pem.key',
  certPath: './certificate.pem.crt',
  caPath: './AmazonRootCA1.pem',
  clientId: 'raspberry-client',
  host: 'YOUR_ENDPOINT.iot.YOUR_REGION.amazonaws.com'
});

// 센서 설정
const DHT_TYPE = 11; // DHT11
const GPIO_PIN = 4;  // 연결된 GPIO 핀 번호

// AWS IoT Core 연결
device.on('connect', () => {
  console.log('✅ Connected to AWS IoT Core');

  // 1. 장비 제어 토픽 구독
  device.subscribe('/device/control', (err) => {
    if (err) {
      console.error('❌ Subscription failed:', err);
    } else {
      console.log('📡 Subscribed to /device/control');
    }
  });

  // 2. 주기적으로 센서 데이터 읽고 발행
  setInterval(async () => {
    try {
      const res = await sensor.read(DHT_TYPE, GPIO_PIN);
      const data = {
        temperature: parseFloat(res.temperature.toFixed(1)),
        humidity: parseFloat(res.humidity.toFixed(1)),
        timestamp: new Date().toISOString()
      };

      device.publish('/device/data', JSON.stringify(data));
      console.log('📤 Published /device/data:', data);

    } catch (err) {
      console.error('❌ Sensor read error:', err);
    }
  }, 5000); // 5초 주기
});

// 3. 제어 메시지 수신 시 출력
device.on('message', (topic, payload) => {
  if (topic === '/device/control') {
    try {
      const message = JSON.parse(payload.toString());
      console.log('⚙️ Received /device/control:', message.actions);
    } catch (e) {
      console.error('❌ Invalid control message:', payload.toString());
    }
  }
});
