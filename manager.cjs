#!/usr/bin/env node
/**
 * CookMe Service Manager
 * Uso: node manager.js
 * Acesse: http://localhost:9999
 */

const http  = require('http');
const { spawn, exec } = require('child_process');
const path  = require('path');

const MANAGER_PORT = 9999;
const ROOT = path.resolve(__dirname);

// ─── Definição dos serviços ───────────────────────────────────────────────────

const SERVICES = {
  postgres: {
    label: 'PostgreSQL', icon: '🐘', port: 5432, color: '#336791',
    docker: true, container: 'postgres-cookme',
    startArgs: ['docker', ['compose', 'up', '-d', 'postgres']],
    stopArgs:  ['docker', ['compose', 'stop', 'postgres']],
  },
  redis: {
    label: 'Redis', icon: '⚡', port: 6379, color: '#DC382D',
    docker: true, container: 'redis-cookme',
    startArgs: ['docker', ['compose', 'up', '-d', 'redis']],
    stopArgs:  ['docker', ['compose', 'stop', 'redis']],
  },
  backend: {
    label: 'Backend (NestJS)', icon: '🔧', port: 3000, color: '#E0234E',
    docker: false, cwd: path.join(ROOT, 'backend'),
    cmd: 'npm', args: ['run', 'start:dev'],
  },
  frontend: {
    label: 'Frontend (Vite)', icon: '🌐', port: 5173, color: '#646CFF',
    docker: false, cwd: path.join(ROOT, 'frontend'),
    cmd: 'npm', args: ['run', 'dev'],
  },
  mobile: {
    label: 'Mobile (Expo)', icon: '📱', port: 8081, color: '#1a1a2e',
    docker: false, cwd: path.join(ROOT, 'mobile'),
    cmd: 'npx', args: ['expo', 'start', '--clear'],
  },
};

// ─── Estado ───────────────────────────────────────────────────────────────────

const procs   = {};        // id → ChildProcess
const logs    = {};        // id → [{t, line}]
const clients = [];        // SSE Response objects
let   expoUrl = null;

Object.keys(SERVICES).forEach(id => (logs[id] = []));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const stripAnsi = s => s.replace(/\x1B\[[0-9;]*[mGKHFJ]/g, '').replace(/\r/g, '');

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = clients.length - 1; i >= 0; i--) {
    try { clients[i].write(msg); }
    catch { clients.splice(i, 1); }
  }
}

function addLog(id, raw) {
  const line = stripAnsi(raw).trim();
  if (!line) return;
  const entry = { t: Date.now(), line };
  logs[id].push(entry);
  if (logs[id].length > 200) logs[id].shift();
  broadcast('log', { service: id, ...entry });

  // Detecta URL do Expo
  if (id === 'mobile') {
    const m = line.match(/exp:\/\/[\d.]+:\d+/);
    if (m && m[0] !== expoUrl) {
      expoUrl = m[0];
      broadcast('expo-url', { url: expoUrl });
    }
  }
}

function killPort(port, cb) {
  exec(`fuser -k ${port}/tcp 2>/dev/null; true`, () => setTimeout(cb, 400));
}

function portOpen(port, cb) {
  exec(`ss -tlnp | grep ':${port} '`, (e, out) => cb(!!out && out.trim().length > 0));
}

function getStatus(cb) {
  const result = {};
  let left = Object.keys(SERVICES).length;
  const done = () => { if (--left === 0) cb(result); };
  Object.entries(SERVICES).forEach(([id, svc]) => {
    if (svc.docker) {
      portOpen(svc.port, running => { result[id] = running ? 'running' : 'stopped'; done(); });
    } else {
      const p = procs[id];
      result[id] = p && !p.killed ? 'running' : 'stopped';
      done();
    }
  });
}

// ─── Controle de serviços ─────────────────────────────────────────────────────

function startService(id, cb) {
  const svc = SERVICES[id];
  if (!svc) return cb(new Error('desconhecido'));

  if (svc.docker) {
    portOpen(svc.port, alreadyUp => {
      if (alreadyUp) {
        addLog(id, `✅ ${svc.label} já está rodando (porta ${svc.port} ocupada)`);
        broadcast('status-change', { service: id, status: 'running' });
        return cb(null);
      }
      const [cmd, args] = svc.startArgs;
      addLog(id, `▶ Iniciando ${svc.label}...`);
      const p = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
      p.stdout.on('data', d => addLog(id, d.toString()));
      p.stderr.on('data', d => addLog(id, d.toString()));
      p.on('close', code => {
        addLog(id, code === 0 ? `✅ ${svc.label} rodando` : `❌ Falhou (code ${code})`);
        broadcast('status-change', { service: id, status: code === 0 ? 'running' : 'stopped' });
        cb(null);
      });
    });
  } else {
    if (id === 'mobile') expoUrl = null;
    killPort(svc.port, () => {
      addLog(id, `▶ Iniciando ${svc.label} na porta ${svc.port}...`);
      const p = spawn(svc.cmd, svc.args, {
        cwd: svc.cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      });
      procs[id] = p;
      const onData = d => d.toString().split('\n').forEach(l => addLog(id, l));
      p.stdout.on('data', onData);
      p.stderr.on('data', onData);
      p.on('close', code => {
        addLog(id, `⏹ ${svc.label} encerrado (${code})`);
        delete procs[id];
        broadcast('status-change', { service: id, status: 'stopped' });
      });
      broadcast('status-change', { service: id, status: 'running' });
      cb(null);
    });
  }
}

function stopService(id, cb) {
  const svc = SERVICES[id];
  if (!svc) return cb(new Error('desconhecido'));

  if (svc.docker) {
    const [cmd, args] = svc.stopArgs;
    addLog(id, `⏹ Parando ${svc.label}...`);
    const p = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    p.stdout.on('data', d => addLog(id, d.toString()));
    p.stderr.on('data', d => addLog(id, d.toString()));
    p.on('close', () => {
      addLog(id, `✅ ${svc.label} parado`);
      broadcast('status-change', { service: id, status: 'stopped' });
      cb(null);
    });
  } else {
    const p = procs[id];
    addLog(id, `⏹ Parando ${svc.label}...`);
    if (p && !p.killed) {
      p.kill('SIGTERM');
      setTimeout(() => { try { p.kill('SIGKILL'); } catch {} }, 3000);
    }
    killPort(svc.port, () => {
      delete procs[id];
      broadcast('status-change', { service: id, status: 'stopped' });
      cb(null);
    });
  }
}

// ─── HTML inline ─────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CookMe Manager</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1117;color:#e2e8f0;min-height:100vh}
header{background:#161b27;border-bottom:1px solid #1e2535;padding:16px 24px;display:flex;align-items:center;gap:12px}
header h1{font-size:20px;font-weight:700;color:#f8fafc}
header span{font-size:24px}
.subtitle{font-size:13px;color:#64748b;margin-left:auto}
.container{max-width:1100px;margin:0 auto;padding:24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:28px}

.card{background:#161b27;border:1px solid #1e2535;border-radius:14px;padding:18px;transition:border-color .2s}
.card:hover{border-color:#2d3748}
.card-top{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.card-icon{font-size:24px;line-height:1}
.card-info{flex:1;min-width:0}
.card-label{font-size:14px;font-weight:600;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-port{font-size:11px;color:#475569;margin-top:1px}
.dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;transition:background .3s}
.dot.running{background:#22c55e;box-shadow:0 0 6px #22c55e88}
.dot.stopped{background:#475569}
.dot.starting{background:#f59e0b;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

.actions{display:flex;gap:6px}
.btn{flex:1;padding:7px 10px;border-radius:8px;border:none;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-start{background:#16a34a;color:#fff}
.btn-start:hover{background:#15803d}
.btn-stop{background:#991b1b;color:#fff}
.btn-stop:hover{background:#7f1d1d}
.btn:disabled{opacity:.4;cursor:default}
.btn-log{background:#1e2535;color:#94a3b8;padding:6px 10px;border-radius:8px;border:none;font-size:11px;cursor:pointer}
.btn-log:hover{background:#2d3748}
.btn-all{padding:8px 16px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
.btn-all-start{background:#16a34a;color:#fff}
.btn-all-start:hover{background:#15803d}
.btn-all-stop{background:#7f1d1d;color:#fff}
.btn-all-stop:hover{background:#6b1a1a}

/* QR section */
.qr-section{background:#161b27;border:1px solid #1e2535;border-radius:14px;padding:20px;margin-bottom:28px;display:flex;align-items:center;gap:24px}
.qr-section.hidden{display:none}
#qr-box{width:140px;height:140px;background:#fff;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
#qr-box canvas,#qr-box img{max-width:140px!important;max-height:140px!important}
.qr-info h3{font-size:16px;font-weight:700;color:#f1f5f9;margin-bottom:6px}
.qr-url{font-size:12px;color:#22c55e;font-family:monospace;margin-bottom:8px;word-break:break-all}
.qr-hint{font-size:12px;color:#64748b;line-height:1.5}

/* Log panel */
.log-panel{display:none;margin-top:12px}
.log-panel.open{display:block}
.log-console{background:#0a0c12;border:1px solid #1e2535;border-radius:8px;padding:10px 12px;font-family:'Fira Code',monospace;font-size:11px;color:#94a3b8;height:180px;overflow-y:auto;line-height:1.5}
.log-console .err{color:#f87171}
.log-console .ok{color:#4ade80}
.log-console .info{color:#60a5fa}

/* Actions bar */
.actions-bar{display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;align-items:center}
.actions-bar h2{font-size:14px;color:#64748b;flex:1}

/* Section title */
.section-title{font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px}
</style>
</head>
<body>
<header>
  <span>🍳</span>
  <h1>CookMe Manager</h1>
  <span class="subtitle" id="ts">—</span>
</header>

<div class="container">

  <!-- QR Code Expo -->
  <div class="qr-section hidden" id="qr-section">
    <div id="qr-box"><span style="color:#475569;font-size:12px">aguardando...</span></div>
    <div class="qr-info">
      <h3>📱 Expo Go</h3>
      <div class="qr-url" id="qr-url">—</div>
      <div class="qr-hint">Escaneie com o app <strong>Expo Go</strong><br>ou abra a URL no simulador</div>
    </div>
  </div>

  <!-- Ações globais -->
  <div class="actions-bar">
    <h2>Serviços</h2>
    <button class="btn-all btn-all-start" onclick="startAll()">▶ Iniciar Tudo</button>
    <button class="btn-all btn-all-stop" onclick="stopAll()">⏹ Parar Tudo</button>
  </div>

  <!-- Cards -->
  <div class="grid" id="grid"></div>

</div>

<script>
const SERVICES = ${JSON.stringify(
  Object.fromEntries(Object.entries(SERVICES).map(([id, s]) => [id, { label: s.label, icon: s.icon, port: s.port, color: s.color }]))
)};

const status = {};
const logPanels = {};
Object.keys(SERVICES).forEach(id => { status[id] = 'stopped'; logPanels[id] = []; });

// ── Render cards ────────────────────────────────────────────────────────────

function render() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  Object.entries(SERVICES).forEach(([id, svc]) => {
    const st = status[id];
    const isRunning = st === 'running';
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'card-' + id;
    card.innerHTML = \`
      <div class="card-top">
        <span class="card-icon">\${svc.icon}</span>
        <div class="card-info">
          <div class="card-label">\${svc.label}</div>
          <div class="card-port">:\${svc.port}</div>
        </div>
        <div class="dot \${st}" id="dot-\${id}" title="\${st}"></div>
      </div>
      <div class="actions">
        <button class="btn btn-start" id="btn-start-\${id}" \${isRunning ? 'disabled' : ''} onclick="start('\${id}')">▶ Iniciar</button>
        <button class="btn btn-stop" id="btn-stop-\${id}" \${!isRunning ? 'disabled' : ''} onclick="stop('\${id}')">⏹ Parar</button>
      </div>
      <div style="margin-top:8px">
        <button class="btn-log" onclick="toggleLog('\${id}')">📋 Log</button>
      </div>
      <div class="log-panel" id="log-\${id}">
        <div class="log-console" id="console-\${id}"></div>
      </div>
    \`;
    grid.appendChild(card);
    // Replay buffered logs
    logPanels[id].forEach(e => appendLog(id, e.line));
  });
}

function updateCard(id) {
  const st = status[id];
  const dot = document.getElementById('dot-' + id);
  const bs  = document.getElementById('btn-start-' + id);
  const bst = document.getElementById('btn-stop-'  + id);
  if (!dot) return;
  dot.className = 'dot ' + st;
  dot.title = st;
  if (bs)  bs.disabled  = st === 'running';
  if (bst) bst.disabled = st !== 'running';
}

function appendLog(id, line) {
  const el = document.getElementById('console-' + id);
  if (!el) return;
  const span = document.createElement('span');
  const low = line.toLowerCase();
  span.className = low.includes('error') || low.includes('✗') || low.includes('❌') ? 'err'
                 : low.includes('✅') || low.includes('✓') || low.includes('ready') ? 'ok'
                 : low.includes('▶') || low.includes('warn') ? 'info' : '';
  span.textContent = line;
  el.appendChild(span);
  el.appendChild(document.createTextNode('\\n'));
  // Limita DOM a 100 linhas
  while (el.childNodes.length > 200) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}

function toggleLog(id) {
  const panel = document.getElementById('log-' + id);
  panel.classList.toggle('open');
}

// ── QR Code ─────────────────────────────────────────────────────────────────

let qrInstance = null;
function renderQR(url) {
  const section = document.getElementById('qr-section');
  const box     = document.getElementById('qr-box');
  const urlEl   = document.getElementById('qr-url');
  section.classList.remove('hidden');
  urlEl.textContent = url;
  box.innerHTML = '';
  try {
    qrInstance = new QRCode(box, { text: url, width: 140, height: 140, correctLevel: QRCode.CorrectLevel.M });
  } catch(e) {
    box.textContent = url;
  }
}

// ── API calls ───────────────────────────────────────────────────────────────

async function start(id) {
  const btn = document.getElementById('btn-start-' + id);
  if (btn) btn.disabled = true;
  updateStatus(id, 'starting');
  await fetch('/api/service/' + id + '/start', { method: 'POST' });
}

async function stop(id) {
  const btn = document.getElementById('btn-stop-' + id);
  if (btn) btn.disabled = true;
  await fetch('/api/service/' + id + '/stop', { method: 'POST' });
}

function startAll() {
  ['postgres','redis','backend','frontend','mobile'].forEach((id, i) =>
    setTimeout(() => start(id), i * 800));
}
function stopAll() {
  Object.keys(SERVICES).forEach(id => stop(id));
}

function updateStatus(id, st) {
  status[id] = st;
  updateCard(id);
}

// ── SSE ─────────────────────────────────────────────────────────────────────

function connect() {
  const es = new EventSource('/events');

  es.addEventListener('status-change', e => {
    const d = JSON.parse(e.data);
    updateStatus(d.service, d.status);
  });

  es.addEventListener('log', e => {
    const d = JSON.parse(e.data);
    logPanels[d.service] = logPanels[d.service] || [];
    logPanels[d.service].push(d);
    if (logPanels[d.service].length > 300) logPanels[d.service].shift();
    appendLog(d.service, d.line);
  });

  es.addEventListener('expo-url', e => {
    const d = JSON.parse(e.data);
    renderQR(d.url);
  });

  es.addEventListener('init', e => {
    const d = JSON.parse(e.data);
    Object.entries(d.status).forEach(([id, st]) => updateStatus(id, st));
    if (d.expoUrl) renderQR(d.expoUrl);
    // replay logs in chunks to avoid blocking UI thread
    const allEntries = [];
    Object.entries(d.logs).forEach(([id, entries]) => {
      logPanels[id] = entries;
      entries.forEach(en => allEntries.push({ id, line: en.line }));
    });
    let i = 0;
    function flush() {
      const end = Math.min(i + 10, allEntries.length);
      for (; i < end; i++) appendLog(allEntries[i].id, allEntries[i].line);
      if (i < allEntries.length) requestAnimationFrame(flush);
    }
    requestAnimationFrame(flush);
  });

  es.onerror = () => setTimeout(connect, 3000);
}

// ── Init ────────────────────────────────────────────────────────────────────

render();
connect();
setInterval(() => {
  document.getElementById('ts').textContent = new Date().toLocaleTimeString('pt-BR');
}, 1000);
</script>
</body>
</html>`;

// ─── HTTP Server ──────────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  const url    = req.url.split('?')[0];
  const method = req.method;

  // SSE
  if (url === '/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    clients.push(res);
    req.on('close', () => clients.splice(clients.indexOf(res), 1));

    // Envia estado atual
    getStatus(st => {
      res.write(`event: init\ndata: ${JSON.stringify({
        status: st,
        expoUrl,
        logs: Object.fromEntries(Object.entries(logs).map(([id, entries]) => [id, entries.slice(-30)])),
      })}\n\n`);
    });
    return;
  }

  // Status
  if (url === '/api/status' && method === 'GET') {
    getStatus(st => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(st));
    });
    return;
  }

  // Start / Stop
  const mStart = url.match(/^\/api\/service\/(\w+)\/start$/);
  const mStop  = url.match(/^\/api\/service\/(\w+)\/stop$/);

  if (mStart && method === 'POST') {
    startService(mStart[1], err => {
      res.writeHead(err ? 400 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: !err, error: err?.message }));
    });
    return;
  }

  if (mStop && method === 'POST') {
    stopService(mStop[1], err => {
      res.writeHead(err ? 400 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: !err, error: err?.message }));
    });
    return;
  }

  // HTML
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(MANAGER_PORT, () => {
  console.log(`\n🍳 CookMe Manager rodando em http://localhost:${MANAGER_PORT}\n`);
  console.log('Serviços disponíveis:');
  Object.values(SERVICES).forEach(s => console.log(`  ${s.icon} ${s.label} — porta ${s.port}`));
  console.log('');
});
