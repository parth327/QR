const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'records.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readAll() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Failed to parse records.json, starting fresh.', err);
    return [];
  }
}

function writeAll(records) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

function getAllRecords() {
  return readAll().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getRecordById(id) {
  return readAll().find((r) => r.id === id) || null;
}

function addRecord(record) {
  const records = readAll();
  records.push(record);
  writeAll(records);
  return record;
}

function deleteRecord(id) {
  const records = readAll();
  const filtered = records.filter((r) => r.id !== id);
  writeAll(filtered);
  return records.length !== filtered.length;
}

function countRecords() {
  return readAll().length;
}

module.exports = {
  getAllRecords,
  getRecordById,
  addRecord,
  deleteRecord,
  countRecords,
};
