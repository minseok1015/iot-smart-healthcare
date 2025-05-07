// routes/sleep.js

const express = require('express');
const router = express.Router();
const {
  getAllSleepData,
  getLatestSleepData,
  addSleepData,
} = require('../src/sleep-store');

// GET /api/sleep
router.get('/', (req, res) => {
  res.json(getAllSleepData());
});

// GET /api/sleep/latest
router.get('/latest', (req, res) => {
  const latest = getLatestSleepData();
  if (!latest) return res.status(404).json({ message: 'No data yet' });
  res.json(latest);
});

// POST /api/sleep (선택 기능: 수동 요청 테스트용)
router.post('/', async (req, res) => {
  try {
    const { fetchSleepData } = require('../src/test');
    const data = await fetchSleepData(); // 이 함수가 API 요청한다고 가정
    addSleepData(data);
    res.status(201).json({ message: 'Fetched and saved', data });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error fetching sleep data', error: err.message });
  }
});

module.exports = router;
