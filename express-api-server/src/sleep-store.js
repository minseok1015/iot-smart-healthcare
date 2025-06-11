// src/sleep-store.js

const sleepDataStore = [];

function addSleepData(data) {
  sleepDataStore.push({
    id: Date.now().toString(),
    time: new Date().toISOString(),
    ...data,
  });
}

function getAllSleepData() {
  return sleepDataStore;
}

function getLatestSleepData() {
  return sleepDataStore[sleepDataStore.length - 1];
}

module.exports = { addSleepData, getAllSleepData, getLatestSleepData };
