const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Persistence: todos.txt ───────────────────
// 사람이 읽을 수 있는 형태로 한 줄에 할일 하나씩 저장한다: "[ ] 내용" / "[x] 내용"
const TODOS_FILE = path.join(__dirname, 'todos.txt');

function loadTodos() {
  if (!fs.existsSync(TODOS_FILE)) return [];
  const lines = fs.readFileSync(TODOS_FILE, 'utf-8').split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map((line, idx) => {
    const done = line.startsWith('[x]');
    const text = line.replace(/^\[[ x]\]\s*/, '');
    return { id: idx + 1, text, done };
  });
}

function saveTodos() {
  const content = todos.map((t) => `[${t.done ? 'x' : ' '}] ${t.text}`).join('\n') + (todos.length ? '\n' : '');
  fs.writeFileSync(TODOS_FILE, content, 'utf-8');
}

// ── In-memory store (서버 시작 시 todos.txt에서 복원) ─────────
let todos = loadTodos();
let nextId = todos.length ? Math.max(...todos.map((t) => t.id)) + 1 : 1;

// ── API routes ───────────────────────────────
app.get('/api/todos', (_req, res) => {
  res.json({ success: true, data: todos });
});

app.post('/api/todos', (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }
  const todo = { id: nextId++, text: text.trim(), done: false };
  todos.push(todo);
  saveTodos();
  res.status(201).json({ success: true, data: todo });
});

app.patch('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }
  const { text, done } = req.body || {};
  if (typeof text === 'string' && text.trim()) todo.text = text.trim();
  if (typeof done === 'boolean') todo.done = done;
  saveTodos();
  res.json({ success: true, data: todo });
});

app.delete('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }
  const [removed] = todos.splice(idx, 1);
  saveTodos();
  res.json({ success: true, data: removed });
});

// ── SPA fallback (Express 5 문법) ─────────────
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Error handler ────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Local: 서버 시작 / Vercel: app export
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
