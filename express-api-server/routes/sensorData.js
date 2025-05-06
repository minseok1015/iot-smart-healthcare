const express = require('express');
const sensorRouter = express.Router();

sensorRouter.post('/', (req, res) => {
  const { temperature, humidity, co2 } = req.body;
  console.log('data:', temperature, humidity, co2);

  res.status(200).json({ message: 'accepted' });
});

module.exports = sensorRouter;
