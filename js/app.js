/* Interfaz del workspace: emulador, áreas de trabajo y paneles. */
(function () {
  'use strict';
  const E = window.SabreEngine;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const screen = $('#screen');
  const input = $('#cmd');
  const AREAS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const buffers = {};
  const history = [];
  let hIdx = -1;
  let current = 'A';

  const pref = {
    get(k, d) { try { return localStorage.getItem('sabre-edu-' + k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sabre-edu-' + k, v); } catch (e) { /* sin almacenamiento */ } },
  };

  // ------------------------------------------------------------- fechas de ejemplo
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function fdate(add) {
    const d = new Date(); d.setDate(d.getDate() + add);
    return String(d.getDate()).padStart(2, '0') + MON[d.getMonth()];
  }
  function fill(t) {
    return t.replace(/\{FECHA(\d*)\}/g, (_, n) => fdate(30 + (+n || 0)));
  }

  // ------------------------------------------------------------- pantalla
  const ERR = /^(FORMAT|NEED |INVALID|NO |UNABLE|CHECK |VERIFY|SIGN IN A|NOT |CANNOT|FLIGHT .* DOES NOT|END OR IGNORE|FINISH|PNR MUST|ALL SEGMENTS|CREDIT CARD|SYSTEM ERROR|ROW NOT|SEAT .* NOT AVAILABLE|TICKET NOT|VOID NOT|.*NOT FOUND|NUMBER IN PARTY|¿)/;
  function esc(s) { return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  function lineHTML(text, cls) {
    let extra = '';
    const m = /^\s?(\d{1,2})([A-Z0-9]{2})\s{1,4}\d{1,4} [A-Z]\d /.exec(text);
    if (m && !cls) { cls = 'clk'; extra = ` data-sell="${+m[1]}"`; }
    return `<div class="ln${cls ? ' ' + cls : ''}"${extra}>${esc(text) || '&nbsp;'}</div>`;
  }
  function print(lines, cmd) {
    const buf = buffers[current];
    if (cmd != null) buf.push(lineHTML('>' + cmd, 'cmd'));
    lines.forEach((l, i) => {
      let cls = '';
      if (ERR.test(l)) cls = 'err';
      else if (i === 0 && /^OK /.test(l)) cls = 'ok';
      else if (/^(TASAS FICTICIAS|USE SI\*|.*PARA (RESERVAR|SELECCIONAR|DETALLE)|HOD\{|RD\{|0C\{)/.test(l)) cls = 'tip';
      buf.push(lineHTML(l, cls));
    });
    if (buf.length > 3000) buf.splice(0, buf.length - 3000);
    screen.innerHTML = buf.join('');
    screen.scrollTop = screen.scrollHeight;
  }
  function welcome() {
    return [
      '*** SIMULADOR SABRE - ENTORNO DE ENTRENAMIENTO ***',
      '',
      'BIENVENIDO. ESTE ES UN ENTORNO EDUCATIVO; LOS DATOS SON FICTICIOS.',
      'PARA COMENZAR INICIE SESION:  SI*1234',
      'ESCRIBA HELP PARA VER LOS TEMAS DE AYUDA.',
      'TECLAS:  \\ = ‡   [ = ¤   ] = §    ↑/↓ HISTORIAL   ESC LIMPIA',
      '',
    ];
  }

  function run(raw) {
    raw = raw.trim();
    if (!raw) return;
    history.unshift(raw);
    if (history.length > 200) history.pop();
    hIdx = -1;
    const r = E.exec(raw);
    if (r.clear) { buffers[current] = []; screen.innerHTML = ''; refresh(); return; }
    if (r.scroll) {
      const h = screen.clientHeight;
      if (r.scroll === 'MD') screen.scrollTop += h * 0.9;
      if (r.scroll === 'MU') screen.scrollTop -= h * 0.9;
      if (r.scroll === 'MT') screen.scrollTop = 0;
      if (r.scroll === 'MB') screen.scrollTop = screen.scrollHeight;
      return;
    }
    print(r.lines, r.input);
    refresh();
  }

  function setArea(a) {
    current = a;
    E.setArea(a);
    if (!buffers[a]) { buffers[a] = []; print(welcome().filter((_, i) => i < 1).concat([`AREA DE TRABAJO ${a}`, ''])); }
    screen.innerHTML = buffers[a].join('');
    screen.scrollTop = screen.scrollHeight;
    $$('.areas button').forEach((b) => b.classList.toggle('on', b.dataset.area === a));
    $('#areaLbl').textContent = a;
    refresh();
    input.focus();
  }

  // ------------------------------------------------------------- entrada
  function insertAtCursor(t) {
    const s = input.selectionStart, e = input.selectionEnd;
    input.value = input.value.slice(0, s) + t + input.value.slice(e);
    input.selectionStart = input.selectionEnd = s + t.length;
    input.focus();
  }
  input.addEventListener('keydown', (ev) => {
    const map = { '\\': '‡', '[': '¤', ']': '§' };
    if (map[ev.key] && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); insertAtCursor(map[ev.key]); return; }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx]; } return; }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); if (hIdx > 0) { hIdx--; input.value = history[hIdx]; } else { hIdx = -1; input.value = ''; } return; }
    if (ev.key === 'Escape') { ev.preventDefault(); buffers[current] = []; screen.innerHTML = ''; return; }
    if (ev.key === 'PageDown') { ev.preventDefault(); screen.scrollTop += screen.clientHeight * 0.9; }
    if (ev.key === 'PageUp') { ev.preventDefault(); screen.scrollTop -= screen.clientHeight * 0.9; }
  });
  input.addEventListener('input', () => {
    const p = input.selectionStart;
    input.value = input.value.toUpperCase();
    input.setSelectionRange(p, p);
  });
  $('#cmdForm').addEventListener('submit', (ev) => { ev.preventDefault(); const v = input.value; input.value = ''; run(v); });
  $$('.keys [data-key]').forEach((b) => b.addEventListener('click', () => insertAtCursor(b.dataset.key)));
  document.addEventListener('keydown', (ev) => {
    if (ev.altKey && /^[1-6]$/.test(ev.key)) { ev.preventDefault(); setArea(AREAS[+ev.key - 1]); }
  });
  screen.addEventListener('click', (ev) => {
    const ln = ev.target.closest('[data-sell]');
    if (ln && !window.getSelection().toString()) { input.value = `01Y${ln.dataset.sell}`; input.focus(); }
  });

  function useCmd(cmd, exec) {
    const c = fill(cmd);
    if (exec) run(c);
    else { input.value = c; input.focus(); input.setSelectionRange(c.length, c.length); }
  }

  // ------------------------------------------------------------- paneles
  function pnrPanel(s) {
    const el = $('#tab-pnr');
    if (!s.signedIn) { el.innerHTML = '<div class="empty"><b>Sin sesión.</b><br>Inicia sesión con <code>SI*1234</code> para comenzar.</div>'; return; }
    const p = s.pnr;
    if (!p) { el.innerHTML = `<div class="empty"><b>No hay PNR en el área ${s.area}.</b><br>Vende un segmento, agrega un nombre o recupera un registro con <code>*LOCALIZADOR</code>.</div>`; return; }
    const pend = p._pend && p._pend.length;
    const state = !p.locator ? '<span class="pill new">NUEVO</span>' : pend ? '<span class="pill mod">CON CAMBIOS</span>' : '<span class="pill saved">GUARDADO</span>';
    const req = [['Nombre', p.names.length], ['Itin.', p.segs.length], ['Tel.', p.phones.length], ['Ticket', p.tkt || p.tickets.length], ['Recib.', p.received]];
    const h = [];
    h.push(`<div class="pnr-head"><span class="loc">${p.locator || '——————'}</span>${state}</div>`);
    h.push('<div class="req" title="Campos obligatorios para finalizar">' + req.map(([k, v]) => `<span class="${v ? 'done' : ''}">${v ? '✓ ' : ''}${k}</span>`).join('') + '</div>');
    if (s.queue) h.push(`<p class="muted">Trabajando cola ${s.queue.q} — ítem ${s.queue.pos + 1}</p>`);
    h.push('<h3>Pasajeros</h3>');
    h.push(p.names.length ? '<div class="pax">' + p.names.map((n, i) => `<span>${esc(n.last)}/${esc(n.first)}${n.title ? ' ' + n.title : ''} <small>${n.ptc}</small></span>`).join('') + '</div>' : '<p class="muted">Sin nombres</p>');
    h.push('<h3>Itinerario</h3>');
    if (!p.segs.length) h.push('<p class="muted">Sin segmentos</p>');
    p.segs.forEach((g, i) => {
      if (g.type === 'AIR') {
        h.push(`<div class="seg"><div class="r1"><span>${i + 1}. ${g.carrier} ${g.flight} · ${g.cls}</span><span class="st ${g.status}">${g.status}${g.qty}</span></div>
          <div class="route">${g.orig} → ${g.dest}</div>
          <div class="r2"><span>${E.ddmmm(g.date)} · ${E.fmtTime(g.dep)} – ${E.fmtTime(g.arr)}${g.dayOff ? ' (+' + g.dayOff + ')' : ''}</span><span>${g.equip || ''}</span></div></div>`);
      } else if (g.type === 'HTL') {
        h.push(`<div class="seg htl"><div class="r1"><span>${i + 1}. HOTEL ${g.chain}</span><span class="st ${g.status}">${g.status}${g.qty}</span></div><div>${esc(g.name)}</div><div class="r2"><span>${E.ddmmm(g.date)} – ${E.ddmmm(g.out)} · ${g.nights} noches</span><span>USD ${g.rate.toFixed(2)}</span></div></div>`);
      } else if (g.type === 'CAR') {
        h.push(`<div class="seg car"><div class="r1"><span>${i + 1}. AUTO ${g.vendor} ${g.car}</span><span class="st ${g.status}">${g.status}${g.qty}</span></div><div class="r2"><span>${g.city} ${E.ddmmm(g.date)} – ${E.ddmmm(g.out)}</span><span>USD ${g.rate.toFixed(2)}/día</span></div></div>`);
      } else if (g.type === 'OTH') {
        h.push(`<div class="seg"><div class="r1"><span>${i + 1}. OTH ${g.carrier}</span><span class="st">${g.status}</span></div><div class="r2"><span>${esc(g.text)}</span></div></div>`);
      } else h.push(`<div class="seg"><div class="r1"><span>${i + 1}. ARNK</span></div><div class="r2"><span>Tramo de superficie</span></div></div>`);
    });
    const kv = [];
    if (p.phones.length) kv.push(['Teléfonos', p.phones.join('<br>')]);
    if (p.emails.length) kv.push(['Email', p.emails.map(esc).join('<br>')]);
    if (p.tkt) kv.push(['Ticketing', p.tkt]);
    if (p.fop) kv.push(['F. de pago', p.fop]);
    if (p.received) kv.push(['Recibido', esc(p.received)]);
    if (p.remarks.length) kv.push(['Observ.', p.remarks.map(esc).join('<br>')]);
    if (p.ssr.length || p.osi.length) kv.push(['SSR/OSI', p.osi.map((x) => 'OSI ' + esc(x)).concat(p.ssr.map((x) => `${x.code} ${x.carrier} ${x.status}`)).join('<br>')]);
    if (p.seats.length) kv.push(['Asientos', p.seats.map((x) => `${x.flt} ${x.seat} ${esc(x.name)}`).join('<br>')]);
    if (p.ff.length) kv.push(['V. frecuente', p.ff.join('<br>')]);
    if (p.pq.length) kv.push(['Price quote', p.pq.map((q) => `PQ${q.n} USD ${q.total.toFixed(2)} ${q.status}`).join('<br>')]);
    if (p.tickets.length) kv.push(['Boletos', p.tickets.map((t) => `${t.num} ${esc(t.name)} ${t.status}`).join('<br>')]);
    if (kv.length) h.push('<h3>Datos</h3><dl class="kv">' + kv.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('') + '</dl>');
    if (pend) h.push(`<h3>Cambios pendientes</h3><p class="muted">${p._pend.length} cambio(s) sin finalizar. Usa <code>6NOMBRE</code> y <code>E</code> / <code>ER</code>, o <code>I</code> para ignorar.</p>`);
    el.innerHTML = h.join('');
  }

  function guidePanel() {
    const el = $('#tab-guide');
    el.innerHTML = '<p class="muted">Ejercicios paso a paso. Haz clic en un comando para colocarlo en la línea de entrada y presiona Enter.</p>' +
      window.SABLESSONS.map((l, i) => `<details class="lesson"${i === 0 ? ' open' : ''}><summary>${l.title}</summary><p>${l.text}</p><ol>${l.steps.map(([c, d]) => `<li><span class="chip" data-cmd="${esc(c)}">${esc(fill(c))}</span><small>${d}</small></li>`).join('')}</ol></details>`).join('');
  }

  function refPanel() {
    const el = $('#tab-ref');
    const groups = window.SABREF.map(([g, rows]) => `<div class="ref-grp" data-grp><h3>${g}</h3>${rows.map(([c, d]) => `<div class="ref-row" data-txt="${esc((c + ' ' + d).toLowerCase())}"><span class="chip" data-cmd="${esc(c)}">${esc(c)}</span><span>${d}</span></div>`).join('')}</div>`).join('');
    el.innerHTML = '<input class="ref-search" type="search" placeholder="Buscar comando o función…" aria-label="Buscar comando">' + groups;
    el.querySelector('.ref-search').addEventListener('input', (ev) => {
      const q = ev.target.value.toLowerCase();
      el.querySelectorAll('.ref-row').forEach((r) => (r.style.display = r.dataset.txt.includes(q) ? '' : 'none'));
      el.querySelectorAll('[data-grp]').forEach((g) => (g.style.display = g.querySelector('.ref-row:not([style*="none"])') ? '' : 'none'));
    });
  }

  function bookPanel() {
    const el = $('#tab-book');
    const d = new Date(); d.setDate(d.getDate() + 30);
    const dv = d.toISOString().slice(0, 10);
    el.innerHTML = `
      <p class="muted">Formularios gráficos que generan el comando equivalente en formato Sabre — así aprendes la sintaxis mientras reservas.</p>
      <h3>Buscar vuelos</h3>
      <form class="form" id="fAvail">
        <div class="row"><label>Origen<input name="o" maxlength="3" value="MIA" required></label><label>Destino<input name="d" maxlength="3" value="MAD" required></label></div>
        <div class="row"><label>Fecha<input name="date" type="date" value="${dv}" required></label><label>Hora (opcional)<input name="t" placeholder="9A"></label></div>
        <label>Aerolínea (opcional)<input name="c" maxlength="2" placeholder="IB"></label>
        <div class="hint" id="hAvail"></div>
        <button class="primary">Consultar disponibilidad</button>
      </form>
      <h3>Datos del pasajero</h3>
      <form class="form" id="fPax">
        <div class="row"><label>Apellido<input name="l" required placeholder="PEREZ"></label><label>Nombre<input name="f" required placeholder="JUAN"></label></div>
        <div class="row"><label>Título<select name="t"><option>MR</option><option>MRS</option><option>MS</option><option value="">—</option></select></label><label>Teléfono<input name="p" placeholder="305-555-1234" required></label></div>
        <label>Recibido de<input name="r" placeholder="JUAN" required></label>
        <div class="hint" id="hPax"></div>
        <button class="primary">Agregar al PNR</button>
      </form>
      <h3>Finalizar y emitir</h3>
      <div class="form">
        <button class="primary" data-run="7TAW/§ER">Ticketing y finalizar (7TAW/§ER)</button>
        <button class="primary" data-run="WPRQ">Cotizar y guardar (WPRQ)</button>
        <button class="primary" data-run="W‡PQ1‡FCASH">Emitir en efectivo (W‡PQ1‡FCASH)</button>
      </div>`;
    const fa = el.querySelector('#fAvail'), fp = el.querySelector('#fPax');
    const availCmd = () => {
      const v = Object.fromEntries(new FormData(fa));
      const dt = v.date ? new Date(v.date + 'T00:00') : null;
      const ds = dt ? String(dt.getDate()).padStart(2, '0') + MON[dt.getMonth()] : '';
      return `1${ds}${v.o.toUpperCase()}${v.d.toUpperCase()}${v.t.toUpperCase()}${v.c ? '‡' + v.c.toUpperCase() : ''}`;
    };
    const paxCmd = () => {
      const v = Object.fromEntries(new FormData(fp));
      return `-${v.l.toUpperCase()}/${v.f.toUpperCase()}${v.t ? ' ' + v.t : ''}§9${v.p}-A§6${v.r.toUpperCase()}`;
    };
    const upd = () => { el.querySelector('#hAvail').textContent = '> ' + availCmd(); el.querySelector('#hPax').textContent = '> ' + paxCmd(); };
    fa.addEventListener('input', upd); fp.addEventListener('input', upd); upd();
    fa.addEventListener('submit', (e) => { e.preventDefault(); run(availCmd()); });
    fp.addEventListener('submit', (e) => { e.preventDefault(); run(paxCmd()); });
  }

  function recordsPanel() {
    const el = $('#tab-records');
    const list = E.listPNRs().slice().reverse();
    if (!list.length) { el.innerHTML = '<div class="empty"><b>Sin registros guardados.</b><br>Los PNR que finalices aparecerán aquí (se guardan en este navegador).</div>'; return; }
    el.innerHTML = '<p class="muted">PNR guardados en este navegador. Clic para recuperar.</p>' + list.map((p) => {
      const s = p.segs.find((x) => x.type === 'AIR');
      const n = p.names[0];
      return `<div class="rec" data-loc="${p.locator}"><div><span class="l">${p.locator}</span><small>${n ? esc(n.last + '/' + n.first) : ''}${p.names.length > 1 ? ' +' + (p.names.length - 1) : ''}</small></div><div style="text-align:right"><small>${s ? s.orig + '–' + s.dest + ' ' + E.ddmmm(s.date) : 'SIN ITIN'}</small><small>${p.tickets.some((t) => t.status === 'OPEN') ? 'EMITIDO' : 'RESERVADO'}</small></div></div>`;
    }).join('');
  }

  function refresh() {
    const s = E.snapshot();
    pnrPanel(s);
    if ($('#tab-records').classList.contains('on')) recordsPanel();
    $('#stAgent').textContent = s.signedIn ? 'AGENTE ' + s.agent.id : 'SIN SESIÓN';
    $('#stArea').textContent = 'ÁREA ' + s.area;
    $('#stPnr').textContent = s.pnr ? (s.pnr.locator || 'PNR NUEVO') + (s.pnr._pend && s.pnr._pend.length ? ' *' : '') : 'SIN PNR';
    $('#stQ').textContent = 'COLAS ' + s.inQueueCount;
    $$('.areas button').forEach((b) => {
      if (b.dataset.area === current) b.classList.toggle('busy', !!s.pnr);
    });
  }

  // ------------------------------------------------------------- eventos generales
  document.addEventListener('click', (ev) => {
    const chip = ev.target.closest('[data-cmd]');
    if (chip) { useCmd(chip.dataset.cmd, false); return; }
    const q = ev.target.closest('[data-insert]');
    if (q) { useCmd(q.dataset.insert, !!q.dataset.run); return; }
    const r = ev.target.closest('[data-run]');
    if (r) { run(r.dataset.run); return; }
    const rec = ev.target.closest('[data-loc]');
    if (rec) { run('*' + rec.dataset.loc); return; }
    const ar = ev.target.closest('[data-area]');
    if (ar) { setArea(ar.dataset.area); return; }
    const tab = ev.target.closest('[data-tab]');
    if (tab) {
      $$('.tabs button').forEach((b) => b.classList.toggle('on', b === tab));
      $$('.panel').forEach((p) => p.classList.toggle('on', p.id === 'tab-' + tab.dataset.tab));
      if (tab.dataset.tab === 'records') recordsPanel();
      return;
    }
    const act = ev.target.closest('[data-action]');
    if (!act) return;
    const a = act.dataset.action;
    if (a === 'help') $('#helpDlg').showModal();
    if (a === 'clear') { buffers[current] = []; screen.innerHTML = ''; input.focus(); }
    if (a === 'copy') { navigator.clipboard && navigator.clipboard.writeText(screen.innerText); }
    if (a === 'theme') {
      const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const nx = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nx; pref.set('theme', nx);
    }
    if (a === 'scheme') {
      const order = ['red360', 'classic', 'blue'];
      const nx = order[(order.indexOf(document.body.dataset.scheme) + 1) % order.length];
      document.body.dataset.scheme = nx; pref.set('scheme', nx);
    }
    if (a === 'newsession') {
      if (!confirm('¿Reiniciar la sesión? Se perderán los cambios no finalizados (los PNR guardados se conservan).')) return;
      location.reload();
    }
    if (a === 'reset') {
      if (!confirm('¿Borrar todos los PNR, boletos y colas guardados en este navegador?')) return;
      E.resetDB(); AREAS.forEach((x) => delete buffers[x]); setArea('A'); print(['BASE DE DATOS DE ENTRENAMIENTO REINICIADA']);
    }
  });

  function clock() {
    const d = new Date();
    $('#stClock').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + String(d.getDate()).padStart(2, '0') + MON[d.getMonth()];
  }

  // ------------------------------------------------------------- inicio
  const th = pref.get('theme', '');
  if (th) document.documentElement.dataset.theme = th;
  document.body.dataset.scheme = pref.get('scheme', 'red360');
  buffers.A = [];
  print(welcome());
  E.setArea('A');
  guidePanel(); refPanel(); bookPanel();
  refresh();
  clock(); setInterval(clock, 30000);
  screen.addEventListener('mouseup', () => { if (!window.getSelection().toString()) input.focus(); });
  input.focus();
})();
