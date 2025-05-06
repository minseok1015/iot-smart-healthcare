const express = require('express');
const bodyParser = require('body-parser');

const apiRouter = require('./routes/api');
const sensorRouter = require('./routes/sensordata');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// 분리된 라우터 mount
app.use('/api', apiRouter); // GET /api
app.use('/api/environment', sensorRouter); // POST /api/environment

app.listen(PORT, () => {
  console.log(`server running: http://localhost:${PORT}`);
});
