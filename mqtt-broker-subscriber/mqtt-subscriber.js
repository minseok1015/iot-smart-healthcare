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
