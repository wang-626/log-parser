const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();
require('./websocket/ws');
const db = require('./communication_js/Data/dal/db');

// 啟動時從 DB 載入 com_port 設定
const savedComPort = db.prepare("SELECT value FROM settings WHERE key='com_port'").get();
if (savedComPort) process.env.COM_PORT = savedComPort.value;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/knu', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'knu.html'));
});

app.get('/oit', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'oit.html'));
});

app.get('/cpu', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'cpu.html'));
});

app.get('/ntut', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'ntut.html'));
});

app.get('/hk-old', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'hk-old.html'));
});

app.get('/settings', (_req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

// Lazy-load the JS communication dispatcher (avoids startup failure if serialport not installed yet)
let comm = null;
function getComm() {
  if (!comm) comm = require('./communication_js/index');
  return comm;
}

app.post('/command', async (req, res) => {
  const { module, args } = req.body;

  let dispatcher;
  try {
    dispatcher = getComm();
  } catch (e) {
    return res.status(500).json({ error: `Failed to load communication module: ${e.message}` });
  }

  if (!dispatcher.handlers[module]) {
    return res.status(400).json({
      error: `Unknown module: ${module}. Available: ${Object.keys(dispatcher.handlers).join(', ')}`,
    });
  }

  try {
    const stdout = await dispatcher.handlers[module].run(args || {});
    console.log('Module:', module, 'Args:', args);
    console.log('Output:', stdout);
    res.status(200).json({ stdout: stdout || 'success', stderr: '' });
  } catch (err) {
    console.error('Command error:', err.message);
    res.status(500).json({ error: err.message, stdout: '', stderr: err.message });
  }
});

// ─── Settings API ─────────────────────────────────────────────────────────────

// General settings (key/value pairs)
app.get('/api/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const result = {};
  for (const r of rows) result[r.key] = r.value;
  res.json(result);
});

app.put('/api/settings', (req, res) => {
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  const many = db.transaction((entries) => {
    for (const [key, value] of entries) upsert.run(key, String(value));
  });
  many(Object.entries(req.body));
  if (req.body.com_port) process.env.COM_PORT = req.body.com_port;
  res.json({ ok: true });
});

// 偵測可用 COM ports
app.get('/api/settings/ports', async (_req, res) => {
  try {
    const { SerialPort } = require('serialport');
    const ports = await SerialPort.list();
    res.json(ports.map(p => ({ path: p.path, description: p.friendlyName || p.manufacturer || '' })));
  } catch (e) {
    res.json([]);
  }
});


// Room management
app.get('/api/settings/rooms', (_req, res) => {
  res.json(db.prepare('SELECT * FROM room ORDER BY dong, center_id, meter_id').all());
});

app.post('/api/settings/rooms', (req, res) => {
  const { name, center_id, meter_id, dong, floor, mode, price_degree, mode_220, price_degree_220, system_mode } = req.body;
  const result = db.prepare(
    `INSERT INTO room (name, center_id, meter_id, dong, floor, mode, price_degree, mode_220, price_degree_220, system_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, center_id, meter_id, dong, floor ?? 1, mode ?? 0, price_degree ?? 0, mode_220 ?? 0, price_degree_220 ?? 0, system_mode ?? 0);
  res.json({ ok: true, id: result.lastInsertRowid });
});

app.put('/api/settings/rooms/:id', (req, res) => {
  const { name, center_id, meter_id, dong, floor, mode, price_degree, mode_220, price_degree_220, enable, system_mode } = req.body;
  db.prepare(
    `UPDATE room SET name=?, center_id=?, meter_id=?, dong=?, floor=?, mode=?, price_degree=?,
     mode_220=?, price_degree_220=?, enable=?, system_mode=? WHERE id=?`
  ).run(name, center_id, meter_id, dong, floor ?? 1, mode ?? 0, price_degree ?? 0,
        mode_220 ?? 0, price_degree_220 ?? 0, enable ?? 1, system_mode ?? 0, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/settings/rooms/:id', (req, res) => {
  db.prepare('DELETE FROM room WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Member management
app.get('/api/settings/members', (_req, res) => {
  res.json(db.prepare(
    `SELECT id, username, id_card, room_strings, balance, powerstatus, identity, can_control_power FROM member ORDER BY room_strings, identity DESC, id`
  ).all());
});

app.post('/api/settings/members/batch', (req, res) => {
  const { room_strings, members } = req.body;
  if (!Array.isArray(members) || members.length === 0) return res.status(400).json({ error: 'members is empty' });
  const insert = db.prepare(
    `INSERT INTO member (username, id_card, room_strings, balance, powerstatus, identity, can_control_power)
     VALUES (?, ?, ?, 0, 0, 0, 1)`
  );
  const insertMany = db.transaction((list) => {
    for (const m of list) insert.run(m.username ?? '', m.id_card ?? '', room_strings ?? '');
  });
  insertMany(members);
  res.json({ ok: true, count: members.length });
});

app.post('/api/settings/members', (req, res) => {
  const { username, id_card, room_strings, balance, powerstatus, identity, can_control_power } = req.body;
  const result = db.prepare(
    `INSERT INTO member (username, id_card, room_strings, balance, powerstatus, identity, can_control_power)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(username, id_card, room_strings, balance ?? 0, powerstatus ?? 0, identity ?? 0, can_control_power ?? 1);
  res.json({ ok: true, id: result.lastInsertRowid });
});

app.put('/api/settings/members/batch', (req, res) => {
  const { ids, room_strings } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids is empty' });
  const update = db.prepare(`UPDATE member SET room_strings=? WHERE id=?`);
  const updateMany = db.transaction((list) => {
    for (const id of list) update.run(room_strings, id);
  });
  updateMany(ids);
  res.json({ ok: true, count: ids.length });
});

app.put('/api/settings/members/:id', (req, res) => {
  const { username, id_card, room_strings, balance, powerstatus, identity, can_control_power } = req.body;
  db.prepare(
    `UPDATE member SET username=?, id_card=?, room_strings=?, balance=?, powerstatus=?, identity=?, can_control_power=? WHERE id=?`
  ).run(username, id_card, room_strings, balance ?? 0, powerstatus ?? 0, identity ?? 0, can_control_power ?? 1, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/settings/members/:id', (req, res) => {
  db.prepare('DELETE FROM member WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

console.log(`server run in http://127.0.0.1:${process.env.WEB_PORT}`);
app.listen(process.env.WEB_PORT);
