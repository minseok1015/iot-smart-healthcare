const express = require('express');
const router = express.Router();

const sensorDataStore = []; // 임시 배열. 나중엔 DB로 대체 가능

// POST /api/environment
router.post('/', (req, res) => {
  const data = {
    id: Date.now().toString(),
    ...req.body,
  };
  sensorDataStore.push(data);
  res.status(201).json({ message: 'Data stored', data });
});

// GET /api/environment
router.get('/', (req, res) => {
  res.json(sensorDataStore);
});

// GET /api/environment/latest
router.get('/latest', (req, res) => {
  if (sensorDataStore.length === 0) {
    return res.status(404).json({ message: 'No data available' });
  }
  res.json(sensorDataStore[sensorDataStore.length - 1]);
});

// GET /api/environment/:id
router.get('/:id', (req, res) => {
  const data = sensorDataStore.find((d) => d.id === req.params.id);
  if (!data) return res.status(404).json({ message: 'Data not found' });
  res.json(data);
});

// DELETE /api/environment/:id
router.delete('/:id', (req, res) => {
  const index = sensorDataStore.findIndex((d) => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Data not found' });

  const deleted = sensorDataStore.splice(index, 1);
  res.json({ message: 'Deleted', data: deleted[0] });
});

module.exports = router;
