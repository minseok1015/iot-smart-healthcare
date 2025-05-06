const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://3.37.172.142:1883'); // Change to broker IP if needed

client.on('connect', () => {
  console.log('Connected to MQTT broker. Sending data...');
  setInterval(() => {
    const data = {
      temperature: Math.floor(Math.random() * 10) + 20,
      humidity: Math.floor(Math.random() * 20) + 40,
      timestamp: new Date().toISOString()
    };
    client.publish('/sensor/data', JSON.stringify(data));
    console.log('Published:', data);
  }, 5000); // every 5 seconds
});
