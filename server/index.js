const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// Initialize SQLite DB (file-based)
const DB_PATH = path.join(__dirname, 'notary.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    joinDate TEXT,
    ownerId TEXT,
    createdAt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    caseNumber TEXT,
    clientName TEXT,
    type TEXT,
    amount REAL,
    dueDate TEXT,
    description TEXT,
    status TEXT,
    ownerId TEXT,
    createdAt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    role TEXT,
    createdAt TEXT
  )`);
});

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// CLIENTS
app.post('/api/clients', (req, res) => {
  const c = req.body;
  const id = c.id || (Date.now().toString());
  const stmt = db.prepare(`INSERT OR REPLACE INTO clients (id,name,email,phone,address,joinDate,ownerId,createdAt) VALUES (?,?,?,?,?,?,?,?)`);
  stmt.run(id, c.name || null, c.email || null, c.phone || null, c.address || null, c.joinDate || null, c.ownerId || null, c.createdAt || null, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
});

app.put('/api/clients/:id', (req, res) => {
  const id = req.params.id;
  const c = req.body;
  const stmt = db.prepare(`UPDATE clients SET name=?,email=?,phone=?,address=?,joinDate=?,ownerId=?,createdAt=? WHERE id=?`);
  stmt.run(c.name || null, c.email || null, c.phone || null, c.address || null, c.joinDate || null, c.ownerId || null, c.createdAt || null, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/clients/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM clients WHERE id = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.get('/api/clients', (req, res) => {
  db.all(`SELECT * FROM clients ORDER BY createdAt DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// CASES
app.post('/api/cases', (req, res) => {
  const c = req.body;
  const id = c.id || (Date.now().toString());
  const stmt = db.prepare(`INSERT OR REPLACE INTO cases (id,caseNumber,clientName,type,amount,dueDate,description,status,ownerId,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  stmt.run(id, c.caseNumber || null, c.clientName || null, c.type || null, c.amount || 0, c.dueDate || null, c.description || null, c.status || null, c.ownerId || null, c.createdAt || null, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
});

app.put('/api/cases/:id', (req, res) => {
  const id = req.params.id;
  const c = req.body;
  const stmt = db.prepare(`UPDATE cases SET caseNumber=?,clientName=?,type=?,amount=?,dueDate=?,description=?,status=?,ownerId=?,createdAt=? WHERE id=?`);
  stmt.run(c.caseNumber || null, c.clientName || null, c.type || null, c.amount || 0, c.dueDate || null, c.description || null, c.status || null, c.ownerId || null, c.createdAt || null, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/cases/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM cases WHERE id = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.get('/api/cases', (req, res) => {
  db.all(`SELECT * FROM cases ORDER BY createdAt DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// USERS sync (optional)
app.post('/api/users', (req, res) => {
  const u = req.body;
  const id = u.id || (Date.now().toString());
  const stmt = db.prepare(`INSERT OR REPLACE INTO users (id,email,role,createdAt) VALUES (?,?,?,?)`);
  stmt.run(id, u.email || null, u.role || null, u.createdAt || null, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id });
  });
});

// Serve static public folder optionally
app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => console.log(`Backend (SQLite) listening on port ${PORT}`));
