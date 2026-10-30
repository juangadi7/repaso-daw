(() => {
const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 16]; // días por caja (Leitner)
const LS_KEY = 'repaso-daw-progreso-v1';
const byId = Object.fromEntries(PREGUNTAS.map(q => [q.id, q]));
const modById = Object.fromEntries(MODULOS.map(m => [m.id, m]));
const $app = document.getElementById('app');

let progress = {};          // { qid: {b, n, ok, t, due, last} }
let cloud = null;           // referencia al documento en db
let cloudState = 'local';   // local | syncing | cloud
let saveTimer = null;
let session = null;
const MODE_KEY = 'repaso-daw-modo';
let mode = 'practica';
try { mode = localStorage.getItem(MODE_KEY) || 'practica'; } catch(e){}

// ---------- apuntes ----------
// TEMAS (títulos por módulo y tema) viene de data.js
const TEMAS_N = [...new Set(PREGUNTAS.map(q => q.t))].sort((a, b) => a - b);
// RESUMEN (esquema por tema) viene de data.js
const TEMA_KEY = 'repaso-daw-tema', VIEW_KEY = 'repaso-daw-vista2';
let temaSel = 'all', notesView = 'apuntes';
try { temaSel = localStorage.getItem(TEMA_KEY) || 'all'; notesView = localStorage.getItem(VIEW_KEY) || 'apuntes'; } catch(e){}
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function secsFor(m, t, view){
  if (view === 'trucos') view = 'apuntes';
  if (view === 'apuntes') return ((APC[m] || {})[t]) || [];
  return view === 'resumen' ? ((RESUMEN[t] || {})[m] || []) : ((TEMARIO[m + '-' + t] || {}).secs || []);
}
function apcItem(it, terms){
  if (typeof it === 'string') return `<li class="${it.startsWith('  ') ? 'sub' : ''}">${hl(md(it.trim()), terms)}</li>`;
  if (it.code) return `</ul><pre>${hl(esc(it.code), terms)}</pre><ul>`;
  if (it.tb) return `</ul><div class="tblw"><table>${it.tb.map((r, i) => '<tr>' + r.map(c => i ? `<td>${hl(md(c), terms)}</td>` : `<th>${md(c)}</th>`).join('') + '</tr>').join('')}</table></div><ul>`;
  return '';
}
function secPlain(view, s){
  if (view === 'completo') return [s.t].concat(s.b.filter(b => b[0] !== 'fig' && b[0] !== 'media').map(b => b[1])).join(' ');
  return [s.t].concat(s.p.map(it => typeof it === 'string' ? it : (it.code || (it.tb || []).flat().join(' ')))).join(' ').replace(/\*\*/g, '');
}
function findSec(secs, ref){
  const r = String(ref).split(/[–-]/)[0].trim();
  let s = secs.find(x => x.id === r); if (s) return s;
  s = secs.find(x => x.id.startsWith(r + '.')); if (s) return s;
  s = secs.filter(x => r.startsWith(x.id + '.')).sort((a, b) => b.id.length - a.id.length)[0]; if (s) return s;
  return secs.filter(x => parseInt(x.id) <= parseInt(r)).pop() || secs[0];
}
function refFor(q, view){ return view === 'resumen' ? (q.ap || q.ref) : q.ref; }
const VIEW_NOTE = { apuntes: 'Todo el contenido del tema, ordenado y sin paja. Lo resaltado es lo que más suele caer.', resumen: 'Solo lo esencial, para un repaso rápido antes del examen.', completo: 'Texto completo del tema, de corrido.', trucos: 'Comparaciones y reglas cortas para lo que cuesta memorizar.' };

// resalta términos de búsqueda dentro de HTML ya escapado (solo en texto)
function hl(html, terms){
  if (!terms || !terms.length) return html;
  return html.split(/(<[^>]+>)/).map(part => {
    if (part.startsWith('<')) return part;
    let out = part;
    terms.forEach(t => {
      const n = norm(out); let res = '', i = 0, idx;
      while ((idx = n.indexOf(t, i)) !== -1) { res += out.slice(i, idx) + '<mark>' + out.slice(idx, idx + t.length) + '</mark>'; i = idx + t.length; }
      out = res + out.slice(i);
    });
    return out;
  }).join('');
}
function blocksHtml(m, t, s, terms){
  const bl = s.b; let html = '';
  bl.forEach((b, i) => {
    const [k, txt, p] = b;
    const nextIsTable = bl[i + 1] && bl[i + 1][0] === 'fig' && /^Tabla/.test(bl[i + 1][1]);
    if (k === 'p') html += nextIsTable ? `<p class="garbled">${hl(esc(txt), terms)}<span class="gnote">La tabla pierde el formato al pasarla a texto: mírala en la página original.</span></p>` : `<p>${hl(esc(txt), terms)}</p>`;
    else if (k === 'li') html += `<p class="li">${hl(esc(txt), terms)}</p>`;
    else if (k === 'li2') html += `<p class="li li2">${hl(esc(txt), terms)}</p>`;
    else if (k === 'code') html += `<pre>${hl(esc(txt.replace(/^• /gm, '')), terms)}</pre>`;
    else if (k === 'fig') html += `<button class="figbtn" data-m="${m}" data-t="${t}" data-p="${p}">Ver ${esc(txt.replace(/\.$/, ''))} · pág. ${p}</button>`;
    else if (k === 'media') html += `<p class="media">${esc(txt)} (audio/vídeo del campus, no incluido)</p>`;
  });
  return html;
}
function panelHtml(st, prefix){
  const { m, t, view, query } = st;
  const tabs = TEMAS_N.filter(n => TEMARIO[m + '-' + n] || ((APC[m] || {})[n])).map(n => `<button data-tema="${n}" aria-pressed="${n === t}">Tema ${n}</button>`).join('');
  const views = [['apuntes','Apuntes'],['resumen','Esquema'],['completo','Original'],['trucos','Trucos']].filter(([v]) => v !== 'completo' || TEMARIO[m + '-' + t]).map(([v, l]) => `<button data-view="${v}" aria-pressed="${view === v}">${l}</button>`).join('');
  const srcView = view === 'trucos' ? 'apuntes' : view;
  let body = '';
  const terms = norm(query || '').split(/\s+/).filter(x => x.length >= 2);
  if (terms.length) {
    const res = [];
    TEMAS_N.forEach(n => secsFor(m, n, srcView).forEach(s => {
      const full = secPlain(srcView, s);
      const nf = norm(full);
      if (terms.every(x => nf.includes(x))) {
        const idx = nf.indexOf(terms[0]);
        const snip = (idx > 60 ? '…' : '') + full.slice(Math.max(0, idx - 60), idx + 110) + '…';
        res.push({ n, s, snip });
      }
    }));
    body = `<p class="muted" style="margin:0;font-size:14px">${res.length ? res.length + (res.length === 1 ? ' apartado contiene “' : ' apartados contienen “') + esc(query) + '”' : 'Nada encontrado para “' + esc(query) + '”. Prueba con otra palabra.'}</p>
      <div class="results">${res.slice(0, 40).map(r => `<button class="res" data-res-t="${r.n}" data-res-s="${esc(r.s.id)}"><span class="rt">Tema ${r.n} · ${esc(r.s.id)} ${esc(r.s.t)}</span><span class="rs">${hl(esc(r.snip), terms)}</span></button>`).join('')}</div>`;
  } else if (view === 'trucos') {
    body = trucosHtml(m, t, prefix);
  } else {
    const secs = secsFor(m, t, view);
    const orig = ((TEMARIO[m + '-' + t]) || {}).secs || [];
    const pgsOf = id => { const o = orig.find(x => x.id === id) || orig.find(x => x.id.startsWith(id + '.')); return o && o.pg && o.pg.length ? `<div class="pgs">Páginas originales: ${o.pg.map(p => `<button class="pgbtn" data-m="${m}" data-t="${t}" data-p="${p}">${p}</button>`).join('')}</div>` : ''; };
    body = `<nav class="toc" aria-label="Apartados">${secs.map(s => `<button data-go="${prefix}-${s.id}">${esc(s.id)} ${esc(s.t)}</button>`).join('')}</nav>
      <div class="notes">${secs.map(s => view === 'apuntes'
        ? `<section class="sec apc" id="${prefix}-${s.id}"><h3><span class="n">${esc(s.id)}</span>${esc(s.t)}</h3><ul>${s.p.map(it => apcItem(it, st.hlTerms)).join('')}</ul>${pgsOf(s.id)}</section>`
        : view === 'resumen'
        ? `<section class="sec" id="${prefix}-${s.id}"><h3><span class="n">${esc(s.id)}</span>${esc(s.t)}</h3><ul>${s.p.map(l => '<li>' + md(l) + '</li>').join('')}</ul></section>`
        : `<section class="sec full" id="${prefix}-${s.id}"><h3><span class="n">${esc(s.id)}</span>${esc(s.t)}</h3>${blocksHtml(m, t, s, st.hlTerms)}${(s.pg || []).length ? `<div class="pgs">Páginas originales: ${s.pg.map(p => `<button class="pgbtn" data-m="${m}" data-t="${t}" data-p="${p}">${p}</button>`).join('')}</div>` : ''}</section>`).join('')}</div>`;
  }
  return `<div class="ptools">
      <div class="row"><div class="seg">${tabs}</div><div class="seg">${views}</div></div>
      <div class="search"><input id="${prefix}-q" type="search" placeholder="Buscar en el temario (ej. casting, bucle, Bastilla)" value="${esc(query || '')}" autocomplete="off" aria-label="Buscar en el temario"></div>
      <p class="tnote">${VIEW_NOTE[view] || ''}</p>
    </div>${body}`;
}
function mountPanel(el, st, prefix, onChange){
  const render = (keepFocus) => {
    el.innerHTML = panelHtml(st, prefix);
    el.querySelectorAll('[data-tema]').forEach(b => b.onclick = () => { st.t = +b.dataset.tema; st.query = ''; st.hlTerms = null; render(); onChange && onChange(st); });
    el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { st.view = b.dataset.view; notesView = st.view; try { localStorage.setItem(VIEW_KEY, st.view); } catch(e){} st.query = ''; render(); onChange && onChange(st); });
    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => goTo(b.dataset.go));
    el.querySelectorAll('[data-trick-ref]').forEach(b => b.onclick = () => {
      st.view = 'apuntes'; render(); onChange && onChange(st);
      const sec = findSec(secsFor(st.m, st.t, 'apuntes'), b.dataset.trickRef); if (sec) goTo(prefix + '-' + sec.id);
    });
    el.querySelectorAll('.figbtn, .pgbtn').forEach(b => b.onclick = () => openPage(b.dataset.m, +b.dataset.t, +b.dataset.p));
    el.querySelectorAll('[data-res-t]').forEach(b => b.onclick = () => {
      st.hlTerms = norm(st.query).split(/\s+/).filter(x => x.length >= 2);
      st.t = +b.dataset.resT; st.view = st.view === 'trucos' ? 'apuntes' : st.view; st.query = ''; render();
      goTo(prefix + '-' + b.dataset.resS);
    });
    const inp = document.getElementById(prefix + '-q');
    let tm;
    inp.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { st.query = inp.value; render(true); }, 250); };
    if (keepFocus) { const i2 = document.getElementById(prefix + '-q'); i2.focus(); i2.setSelectionRange(i2.value.length, i2.value.length); }
  };
  render();
  return render;
}
function goTo(elId){
  const el = document.getElementById(elId); if (!el) return;
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600);
}
function renderNotes(mId, t){
  session = null;
  const m = modById[mId];
  const st = { m: mId, t, view: notesView === 'completo' && !TEMARIO[mId + '-' + t] ? 'apuntes' : notesView, query: '' };
  $app.innerHTML = `
    <div class="qhead"><button class="btn" id="exit">← Inicio</button><div class="grow nt"><strong>Apuntes · ${esc(m.nombre)}</strong></div><button class="btn" id="go-exp">Explícamelo</button><button class="btn solid" id="go-prac">Practicar</button></div>
    <header class="top"><span class="eyebrow" id="n-eyebrow">${m.id} · Tema ${t}</span><h1 id="n-title">${esc(TEMAS[mId][t])}</h1>
    </header>
    <div id="panel" class="panel"></div>`;
  mountPanel(document.getElementById('panel'), st, 'pg', s => {
    document.getElementById('n-eyebrow').textContent = mId + ' · Tema ' + s.t;
    document.getElementById('n-title').textContent = TEMAS[mId][s.t];
  });
  document.getElementById('exit').onclick = renderHome;
  document.getElementById('go-prac').onclick = () => start(shuffle(PREGUNTAS.filter(q => q.m === mId && q.t === st.t)), m.nombre + ' · Tema ' + st.t);
  document.getElementById('go-exp').onclick = () => renderExplain(mId, st.t);
  window.scrollTo(0, 0);
}
function openDrawer(q, hint){
  closeDrawer();
  const m = modById[q.m];
  const st = { m: q.m, t: q.t, view: notesView === 'completo' && !TEMARIO[q.m + '-' + q.t] ? 'apuntes' : notesView, query: '' };
  const wrap = document.createElement('div');
  wrap.id = 'drawer-root';
  wrap.innerHTML = `<div class="backdrop" id="bd"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="Apuntes de ${esc(m.nombre)}">
      <div class="dh"><strong>Apuntes · ${esc(m.nombre)}</strong><button class="btn" id="dclose">Cerrar</button></div>
      <div class="db" id="db">
        <div class="row"><button class="btn solid" id="dhint">Ir al apartado de esta pregunta</button><span class="muted" style="font-size:13px">o busca tú</span></div>
        <div id="dpanel" class="panel"></div>
      </div>
    </aside>`;
  document.body.appendChild(wrap);
  document.body.classList.add('locked');
  const render = mountPanel(document.getElementById('dpanel'), st, 'dw');
  const jump = () => {
    if (st.t !== q.t || st.query) { st.t = q.t; st.query = ''; render(); }
    const sec = findSec(secsFor(q.m, q.t, st.view), refFor(q, st.view));
    if (sec) goTo('dw-' + sec.id);
  };
  document.getElementById('bd').onclick = closeDrawer;
  document.getElementById('dclose').onclick = closeDrawer;
  document.getElementById('dhint').onclick = jump;
  document.getElementById('dclose').focus();
  if (hint) jump();
}
function closeDrawer(){
  const w = document.getElementById('drawer-root');
  if (w) { w.remove(); document.body.classList.remove('locked'); const b = document.getElementById('notes-btn'); if (b) b.focus(); }
}
function openPage(m, t, p){
  closePage();
  const n = (TEMARIO[m + '-' + t] || {}).n || p;
  const v = document.createElement('div');
  v.id = 'pv-root';
  v.innerHTML = `<div class="pv" role="dialog" aria-modal="true" aria-label="Página original">
    <div class="pvh"><button class="btn" id="pv-prev" ${p <= 1 ? 'disabled' : ''} aria-label="Página anterior">←</button>
      <strong style="font-variant-numeric:tabular-nums">${esc(modById[m].nombre)} · Tema ${t} · pág. ${p} / ${n}</strong>
      <button class="btn" id="pv-next" ${p >= n ? 'disabled' : ''} aria-label="Página siguiente">→</button>
      <button class="btn" id="pv-close">Cerrar</button></div>
    <div class="pvb"><img src="p/${m}-${t}-${p}.webp" alt="Página ${p} del PDF del Tema ${t} de ${esc(modById[m].nombre)}"></div></div>`;
  document.body.appendChild(v);
  document.getElementById('pv-close').onclick = closePage;
  document.getElementById('pv-prev').onclick = () => openPage(m, t, p - 1);
  document.getElementById('pv-next').onclick = () => openPage(m, t, p + 1);
  document.getElementById('pv-close').focus();
}
function closePage(){ const v = document.getElementById('pv-root'); if (v) v.remove(); }

// ---------- utilidades ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const now = () => Date.now();
const st = id => progress[id];
const isDue = id => { const s = st(id); return !s || s.due <= now(); };
const isMastered = id => { const s = st(id); return !!s && s.b >= 3; };
const isFailed = id => { const s = st(id); return !!s && s.last === 0; };

// ---------- persistencia ----------
function loadLocal(){ try { const raw = localStorage.getItem(LS_KEY); if (raw) progress = JSON.parse(raw).p || {}; } catch(e){} }
function saveLocal(){ try { localStorage.setItem(LS_KEY, JSON.stringify({ p: progress, updated: now() })); } catch(e){} }
function merge(a, b){ const out = { ...a }; for (const k in b) { if (!out[k] || (b[k].t || 0) > (out[k].t || 0)) out[k] = b[k]; } return out; }
function scheduleSave(){
  saveLocal();
  if (!cloud) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await cloud.set({ p: progress, updated: now() }); setSync('cloud'); }
    catch(e){ setSync('local'); }
  }, 1200);
}
function setSync(s){ cloudState = s; const el = document.getElementById('sync'); if (el) el.innerHTML = syncHtml(); }
function syncHtml(){
  return cloudState === 'cloud'
    ? '<span class="dot on"></span>Progreso guardado en tu cuenta (sincroniza entre PC y Mac)'
    : cloudState === 'syncing' ? '<span class="dot"></span>Conectando…'
    : '<span class="dot"></span>Progreso guardado solo en este navegador';
}
async function initCloud(){
  if (!window.claude || !window.claude.use) return;
  setSync('syncing');
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) { setSync('local'); return; }
    const uid = await user.id();
    if (!uid) { setSync('local'); return; }
    cloud = db.collection('data/users/' + uid).doc('progreso');
    const snap = await cloud.get();
    if (snap.exists) { const d = snap.data(); progress = merge(progress, (d && d.p) || {}); saveLocal(); }
    setSync('cloud');
    if (!session) renderHome();
  } catch(e){ cloud = null; setSync('local'); }
}

function record(id, correct){
  const s = progress[id] || { b: 0, n: 0, ok: 0 };
  const b = correct ? Math.min(s.b + 1, INTERVALS.length - 1) : 0;
  progress[id] = { b, n: s.n + 1, ok: s.ok + (correct ? 1 : 0), t: now(), due: now() + INTERVALS[b] * DAY, last: correct ? 1 : 0 };
  scheduleSave();
}

// ---------- trucos y explícamelo ----------
function trickFor(q){
  const list = ((TRUCOS[q.m] || {})[q.t]) || [];
  const r = String(q.ref).split(/[–-]/)[0].trim();
  return list.find(k => k.ref === r) || list.find(k => r.startsWith(k.ref + '.')) || list.find(k => k.ref.startsWith(r + '.')) || null;
}
function trucosHtml(m, t, prefix){
  const list = ((TRUCOS[m] || {})[t]) || [];
  if (!list.length) return '<p class="muted">Aún no hay trucos para este tema.</p>';
  return `<div class="tricks">${list.map(k => `<article class="trick"><div class="tk-h"><strong>${esc(k.t)}</strong><button class="btn tk-go" data-trick-ref="${esc(k.ref)}">Ver apartado ${esc(k.ref)}</button></div><p>${esc(k.x)}</p></article>`).join('')}</div>`;
}
let samplePromise = null;
function getSample(){
  if (!samplePromise) samplePromise = (window.claude && window.claude.use) ? window.claude.use('sample').catch(() => null) : Promise.resolve(null);
  return samplePromise;
}
function refText(m, t, refs){
  const secs = ((TEMARIO[m + '-' + t]) || {}).secs || [];
  const parts = [];
  if (!secs.length) {
    String(refs).split('+').forEach(r => secsFor(m, t, 'apuntes').filter(s => s.id === r || s.id.startsWith(r + '.')).forEach(s => parts.push(s.id + ' ' + secPlain('apuntes', s))));
    return parts.join('\n\n').slice(0, 9000);
  }
  String(refs).split('+').forEach(r => secs.filter(s => s.id === r || s.id.startsWith(r + '.')).forEach(s => {
    parts.push(s.id + ' ' + s.t + '\n' + s.b.filter(b => b[0] !== 'fig' && b[0] !== 'media').map(b => b[1]).join('\n'));
  }));
  return parts.join('\n\n').slice(0, 9000);
}
const EX_ERR = { not_granted: 'Has rechazado el permiso. Recarga la página si quieres usarlo.', rate_limited: 'Demasiadas peticiones seguidas. Espera un minuto.', cancelled: 'Corrección cancelada.' };
function renderExplain(mId, t){
  session = null;
  mId = mId || MODULOS[0].id; t = t || TEMAS_N[TEMAS_N.length - 1];
  const conceptos = ((CONCEPTOS[mId] || {})[t]) || [];
  $app.innerHTML = `
    <div class="qhead"><button class="btn" id="exit">← Inicio</button><div class="grow"><strong>Explícamelo</strong></div></div>
    <header class="top"><span class="eyebrow">Técnica Feynman</span><h1>Explícalo con tus palabras</h1>
      <p class="muted" style="margin:0">Elige un concepto y explícalo como si se lo contaras a un amigo que no sabe nada. Claude lo compara con tu temario y te dice qué tienes bien, qué te falta y qué está mal. No hace falta escribir bonito.</p></header>
    <section class="ex-pick">
      <div class="seg mods-seg" role="group" aria-label="Módulo">${MODULOS.map(m => `<button data-exm="${m.id}" aria-pressed="${m.id === mId}">${m.id}</button>`).join('')}</div>
      <div class="seg" role="group" aria-label="Tema">${TEMAS_N.map(n => `<button data-ext="${n}" aria-pressed="${n === t}">Tema ${n}</button>`).join('')}</div>
    </section>
    <div class="concepts" role="group" aria-label="Concepto">${conceptos.map((c, i) => `<button class="concept" data-c="${i}">${esc(c[0])}</button>`).join('')}</div>
    <article class="card" id="ex-card" hidden>
      <div class="qmeta"><span class="code ${modById[mId].color}" style="padding:2px 8px">${mId}</span><span>${esc(modById[mId].nombre)} · Tema ${t}</span></div>
      <div class="qtext" id="ex-q"></div>
      <textarea id="ex-txt" class="ex-ta" placeholder="Escribe aquí tu explicación. Usa ejemplos o comparaciones si te ayudan." aria-label="Tu explicación"></textarea>
      <div class="row end"><span class="kbd" id="ex-count">0 palabras</span><button class="btn" id="ex-stop" hidden>Parar</button><button class="btn" id="ex-notes">Ver en el temario</button><button class="btn solid" id="ex-go">Corregir</button></div>
      <div id="ex-out" class="ex-out" hidden></div>
    </article>
    <p class="foot" id="ex-avail">Cada corrección usa un poco de tu plan de Claude. La primera vez te pedirá permiso.</p>`;
  document.getElementById('exit').onclick = renderHome;
  $app.querySelectorAll('[data-exm]').forEach(b => b.onclick = () => renderExplain(b.dataset.exm, t));
  $app.querySelectorAll('[data-ext]').forEach(b => b.onclick = () => renderExplain(mId, +b.dataset.ext));
  let cur = null, ctl = null;
  const txt = document.getElementById('ex-txt');
  txt.oninput = () => { const n = txt.value.trim() ? txt.value.trim().split(/\s+/).length : 0; document.getElementById('ex-count').textContent = n + (n === 1 ? ' palabra' : ' palabras'); };
  $app.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
    $app.querySelectorAll('.concept').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true');
    cur = conceptos[+b.dataset.c];
    document.getElementById('ex-card').hidden = false;
    document.getElementById('ex-q').textContent = '¿Qué es y cómo funciona: ' + cur[0] + '?';
    document.getElementById('ex-out').hidden = true;
    txt.value = ''; txt.oninput(); txt.focus();
  });
  document.getElementById('ex-notes').onclick = () => {
    if (!cur) return;
    const ref = cur[1].split('+')[0];
    openDrawer({ m: mId, t, ref, ap: ref }, true);
  };
  document.getElementById('ex-stop').onclick = () => ctl && ctl.abort();
  document.getElementById('ex-go').onclick = async () => {
    if (!cur) return;
    const out = document.getElementById('ex-out');
    const words = txt.value.trim().split(/\s+/).filter(Boolean).length;
    out.hidden = false;
    if (words < 8) { out.innerHTML = '<p class="muted">Escribe al menos un par de frases (8 palabras o más) para poder corregirte.</p>'; return; }
    const sample = await getSample();
    if (!sample) { out.innerHTML = '<p class="muted">La corrección solo funciona abriendo esta página dentro de Claude (app o claude.ai). Mientras tanto, compara tu explicación con el temario.</p>'; return; }
    const go = document.getElementById('ex-go'), stop = document.getElementById('ex-stop');
    go.disabled = true; stop.hidden = false; ctl = new AbortController();
    out.innerHTML = '<p class="muted">Corrigiendo… puede tardar unos segundos.</p>';
    const prompt = `Eres un profesor corrigiendo la explicación de un alumno que estudia con la técnica Feynman.
Módulo: ${modById[mId].nombre}. Tema ${t}: ${TEMAS[mId][t]}. Concepto: ${cur[0]}.

TEXTO DE REFERENCIA DEL TEMARIO (la única fuente de verdad; el examen es tipo test sobre este texto):
"""
${refText(mId, t, cur[1])}
"""

EXPLICACIÓN DEL ALUMNO:
"""
${txt.value.trim()}
"""

Corrige comparando SOLO con el texto de referencia. Valora que entienda la idea aunque use sus palabras o ejemplos propios; no penalices la redacción ni la ortografía. Responde en español, tuteando, tono cercano y directo.
Devuelve SOLO un objeto JSON con esta forma exacta:
{"nota": <entero de 0 a 10>, "bien": ["lo que ha explicado correctamente"], "falta": ["ideas importantes del temario que no menciona y suelen caer en el test"], "errores": ["afirmaciones incorrectas y cuál es la correcta"], "truco": "una analogía o regla corta para recordar lo que le falta"}
Máximo 4 frases cortas por lista. Listas vacías si no hay nada.`;
    try {
      const r = await sample.json(prompt, { signal: ctl.signal, cache: false });
      const li = a => (Array.isArray(a) && a.length) ? '<ul>' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p class="muted">Nada.</p>';
      const nota = Math.max(0, Math.min(10, Math.round(+r.nota || 0)));
      out.innerHTML = `<div class="ex-score ${nota >= 5 ? 'ok' : 'bad'}"><b>${nota}</b><span>/ 10</span></div>
        <div class="ex-grid"><section><h3 class="ok-t">Lo tienes bien</h3>${li(r.bien)}</section><section><h3 class="warn-t">Te falta</h3>${li(r.falta)}</section><section><h3 class="bad-t">Revisa</h3>${li(r.errores)}</section></div>
        ${r.truco ? `<p class="ex-trick"><strong>Truco:</strong> ${esc(r.truco)}</p>` : ''}
        <p class="muted" style="font-size:13px;margin:0">Vuelve a explicarlo dentro de un rato sin mirar. Si sube la nota, es que lo has aprendido.</p>`;
    } catch (e) {
      out.innerHTML = `<p class="muted">${esc(EX_ERR[e && e.code] || 'No se ha podido corregir ahora. Inténtalo de nuevo en un momento.')}</p>`;
    } finally { go.disabled = false; stop.hidden = true; }
  };
  window.scrollTo(0, 0);
}

// ---------- inicio ----------
function renderHome(){
  session = null;
  const POOL = temaSel === 'all' ? PREGUNTAS : PREGUNTAS.filter(q => String(q.t) === temaSel);
  const total = POOL.length;
  const mastered = POOL.filter(q => isMastered(q.id)).length;
  const due = POOL.filter(q => isDue(q.id)).length;
  const failed = POOL.filter(q => isFailed(q.id)).length;
  const temaLabel = temaSel === 'all' ? 'Temas ' + TEMAS_N[0] + '–' + TEMAS_N[TEMAS_N.length - 1] : 'Tema ' + temaSel;

  const mods = MODULOS.map(m => {
    const qs = POOL.filter(q => q.m === m.id);
    const nM = qs.filter(q => isMastered(q.id)).length;
    const nF = qs.filter(q => isFailed(q.id)).length;
    const nL = qs.filter(q => st(q.id) && !isMastered(q.id) && !isFailed(q.id)).length;
    const pct = n => (qs.length ? n / qs.length * 100 : 0).toFixed(1) + '%';
    const sub = temaSel === 'all' ? `${temaLabel} · ${qs.length} preguntas` : `Tema ${temaSel} · ${esc(TEMAS[m.id][temaSel])} · ${qs.length} preguntas`;
    return `<div class="mod">
      <span class="code ${m.color}">${m.id}</span>
      <div class="info">
        <div><div class="name">${esc(m.nombre)}</div><div class="sub">${sub}</div></div>
        <div class="bar" role="img" aria-label="${nM} dominadas, ${nL} aprendiendo, ${nF} falladas de ${qs.length}"><i class="b-m" style="width:${pct(nM)}"></i><i class="b-l" style="width:${pct(nL)}"></i><i class="b-f" style="width:${pct(nF)}"></i></div>
      </div>
      <div class="btns"><button class="btn" data-notes="${m.id}">Apuntes</button><button class="btn" data-mod="${m.id}">Practicar</button></div>
    </div>`;
  }).join('');

  $app.innerHTML = `
    <header class="top">
      <span class="eyebrow">${esc(APP.eyebrow)}</span>
      <h1>${esc(APP.titulo)}</h1>
      <p class="muted" style="margin:0">${esc(APP.intro)} Lo que fallas vuelve antes; lo que aciertas se espacia (1, 3, 7 y 16 días).</p>
      <div class="sync" id="sync">${syncHtml()}</div>
    </header>

    <section class="mode" aria-label="Qué temas estudiar">
      <div class="seg" role="group">
        <button data-tsel="all" aria-pressed="${temaSel === 'all'}">Todos</button>
        ${TEMAS_N.map(n => `<button data-tsel="${n}" aria-pressed="${temaSel === String(n)}">Tema ${n}</button>`).join('')}
      </div>
    </section>

    <section class="stats" aria-label="Resumen">
      <div class="stat"><b>${total}</b><span>preguntas</span></div>
      <div class="stat"><b>${mastered}</b><span>dominadas</span></div>
      <div class="stat"><b>${due}</b><span>para hoy</span></div>
    </section>

    <section class="mode" aria-label="Modo de estudio">
      <div class="seg" role="group">
        <button id="m-prac" aria-pressed="${mode === 'practica'}">Práctica con apuntes</button>
        <button id="m-exam" aria-pressed="${mode === 'examen'}">Examen</button>
      </div>
      <p>${mode === 'practica'
        ? 'Puedes abrir los apuntes en cada pregunta y buscar la respuesta. Así aprendes leyendo. Estas respuestas no cuentan para el repaso espaciado.'
        : 'Sin apuntes, como en el examen real. Tus aciertos y fallos deciden cuándo vuelve cada pregunta.'}</p>
    </section>

    <section class="actions">
      <button class="act primary" id="a-due" ${due ? '' : 'disabled'}><strong>Repaso de hoy</strong><small>${due ? Math.min(due, 20) + ' preguntas pendientes' : 'Todo al día'}</small></button>
      <button class="act" id="a-exam"><strong>Simulacro mixto</strong><small>20 preguntas · ${temaLabel.toLowerCase()}</small></button>
      <button class="act" id="a-fail" ${failed ? '' : 'disabled'}><strong>Mis fallos</strong><small>${failed ? failed + ' por corregir' : 'Sin fallos pendientes'}</small></button>
      <button class="act" id="a-expl"><strong>Explícamelo</strong><small>Explica un concepto y Claude te corrige</small></button>
    </section>

    <section style="display:flex;flex-direction:column;gap:10px">
      <div class="row" style="justify-content:space-between">
        <h2>Módulos</h2>
        <div class="legend"><span><i style="background:var(--ok)"></i>Dominadas</span><span><i style="background:var(--accent);opacity:.55"></i>Aprendiendo</span><span><i style="background:var(--bad)"></i>Falladas</span></div>
      </div>
      <div class="mods">${mods}</div>
    </section>

    <p class="foot">${esc(APP.pie)} Cada respuesta indica el apartado del tema. Atajos: teclas 1–4 para responder, Intro para seguir.</p>
    <div class="row"><button class="btn" id="a-reset">Borrar mi progreso</button><span id="reset-confirm"></span></div>
  `;

  $app.querySelectorAll('[data-tsel]').forEach(b => b.onclick = () => { temaSel = b.dataset.tsel; try { localStorage.setItem(TEMA_KEY, temaSel); } catch(e){} renderHome(); });
  const setMode = v => { mode = v; try { localStorage.setItem(MODE_KEY, v); } catch(e){} renderHome(); };
  document.getElementById('m-prac').onclick = () => setMode('practica');
  document.getElementById('m-exam').onclick = () => setMode('examen');
  $app.querySelectorAll('[data-notes]').forEach(b => b.onclick = () => renderNotes(b.dataset.notes, temaSel === 'all' ? TEMAS_N[TEMAS_N.length - 1] : +temaSel));
  $app.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => start(shuffle(POOL.filter(q => q.m === b.dataset.mod)), modById[b.dataset.mod].nombre + ' · ' + temaLabel));
  document.getElementById('a-due').onclick = () => {
    const pool = POOL.filter(q => isDue(q.id));
    const failedFirst = shuffle(pool.filter(q => st(q.id))).sort((a,b) => st(a.id).b - st(b.id).b);
    const fresh = shuffle(pool.filter(q => !st(q.id)));
    start([...failedFirst, ...fresh].slice(0, 20), 'Repaso de hoy');
  };
  document.getElementById('a-exam').onclick = () => start(shuffle(POOL).slice(0, 20), 'Simulacro mixto');
  document.getElementById('a-fail').onclick = () => start(shuffle(POOL.filter(q => isFailed(q.id))), 'Mis fallos');
  document.getElementById('a-expl').onclick = () => renderExplain(null, temaSel === 'all' ? null : +temaSel);
  document.getElementById('a-reset').onclick = () => {
    const c = document.getElementById('reset-confirm');
    c.innerHTML = '<span class="muted">¿Seguro?</span> <button class="btn" id="a-reset-yes">Sí, borrar</button>';
    document.getElementById('a-reset-yes').onclick = () => { progress = {}; scheduleSave(); renderHome(); };
  };
}

// ---------- sesión ----------
function start(list, title){
  if (!list.length) return;
  session = { list, title, i: 0, answered: false, results: [], practice: mode === 'practica' };
  renderQ();
  window.scrollTo(0, 0);
}

function finishQ(correct, extra){
  const q = session.list[session.i];
  session.answered = true;
  session.results.push({ id: q.id, correct });
  if (!session.practice) record(q.id, correct);
  const fb = document.getElementById('fb');
  fb.className = 'feedback ' + (correct ? 'ok' : 'bad');
  fb.hidden = false;
  fb.innerHTML = `<span class="verdict">${correct ? 'Correcto' : 'Incorrecto'}</span>${extra || ''}<span>${esc(q.exp)}</span><div class="row"><span class="muted" style="font-size:13px">Repasa: ${esc(modById[q.m].nombre)} · Tema ${q.t} · apartado ${esc(q.ref)}</span><button class="btn" id="see-notes" style="font-size:13px;padding:4px 10px">Ver en los apuntes</button></div>`;
  const tk = trickFor(q);
  if (tk) fb.insertAdjacentHTML('beforeend', `<p class="fb-trick"><strong>Truco · ${esc(tk.t)}:</strong> ${esc(tk.x)}</p>`);
  document.getElementById('see-notes').onclick = () => openDrawer(q, true);
  const nx = document.getElementById('next');
  nx.hidden = false; nx.focus();
}

function next(){
  session.i++; session.answered = false;
  if (session.i >= session.list.length) renderResults(); else { renderQ(); window.scrollTo(0, 0); }
}

function renderQ(){
  const q = session.list[session.i];
  const m = modById[q.m];
  const n = session.list.length;
  const typeLabel = { mc:'Test', order:'Ordenar', num:'Respuesta numérica', xml:'Ejercicio XML' }[q.type];
  let body = '';
  if (q.type === 'mc') {
    const order = shuffle(q.opts.map((o, i) => i));
    session.order = order;
    body = `<div class="opts">${order.map((oi, k) => `<button class="opt" data-k="${k}"><span class="k">${k + 1}</span><span class="o">${q.codeOpts ? '<code>' + esc(q.opts[oi]) + '</code>' : esc(q.opts[oi])}</span></button>`).join('')}</div>`;
  } else if (q.type === 'order') {
    let arr = shuffle(q.items.map((_, i) => i));
    if (arr.every((v, i) => v === i)) arr = arr.reverse();
    session.arr = arr;
    body = `<ol class="olist" id="olist"></ol><div class="row end"><button class="btn solid" id="check">Comprobar</button></div>`;
  } else if (q.type === 'num') {
    body = `<form class="numin" id="numf"><input id="numv" inputmode="numeric" autocomplete="off" aria-label="Tu respuesta" placeholder="Tu respuesta"> ${q.unit ? '<span class="muted">' + esc(q.unit) + '</span>' : ''}<button class="btn solid" type="submit">Comprobar</button></form>`;
  } else if (q.type === 'xml') {
    body = `<ul class="reqs" id="reqs">${q.reqs.map((r, i) => `<li data-r="${i}"><span class="s">○</span><span>${esc(r.txt)}</span></li>`).join('')}</ul>
      <textarea id="xmlv" spellcheck="false" aria-label="Tu XML">${esc(q.starter)}</textarea>
      <div class="perr" id="perr"></div>
      <div class="row end"><button class="btn" id="giveup">Ver solución</button><button class="btn solid" id="check">Validar</button></div>`;
  }

  $app.innerHTML = `
    <div class="qhead">
      <button class="btn" id="exit" aria-label="Salir al inicio">← Salir</button>
      <div class="grow"><div class="row" style="justify-content:space-between"><strong>${esc(session.title)}</strong><span class="muted" style="font-variant-numeric:tabular-nums">${session.i + 1} / ${n}</span></div>
      <div class="prog"><i style="width:${(session.i / n * 100).toFixed(1)}%"></i></div></div>
    </div>
    <article class="card">
      <div class="row" style="justify-content:space-between">
        <div class="qmeta"><span class="code ${m.color}" style="padding:2px 8px">${m.id}</span><span>${esc(m.nombre)} · Tema ${q.t}</span><span>· ${typeLabel}</span></div>
        ${session.practice ? '<button class="btn" id="notes-btn">Consultar apuntes</button>' : ''}
      </div>
      <div class="qtext">${esc(q.q)}</div>
      ${q.code ? '<pre>' + esc(q.code) + '</pre>' : ''}
      ${body}
      <div id="fb" class="feedback" hidden></div>
      <div class="row end"><span class="kbd" id="hint">${q.type === 'mc' ? 'Teclas 1–' + q.opts.length : ''}</span><button class="btn solid" id="next" hidden>${session.i + 1 < n ? 'Siguiente →' : 'Ver resultado'}</button></div>
    </article>`;

  document.getElementById('exit').onclick = renderHome;
  document.getElementById('next').onclick = next;
  const nb = document.getElementById('notes-btn');
  if (nb) nb.onclick = () => openDrawer(q, false);

  if (q.type === 'mc') {
    $app.querySelectorAll('.opt').forEach(b => b.onclick = () => answerMC(+b.dataset.k));
  } else if (q.type === 'order') {
    drawOrder(false);
    document.getElementById('check').onclick = checkOrder;
  } else if (q.type === 'num') {
    const inp = document.getElementById('numv'); inp.focus();
    document.getElementById('numf').onsubmit = e => {
      e.preventDefault();
      if (session.answered) return;
      const v = parseFloat(inp.value.replace(/\./g, '').replace(',', '.'));
      if (isNaN(v)) { inp.focus(); return; }
      inp.disabled = true;
      e.target.querySelector('button').disabled = true;
      const ok = v === q.answer;
      finishQ(ok, ok ? '' : `<span>Respuesta correcta: <b>${q.answer.toLocaleString('es-ES')}${q.unit ? ' ' + esc(q.unit) : ''}</b></span>`);
    };
  } else if (q.type === 'xml') {
    const ta = document.getElementById('xmlv');
    ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } });
    document.getElementById('check').onclick = () => {
      if (session.answered) return;
      const pass = checkXML(q, ta.value);
      if (pass) { ta.readOnly = true; document.getElementById('check').disabled = true; document.getElementById('giveup').disabled = true; finishQ(!session.gaveUp); }
    };
    session.gaveUp = false;
    document.getElementById('giveup').onclick = () => {
      if (session.answered) return;
      session.gaveUp = true;
      ta.value = q.solution; checkXML(q, ta.value);
      ta.readOnly = true; document.getElementById('check').disabled = true; document.getElementById('giveup').disabled = true;
      finishQ(false, '<span>Esta es una solución válida. Estúdiala y la volverás a ver pronto.</span>');
    };
  }
}

function answerMC(k){
  if (session.answered) return;
  const q = session.list[session.i];
  const chosen = session.order[k];
  const correct = chosen === q.a;
  $app.querySelectorAll('.opt').forEach(b => {
    const oi = session.order[+b.dataset.k];
    b.disabled = true;
    if (oi === q.a) b.classList.add('ok');
    else if (+b.dataset.k === k) b.classList.add('bad');
  });
  document.getElementById('hint').textContent = 'Intro para seguir';
  finishQ(correct);
}

function drawOrder(done){
  const q = session.list[session.i];
  const ol = document.getElementById('olist');
  ol.innerHTML = session.arr.map((it, pos) => `<li class="oitem ${done ? (it === pos ? 'ok' : 'bad') : ''}">
      <span class="n">${pos + 1}</span><span class="t">${esc(q.items[it])}</span>
      <span class="mv">${done ? '' : `<button data-up="${pos}" ${pos === 0 ? 'disabled' : ''} aria-label="Subir">▲</button><button data-dn="${pos}" ${pos === session.arr.length - 1 ? 'disabled' : ''} aria-label="Bajar">▼</button>`}</span></li>`).join('');
  if (done) return;
  ol.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const p = +b.dataset.up; [session.arr[p - 1], session.arr[p]] = [session.arr[p], session.arr[p - 1]]; drawOrder(false); ol.querySelector(`[data-up="${p - 1}"]`)?.focus(); });
  ol.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => { const p = +b.dataset.dn; [session.arr[p + 1], session.arr[p]] = [session.arr[p], session.arr[p + 1]]; drawOrder(false); ol.querySelector(`[data-dn="${p + 1}"]`)?.focus(); });
}
function checkOrder(){
  if (session.answered) return;
  const q = session.list[session.i];
  const ok = session.arr.every((v, i) => v === i);
  drawOrder(true);
  document.getElementById('check').disabled = true;
  finishQ(ok, ok ? '' : `<span>Orden correcto: <b>${q.items.map(esc).join(' → ')}</b></span>`);
}

// ---------- validación XML ----------
function checkXML(q, src){
  const text = src.trim();
  const perr = document.getElementById('perr');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const pe = doc.getElementsByTagName('parsererror')[0];
  const wellformed = !pe;
  perr.textContent = pe ? 'El analizador dice: ' + (pe.textContent || '').replace(/\s+/g, ' ').replace(/Below is a rendering.*$/i, '').trim().slice(0, 300) : '';
  const root = wellformed ? doc.documentElement : null;
  const els = name => root ? Array.from(root.getElementsByTagName(name)) : [];
  const results = q.reqs.map(r => {
    const [kind, ...rest] = r.chk.split(':');
    if (!wellformed) return kind === 'prolog' ? /^<\?xml\s+version=/.test(text) : false;
    switch (kind) {
      case 'prolog': return /^<\?xml\s+version=["']1\.0["']/.test(text);
      case 'wellformed': return true;
      case 'root': { const [name, attr] = rest[0].split('@'); return root.nodeName === name && (!attr || root.hasAttribute(attr)); }
      case 'count': return els(rest[0]).length >= +rest[1];
      case 'countattr': { const e = els(rest[0]); return e.length >= +rest[1] && e.every(x => x.hasAttribute(rest[2])); }
      case 'children': { const e = els(rest[0]); const need = rest[1].split(','); return e.length > 0 && e.every(x => need.every(c => Array.from(x.children).some(ch => ch.nodeName === c && ch.textContent.trim()))); }
      case 'rootchildren': return rest[0].split(',').every(c => Array.from(root.children).some(ch => ch.nodeName === c));
      case 'ns': return rest[0].split(',').every(p => root.lookupNamespaceURI(p));
      case 'prefixed': { const pairs = rest.join(':').split(','); return pairs.every(pn => root.getElementsByTagName(pn).length > 0); }
    }
    return false;
  });
  document.querySelectorAll('#reqs li').forEach((li, i) => { li.className = results[i] ? 'ok' : 'bad'; li.querySelector('.s').textContent = results[i] ? '✓' : '✗'; });
  return wellformed && results.every(Boolean);
}

// ---------- resultados ----------
function renderResults(){
  const r = session.results;
  const ok = r.filter(x => x.correct).length;
  const nota = (ok / r.length * 10);
  const fails = r.filter(x => !x.correct).map(x => byId[x.id]);
  const ansText = q => q.type === 'mc' ? q.opts[q.a] : q.type === 'order' ? q.items.join(' → ') : q.type === 'num' ? q.answer + (q.unit ? ' ' + q.unit : '') : 'Revisa la solución del ejercicio';
  $app.innerHTML = `
    <header class="top"><span class="eyebrow">${esc(session.title)} · resultado</span></header>
    <article class="card">
      <div class="score"><b>${nota.toLocaleString('es-ES', { maximumFractionDigits: 1 })}</b><span class="muted">sobre 10 · ${ok} de ${r.length} correctas</span></div>
      ${session.practice ? '<p style="margin:0"><span class="tag">Práctica con apuntes</span> Esta nota no cuenta para el repaso espaciado. Cuando te veas seguro, cambia a modo Examen.</p>' : ''}
      <p style="margin:0">${session.practice ? (fails.length ? 'Repasa abajo las que se te escaparon.' : 'Todas bien.') : nota >= 5 ? 'Aprobado. Las que has acertado no volverán hasta dentro de unos días.' : 'Todavía no. Las falladas vuelven en tu próximo repaso: repítelas ahora mientras están frescas.'}</p>
      ${fails.length ? `<h2>Para repasar</h2><ul class="fails">${fails.map(q => `<li><div>${esc(q.q)}</div><div class="ans">${esc(ansText(q))}</div><div class="muted" style="font-size:13px">${esc(modById[q.m].nombre)} · apartado ${esc(q.ref)}</div></li>`).join('')}</ul>` : ''}
      <div class="row end">
        <button class="btn" id="home">Inicio</button>
        ${fails.length ? '<button class="btn solid" id="retry">Repetir falladas</button>' : ''}
      </div>
    </article>`;
  document.getElementById('home').onclick = renderHome;
  const rt = document.getElementById('retry');
  if (rt) rt.onclick = () => start(shuffle(fails), 'Repetir falladas');
  window.scrollTo(0, 0);
}

// ---------- teclado ----------
document.addEventListener('keydown', e => {
  if (document.getElementById('pv-root')) { if (e.key === 'Escape') closePage(); return; }
  if (document.getElementById('drawer-root')) { if (e.key === 'Escape') closeDrawer(); return; }
  if (!session) return;
  const tag = (e.target.tagName || '').toLowerCase();
  const q = session.list[session.i];
  if (e.key === 'Enter' && session.answered && tag !== 'textarea') { e.preventDefault(); next(); return; }
  if (q && q.type === 'mc' && !session.answered && /^[1-9]$/.test(e.key) && tag !== 'input' && tag !== 'textarea') {
    const k = +e.key - 1; if (k < q.opts.length) answerMC(k);
  }
});

loadLocal();
renderHome();
initCloud();
})();
