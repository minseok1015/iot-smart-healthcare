const mqtt = require('mqtt');
const sensor = require('node-dht-sensor');

const SENSOR_TYPE = 11;
const GPIO_PIN = 4;

const client = mqtt.connect('mqtt://localhost');

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');

  setInterval(() => {
    const result = sensor.read(SENSOR_TYPE, GPIO_PIN);
    if (result.isValid) {
      const temperature = result.temperature.toFixed(1);
      const humidity = result.humidity.toFixed(1);

      const data = {
        temperature,
        humidity,
        timestamp: new Date().toISOString()
      };

      console.log('📡 Sending:', data);
      client.publish('/sensor/data', JSON.stringify(data));
    } else {
      console.error('⚠️ Failed to read from sensor');
    }
  }, 2000);
