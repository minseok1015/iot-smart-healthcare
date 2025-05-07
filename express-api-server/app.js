const express = require('express');
const bodyParser = require('body-parser');

const apiRouter = require('./routes/api');
const sensorRouter = require('./routes/sensorData');
const sleepRouter = require('./routes/sleep');

const { startScheduler } = require('./src/sleep-scheduler');
const { test } = require('./src/test');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// 분리된 라우터 mount
app.use('/api', apiRouter); // GET /api
app.use('/api/environment', sensorRouter); // POST /api/environment
app.use('/api/sleep', sleepRouter);

app.listen(PORT, () => {
  console.log(`server running: http://localhost:${PORT}`);
  startScheduler();
  test();
});
