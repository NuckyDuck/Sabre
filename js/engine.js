/* Motor del emulador de comandos en formato Sabre (simulacion educativa). */
(function (G) {
  'use strict';
  const D = G.SABDATA;

  // ---------------------------------------------------------------- utilidades
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DOW3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const DOW1 = ['S', 'M', 'T', 'W', 'Q', 'F', 'J'];
  const NARROW = ['738', '739', '73H', '7M8', '7M9', '320', '32N', '321'];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  const lpad = (s, n) => String(s).padStart(n);
  const money = (n) => (Math.round(n * 100) / 100).toFixed(2);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const rnd = (n) => Math.floor(Math.random() * n);

  function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fromIso(s) { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); }
  function addDays(s, n) { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d); }
  function ddmmm(s) { const d = typeof s === 'string' ? fromIso(s) : s; return String(d.getDate()).padStart(2, '0') + MONTHS[d.getMonth()]; }
  function dow3(s) { return DOW3[fromIso(s).getDay()]; }
  function dow1(s) { return DOW1[fromIso(s).getDay()]; }

  function parseDate(txt) {
    const m = /^(\d{1,2})([A-Z]{3})(\d{2})?$/.exec(txt || '');
    if (!m) return null;
    const mon = MONTHS.indexOf(m[2]);
    if (mon < 0) return null;
    const t = today();
    let y = m[3] ? 2000 + Number(m[3]) : t.getFullYear();
    let d = new Date(y, mon, Number(m[1]));
    if (d.getMonth() !== mon) return null;
    if (!m[3] && d < t) d = new Date(y + 1, mon, Number(m[1]));
    return iso(d);
  }
  function fmtTime(min) {
    min = ((min % 1440) + 1440) % 1440;
    let h = Math.floor(min / 60); const mm = String(min % 60).padStart(2, '0');
    if (h === 12 && mm === '00') return '1200N';
    if (h === 0 && mm === '00') return '1200M';
    const suf = h < 12 ? 'A' : 'P';
    h = h % 12 || 12;
    return h + mm + suf;
  }
  function parseTime(t) {
    const m = /^(\d{1,4})([APNM])?$/.exec(t || '');
    if (!m) return null;
    let n = m[1], h, mm;
    if (n.length <= 2) { h = +n; mm = 0; } else { h = +n.slice(0, -2); mm = +n.slice(-2); }
    if (m[2] === 'P' && h < 12) h += 12;
    if (m[2] === 'A' && h === 12) h = 0;
    if (m[2] === 'M') h = 0;
    return h * 60 + mm;
  }
  function durTxt(min) { return Math.floor(min / 60) + '.' + String(min % 60).padStart(2, '0'); }

  // ---------------------------------------------------------------- geografia
  function airport(code) { return D.AIRPORTS[code] ? code : null; }
  function cityOf(code) { const a = D.AIRPORTS[code]; return a ? (a[6] || code) : code; }
  function resolvePoint(code) {
    if (D.AIRPORTS[code]) return code;
    for (const k in D.AIRPORTS) if (D.AIRPORTS[k][6] === code) return k;
    return null;
  }
  function distKm(a, b) {
    const A = D.AIRPORTS[a], B = D.AIRPORTS[b];
    const r = Math.PI / 180, dLat = (B[3] - A[3]) * r, dLon = (B[4] - A[4]) * r;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(A[3] * r) * Math.cos(B[3] * r) * Math.sin(dLon / 2) ** 2;
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
  }
  const off = (a) => D.AIRPORTS[a][5] * 60;

  // ---------------------------------------------------------------- vuelos
  function legDuration(o, d) { return Math.round((distKm(o, d) / 820 * 60 + 35) / 5) * 5; }
  function serves(al, o, d) {
    const A = D.AIRLINES[al];
    if (cityOf(o) === cityOf(d)) return false;
    return (A[2].includes(o) || A[2].includes(d)) && distKm(o, d) <= A[3];
  }
  function equipFor(al, km, seed) {
    const list = D.AIRLINES[al][4];
    const nb = list.filter((e) => NARROW.includes(e)), wb = list.filter((e) => !NARROW.includes(e));
    const pool = km > 4200 && wb.length ? wb : (nb.length ? nb : list);
    return pool[seed % pool.length];
  }
  function mealFor(dep, dur) {
    if (dur < 100) return 'G';
    if (dur > 420) return 'M';
    if (dep < 600) return 'B';
    if (dep < 900) return 'L';
    if (dep < 1140) return 'D';
    return 'S';
  }
  function scheduleRoute(al, o, d) {
    const km = distKm(o, d), dur = legDuration(o, d);
    const n = km > 6000 ? 1 + (hash(al + o + d) % 2) : 2 + (hash(al + o + d) % 3);
    const out = [];
    for (let i = 0; i < n; i++) {
      const h = hash(al + o + d + i);
      const dep = 360 + Math.round(((h % 960) / (n)) / 5) * 5 + Math.round(i * 960 / n / 5) * 5;
      const arrAbs = dep - off(o) + dur + off(d);
      let fn = 100 + (hash(al + '#' + o + d) % 800) * 2 + i * 2;
      if (o > d) fn += 1;
      out.push({
        carrier: al, flight: String(fn), orig: o, dest: d, dep: dep % 1440,
        arr: ((arrAbs % 1440) + 1440) % 1440, dayOff: Math.floor(arrAbs / 1440) - Math.floor(dep / 1440),
        dur, equip: equipFor(al, km, h), meal: mealFor(dep % 1440, dur), km,
      });
    }
    return out.sort((a, b) => a.dep - b.dep);
  }
  function findFlight(al, fn, o, d) {
    if (o && d) return scheduleRoute(al, o, d).find((f) => f.flight === String(fn)) || null;
    const A = D.AIRLINES[al]; if (!A) return null;
    for (const h of A[2]) for (const x in D.AIRPORTS) {
      for (const [p, q] of [[h, x], [x, h]]) {
        if (!serves(al, p, q)) continue;
        const f = scheduleRoute(al, p, q).find((ff) => ff.flight === String(fn));
        if (f) return f;
      }
    }
    return null;
  }
  function seats(f, date, cls) {
    // Disponibilidad anidada: dentro de cada cabina las clases mas baratas nunca tienen mas asientos
    const near = Math.max(0, (Date.parse(date) - today().getTime()) / 864e5);
    const load = (hash(f.carrier + f.flight + date) % 100) + (near < 7 ? 25 : near < 21 ? 10 : 0);
    const order = D.CLASS_ROW1.concat(D.CLASS_ROW2);
    let prev = {}, res = 0;
    for (const c of order) {
      const cab = D.CLASSES[c][0];
      const h = hash(f.carrier + f.flight + date + c) % 100;
      let v = prev[cab] == null ? (load > 110 ? h % 4 : 9) : prev[cab];
      const rank = order.indexOf(c);
      if (prev[cab] != null && h < load * 0.35 + rank * 2) v = Math.max(0, v - 1 - (h % 6));
      prev[cab] = v;
      if (c === cls) { res = v; break; }
    }
    return res;
  }
  function options(o, d, date, prefCarrier, prefTime) {
    const res = [];
    for (const al in D.AIRLINES) {
      if (prefCarrier && al !== prefCarrier) continue;
      if (serves(al, o, d)) for (const f of scheduleRoute(al, o, d)) res.push({ legs: [Object.assign({ date }, f)] });
    }
    const direct = distKm(o, d);
    const conns = [];
    for (const al in D.AIRLINES) {
      if (prefCarrier && al !== prefCarrier) continue;
      for (const h of D.AIRLINES[al][2]) {
        if ([o, d].includes(h) || cityOf(h) === cityOf(o) || cityOf(h) === cityOf(d)) continue;
        if (!serves(al, o, h) || !serves(al, h, d)) continue;
        const tot = distKm(o, h) + distKm(h, d);
        if (tot > direct * 1.5 + 1500) continue;
        conns.push({ al, h, tot });
      }
    }
    conns.sort((a, b) => a.tot - b.tot);
    for (const c of conns.slice(0, 5)) {
      const l2s = scheduleRoute(c.al, c.h, d);
      for (const l1 of scheduleRoute(c.al, o, c.h).slice(0, 2)) {
        const arrAbs = l1.dep - off(o) + l1.dur + off(c.h);
        const baseDay = Math.floor(arrAbs / 1440), arrIn = arrAbs - baseDay * 1440;
        let best = null, bestDay = 0;
        for (const day of [0, 1]) {
          for (const l2 of l2s) {
            const dep2 = l2.dep + 1440 * day;
            if (dep2 >= arrIn + 60 && dep2 <= arrIn + 600) { best = l2; bestDay = day; break; }
          }
          if (best) break;
        }
        if (!best) continue;
        const d2 = addDays(date, baseDay + bestDay);
        res.push({ legs: [Object.assign({ date }, l1), Object.assign({ date: d2 }, best)] });
      }
    }
    if (!res.length && !prefCarrier) {
      // conexion interlinea como ultimo recurso
      for (const h of ['MIA', 'PTY', 'BOG', 'LIM', 'MAD', 'JFK', 'DFW', 'MEX', 'GRU', 'SCL', 'LHR', 'CDG', 'FRA', 'DXB', 'IST', 'ATL']) {
        if ([o, d].includes(h) || res.length >= 4) continue;
        const a1 = Object.keys(D.AIRLINES).find((al) => serves(al, o, h));
        const a2 = Object.keys(D.AIRLINES).find((al) => serves(al, h, d));
        if (!a1 || !a2) continue;
        const l1 = scheduleRoute(a1, o, h)[0];
        const arrAbs = l1.dep - off(o) + l1.dur + off(h);
        const baseDay = Math.floor(arrAbs / 1440), arrIn = arrAbs - baseDay * 1440;
        const cand = scheduleRoute(a2, h, d);
        let l2 = cand.find((x) => x.dep >= arrIn + 90), add = 0;
        if (!l2) { l2 = cand[0]; add = 1; }
        res.push({ legs: [Object.assign({ date }, l1), Object.assign({ date: addDays(date, baseDay + add) }, l2)] });
      }
    }
    const key = (opt) => {
      const l = opt.legs[0];
      const pt = prefTime == null ? 0 : Math.abs(l.dep - prefTime);
      return (opt.legs.length - 1) * 2000 + pt + l.dep / 1440;
    };
    res.sort((a, b) => key(a) - key(b));
    return res;
  }

  // ---------------------------------------------------------------- tarifas
  function carrierFactor(al) { return 0.9 + (hash(al) % 26) / 100; }
  function segFare(seg) {
    const km = distKm(seg.orig, seg.dest);
    const mult = (D.CLASSES[seg.cls] || D.CLASSES.Y)[1];
    return Math.round((55 + km * 0.105) * mult * carrierFactor(seg.carrier));
  }
  function fareBasis(seg, rt) {
    const km = distKm(seg.orig, seg.dest);
    const season = (fromIso(seg.date).getMonth() + 1) % 12 < 3 || [6, 7].includes(fromIso(seg.date).getMonth()) ? 'H' : 'L';
    return seg.cls + season + (rt ? 'RT' : 'OW') + (km > 2500 ? D.AIRPORTS[seg.orig][2].slice(0, 2) : '');
  }
  function taxesFor(airSegs) {
    const t = {};
    const add = (c, v) => { t[c] = (t[c] || 0) + v; };
    for (const s of airSegs) {
      const c = D.AIRPORTS[s.orig][2], dest = D.AIRPORTS[s.dest][2];
      if (c === 'US') { add('US', 22.9); add('AY', 5.6); add('XF', 4.5); }
      else if (c === 'MX') add('MX', 34.1);
      else if (['ES', 'FR', 'DE', 'IT', 'NL', 'PT', 'CH', 'GB'].includes(c)) { add(c === 'GB' ? 'GB' : 'JD', c === 'GB' ? 102.3 : 18.4); add('QV', 9.85); }
      else add('YR', 15 + (hash(s.orig) % 30));
      if (c !== dest) add('YQ', Math.round(distKm(s.orig, s.dest) * 0.022));
    }
    return t;
  }
  function priceItin(pnr, cfg) {
    const air = pnr.segs.filter((s) => s.type === 'AIR' && s.status !== 'XX');
    if (!air.length) return { err: 'NO ITINERARY' };
    cfg = cfg || {};
    let segs = clone(air);
    if (cfg.lowest) {
      const order = D.CLASS_ROW1.concat(D.CLASS_ROW2);
      for (const s of segs) {
        const cab = (D.CLASSES[s.cls] || D.CLASSES.Y)[0];
        const f = findFlight(s.carrier, s.flight, s.orig, s.dest) || s;
        for (let i = order.length - 1; i >= 0; i--) {
          const c = order[i];
          if (D.CLASSES[c][0] === cab && seats(f, s.date, c) >= Math.max(1, s.qty)) { s.cls = c; break; }
        }
      }
    }
    const first = segs[0], last = segs[segs.length - 1];
    const rt = cityOf(first.orig) === cityOf(last.dest) && segs.length > 1;
    let base = 0; const comps = [];
    for (const s of segs) {
      let f = segFare(s);
      if (rt) f = Math.round(f * 0.85);
      base += f; comps.push({ seg: s, fare: f, fb: fareBasis(s, rt) });
    }
    const types = {};
    let paxList = cfg.ptc && cfg.ptc.length ? cfg.ptc : null;
    if (!paxList) {
      paxList = [];
      const cnt = {};
      for (const n of pnr.names) cnt[n.ptc] = (cnt[n.ptc] || 0) + 1;
      if (!pnr.names.length) cnt.ADT = Math.max(1, first.qty);
      for (const k in cnt) paxList.push({ n: cnt[k], ptc: k });
    }
    const lines = [];
    for (const p of paxList) {
      const mult = (D.PTC[p.ptc] || D.PTC.ADT)[1];
      const b = Math.round(base * mult * 100) / 100;
      const tx = p.ptc === 'INF' ? {} : taxesFor(segs);
      const tsum = Object.values(tx).reduce((a, v) => a + v, 0);
      lines.push({ ptc: p.ptc, n: p.n, base: b, taxes: tx, tax: Math.round(tsum * 100) / 100, total: Math.round((b + tsum) * 100) / 100 });
      types[p.ptc] = true;
    }
    return { segs, comps, lines, rt, validating: first.carrier, rebook: cfg.lowest };
  }
  function renderPrice(pr, opts) {
    const o = [];
    o.push('       BASE FARE                 TAXES/FEES/CHARGES    TOTAL');
    let gb = 0, gt = 0, gtt = 0;
    pr.lines.forEach((l, i) => {
      const tx = Object.entries(l.taxes);
      const xt = tx.length > 2;
      o.push(` ${i + 1}-  ${pad('USD' + money(l.base), 14)}         ${lpad(money(l.tax) + (xt ? 'XT' : ''), 12)}     ${'USD' + money(l.total)}${l.ptc}`);
      if (xt) o.push('    XT ' + tx.map(([c, v]) => money(v) + c).join('  '));
      gb += l.base * l.n; gt += l.tax * l.n; gtt += l.total * l.n;
      if (l.n > 1) o.push(`   ${l.n}X PASAJEROS ${l.ptc}`);
    });
    o.push(`        ${pad(money(gb), 14)}         ${lpad(money(gt), 12)}     ${money(gtt)}TTL`);
    pr.lines.forEach((l) => {
      o.push(`${l.ptc}-${String(l.n).padStart(2, '0')}  ${pr.comps.map((c) => c.fb).join(' ')}`);
    });
    let fc = ' ' + pr.comps[0].seg.orig;
    let nuc = 0;
    for (const c of pr.comps) { fc += ` ${c.seg.carrier} ${c.seg.dest}${money(c.fare)}`; nuc += c.fare; }
    o.push(fc + 'NUC' + money(nuc) + 'END ROE1.00');
    const ld = addDays(iso(today()), 3);
    o.push(`LAST DAY TO PURCHASE ${ddmmm(ld)}/2359`);
    o.push('VALIDATING CARRIER - ' + pr.validating);
    for (const c of pr.comps) {
      const intl = D.AIRPORTS[c.seg.orig][2] !== D.AIRPORTS[c.seg.dest][2];
      o.push(`BAG ALLOWANCE     -${c.seg.orig}${c.seg.dest}-${intl ? '02P' : '01P'}/${c.seg.carrier}/EACH PIECE UP TO 50 POUNDS/23 KILOGRAMS`);
    }
    if (pr.rebook) o.push('CHANGE BOOKING CLASS -   ' + pr.segs.map((s, i) => (i + 1) + s.cls).join(' '));
    if (opts && opts.rebooked) o.push('*** REBOOKED SEGMENTS TO LOWEST AVAILABLE CLASS ***');
    o.push('E-TKT REQUIRED');
    if (opts && opts.stored) o.push('PRICE QUOTE RECORD RETAINED');
    return o;
  }

  // ---------------------------------------------------------------- base de datos
  const DBKEY = 'sabre-edu-db-v1';
  let DB;
  function loadDB() {
    try { DB = JSON.parse(localStorage.getItem(DBKEY)); } catch (e) { DB = null; }
    if (!DB || !DB.pnrs) DB = { pnrs: {}, queues: { 0: [], 7: [], 9: [], 50: [] }, tkt: 1000000, inv: 100 };
  }
  function saveDB() { try { localStorage.setItem(DBKEY, JSON.stringify(DB)); } catch (e) { /* sin almacenamiento */ } }
  function newLocator() {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let s;
    do { s = ''; for (let i = 0; i < 6; i++) s += L[rnd(L.length)]; } while (DB.pnrs[s]);
    return s;
  }
  loadDB();

  // ---------------------------------------------------------------- PNR
  function emptyPNR() {
    return {
      locator: null, names: [], segs: [], phones: [], tkt: null, received: '', remarks: [], ssr: [],
      osi: [], emails: [], address: null, fop: null, ff: [], dk: null, pq: [], tickets: [], seats: [],
      history: [], created: null, queuePlace: [],
    };
  }
  function nowStamp() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '/' + ddmmm(d) + String(d.getFullYear()).slice(2);
  }
  function hist(pnr, code, txt) { pnr._pend = pnr._pend || []; pnr._pend.push(code + ' ' + txt); }
  function paxCount(pnr) { return pnr.names.filter((n) => n.ptc !== 'INF').length; }
  function nameRef(pnr, i) {
    let g = 0, k = 0, last = null;
    for (let j = 0; j <= i; j++) {
      if (pnr.names[j].last !== last || pnr.names[j].newGroup) { g++; k = 0; last = pnr.names[j].last; }
      k++;
    }
    return g + '.' + k;
  }
  function findName(pnr, ref) {
    for (let i = 0; i < pnr.names.length; i++) if (nameRef(pnr, i) === ref) return i;
    return -1;
  }

  function segLine(s, i, loc) {
    const n = lpad(i + 1, 2);
    if (s.type === 'ARNK') return `${n} ARNK`;
    if (s.type === 'HTL') return `${n} HHL ${s.chain} ${s.status}${s.qty} ${s.city} IN${ddmmm(s.date)} OUT${ddmmm(s.out)} ${s.nights}NT\n      ${s.name}\n      ${s.room} ${money(s.rate)}${s.cur}/G/CF-${s.conf || 'PENDIENTE'}`;
    if (s.type === 'CAR') return `${n} CAR ${s.vendor} ${s.status}${s.qty} ${s.city} ${ddmmm(s.date)}-${ddmmm(s.out)} ${s.car}/RG-USD${money(s.rate)}DY/CF-${s.conf || 'PENDIENTE'}`;
    if (s.type === 'OTH') return `${n} OTH ${s.carrier} ${s.status}${s.qty} ${s.city} ${ddmmm(s.date)}-${s.text}`;
    const arrDate = s.dayOff ? '  ' + ddmmm(addDays(s.date, s.dayOff)) + ' ' + dow1(addDays(s.date, s.dayOff)) : '';
    const rl = loc && ['HK', 'KK', 'TK'].includes(s.status) ? ` /DC${s.carrier}*${s.airlineLoc || ''}` : '';
    return `${n} ${s.carrier}${lpad(s.flight, 4)}${s.cls} ${ddmmm(s.date)} ${dow1(s.date)} ${s.orig}${s.dest} ${s.status}${s.qty}  ${lpad(fmtTime(s.dep), 5)} ${lpad(fmtTime(s.arr), 5)}${arrDate}${rl} /E`;
  }
  function namesBlock(pnr) {
    if (!pnr.names.length) return [];
    const out = [];
    let line = '';
    pnr.names.forEach((n, i) => {
      let t = ` ${nameRef(pnr, i)}${n.ptc === 'INF' ? 'I/' : ''}${n.last}/${n.first}${n.title ? ' ' + n.title : ''}`;
      if (n.ptc === 'CNN') t += '*C' + (n.age || '');
      if (n.ptc === 'INF' && n.dob) t += '*' + n.dob;
      if ((line + t).length > 62) { out.push(line); line = ''; }
      line += t;
    });
    if (line) out.push(line);
    return out;
  }
  function renderPNR(pnr, part, agent) {
    const o = [];
    const want = (p) => !part || part === p || part === 'R' || part === 'A';
    if (part === 'N' || want('N')) o.push(...namesBlock(pnr));
    if (part === 'N') return o.length ? o : ['NO NAMES'];
    if (want('I')) {
      if (pnr.segs.length) pnr.segs.forEach((s, i) => o.push(segLine(s, i, pnr.locator)));
      else if (part === 'I') o.push('NO ITIN');
    }
    if (want('T')) {
      if (pnr.tkt || pnr.tickets.length) {
        o.push('TKT/TIME LIMIT');
        if (pnr.tkt) o.push('  1.' + pnr.tkt);
        pnr.tickets.forEach((t, i) => o.push(`  ${i + 2}.TE ${t.num}-AT ${t.pax} ${t.status === 'VOID' ? 'VOID' : ''}  ${t.date}`.replace(/ +$/, '')));
      }
    }
    if (want('9') && pnr.phones.length) { o.push('PHONES'); pnr.phones.forEach((p, i) => o.push(`  ${i + 1}.${p}`)); }
    if (want('PE') && pnr.emails.length) { o.push('CUSTOMER EMAIL DATA EXISTS - *PE TO DISPLAY ALL'); if (part === 'PE') pnr.emails.forEach((e, i) => o.push(`  ${i + 1}.${e}`)); }
    if (want('W') && pnr.address) { o.push('ADDRESS'); o.push('  ' + pnr.address); }
    if (want('PQ') && pnr.pq.length) o.push('PRICE QUOTE RECORD EXISTS - *PQ TO DISPLAY');
    if (want('3') && (pnr.ssr.length || pnr.osi.length)) {
      o.push('GENERAL FACTS');
      let k = 1;
      pnr.osi.forEach((x) => o.push(`  ${k++}.OSI ${x}`));
      pnr.ssr.forEach((x) => o.push(`  ${k++}.SSR ${x.code} ${x.carrier} ${x.status}${x.qty} ${x.text}`.replace(/ +$/, '')));
    }
    if (want('B') && pnr.seats.length) { o.push('SEATS/BOARDING PASS'); pnr.seats.forEach((s, i) => o.push(`  ${i + 1}  ${s.seg} ${s.flt} ${s.seat} N   ${s.name}`)); }
    if (want('FF') && pnr.ff.length) { o.push('FREQUENT TRAVELER'); pnr.ff.forEach((f, i) => o.push(`  ${i + 1}.${f}`)); }
    if (want('5') && (pnr.remarks.length || pnr.fop || pnr.dk)) {
      o.push('REMARKS');
      let k = 1;
      if (pnr.fop) o.push(`  ${k++}.-${pnr.fop}`);
      if (pnr.dk) o.push(`  ${k++}.DK ${pnr.dk}`);
      pnr.remarks.forEach((r) => o.push(`  ${k++}.${r}`));
    }
    if (want('6')) {
      if (pnr.received) o.push('RECEIVED FROM - ' + pnr.received);
      const pcc = agent ? agent.pcc : 'A1B2';
      if (pnr.locator) o.push(`${pcc}.${pcc}*A${agent ? agent.id.slice(-2) : 'GT'} ${pnr.stamp || nowStamp()} ${pnr.locator}`);
    }
    if (!o.length) return part ? ['NO DATA'] : ['NO PNR PRESENT'];
    return o;
  }

  // ---------------------------------------------------------------- asientos
  function seatMap(seg, pnr) {
    const eq = D.EQUIPMENT[seg.equip] || D.EQUIPMENT['738'];
    const cab = (D.CLASSES[seg.cls] || D.CLASSES.Y)[0];
    const prem = cab !== 'Y';
    const startRow = prem ? 1 : (eq[1] + (eq[1] > 5 ? 9 : 5));
    const rows = prem ? eq[1] : eq[2];
    const layout = prem ? eq[3] : eq[4];
    const cols = layout.replace(/ /g, '').split('');
    const taken = new Set(pnr.seats.filter((x) => x.segIdx === seg._idx).map((x) => x.seat));
    const o = [];
    o.push(`${seg.carrier} ${seg.flight} ${ddmmm(seg.date)} ${seg.orig}${seg.dest}  ${seg.equip} ${eq[0]}  CABINA ${prem ? 'PREMIUM' : 'ECONOMICA'}`);
    o.push('');
    o.push('     ' + layout.split('').map((c) => (c === ' ' ? '   ' : c + ' ')).join(''));
    for (let r = startRow; r < startRow + rows; r++) {
      let ln = lpad(r, 3) + '  ';
      for (const ch of layout) {
        if (ch === ' ') { ln += '   '; continue; }
        const id = r + ch;
        let mark = (hash(seg.carrier + seg.flight + seg.date + id) % 100) < 45 ? '*' : '.';
        if (!prem && r === startRow) mark = mark === '.' ? '+' : '*';
        if (taken.has(id)) mark = '/';
        ln += mark + ' ';
      }
      if (!prem && (r === startRow + 10 || r === startRow + 11)) ln += '  E';
      o.push(ln.replace(/ +$/, ''));
    }
    o.push('');
    o.push('.  DISPONIBLE   *  OCUPADO   /  ASIGNADO EN ESTE PNR   +  ASIENTO PREFERENTE   E  SALIDA');
    return { lines: o, cols, startRow, rows };
  }

  // ---------------------------------------------------------------- hoteles y autos
  function hotelsFor(city) {
    const list = [];
    for (let i = 0; i < 8; i++) {
      const h = hash(city + 'H' + i);
      const ch = D.HOTEL_CHAINS[(h >>> 3) % D.HOTEL_CHAINS.length];
      const name = `${ch[1]} ${D.HOTEL_SUFFIX[(h >>> 7) % D.HOTEL_SUFFIX.length]} ${D.AIRPORTS[resolvePoint(city)][0]}`;
      const stars = 2 + (h % 4);
      list.push({ chain: ch[0], name, stars, rate: 60 + (h % 180) + stars * 25, code: String(1000 + (h % 8999)), dist: ((h >>> 5) % 90) / 10 + 0.3 });
    }
    return list.sort((a, b) => a.rate - b.rate);
  }

  // ---------------------------------------------------------------- ayuda
  const HELP = {
    '': [
      'AYUDA DEL SIMULADOR - ESCRIBA HELP SEGUIDO DEL TEMA',
      '  HELP SIGN      INICIO/CIERRE DE SESION',
      '  HELP ENCODE    CODIFICAR / DECODIFICAR',
      '  HELP AVAIL     DISPONIBILIDAD Y HORARIOS',
      '  HELP SELL      VENTA DE SEGMENTOS',
      '  HELP PNR       CONSTRUCCION DEL PNR',
      '  HELP DISPLAY   DESPLIEGUE Y RECUPERACION',
      '  HELP MODIFY    MODIFICAR / CANCELAR',
      '  HELP FARES     TARIFAS Y COTIZACION',
      '  HELP TICKET    EMISION DE BOLETOS',
      '  HELP SEATS     ASIENTOS',
      '  HELP HOTEL     HOTELES Y AUTOS',
      '  HELP QUEUE     COLAS (QUEUES)',
      '  HELP MISC      UTILIDADES',
      'TECLAS: \\ = ‡ (CRUZ DE LORENA)  [ = ¤ (CAMBIO)  ] = § (FIN DE ITEM)',
    ],
    SIGN: ['SI*1234         INICIAR SESION CON NUMERO DE AGENTE (EPR)', 'SO*             CERRAR SESION', 'SI              VER ESTADO DE SESION'],
    ENCODE: ['W/*MAD          DECODIFICAR CIUDAD/AEROPUERTO O AEROLINEA', 'W/-CCMADRID     CODIFICAR CIUDAD', 'W/-APHEATHROW   CODIFICAR AEROPUERTO', 'W/-ALIBERIA     CODIFICAR AEROLINEA', 'W/EQ*789        DECODIFICAR EQUIPO', 'W/*USD          DECODIFICAR MONEDA'],
    AVAIL: ['115DECMIAMAD          DISPONIBILIDAD 15DIC MIAMI-MADRID', '115DECMIAMAD9A        A PARTIR DE LAS 9AM', '115DECMIAMAD‡IB       SOLO UNA AEROLINEA', '1*                    MAS DISPONIBILIDAD', '1R20DEC               DISPONIBILIDAD DE REGRESO', '2IB921/15DEC          INFORMACION DE VUELO', 'S*MIAMAD/15DEC        HORARIOS (TIMETABLE)', 'VI*                   DETALLE DE VUELOS DEL ITINERARIO'],
    SELL: ['01Y1                  VENDER 1 ASIENTO CLASE Y LINEA 1', '02Y3Y4                VENDER 2 ASIENTOS CONEXION LINEAS 3 Y 4', '01Y1LL                LISTA DE ESPERA', '0IB921Y15DECMIAMADNN1 VENTA DIRECTA', '0A                    SEGMENTO ARNK (SUPERFICIE)', '0OTHAAGK1MAD15DEC-TXT SEGMENTO OTH'],
    PNR: ['-PEREZ/JUAN MR             NOMBRE', '-2GOMEZ/ANA MRS/LUIS MR    DOS NOMBRES MISMO APELLIDO', '-ROJAS/PEDRO*C05           NINO DE 5 ANOS', '-I/ROJAS/SOFIA*15JAN25     INFANTE', '9305-555-1234-A            TELEFONO (A=AGENCIA H=CASA B=TRABAJO M=MOVIL)', '7TAW/                      TICKETING (TAW = ALMACENAR)', '7TAW15DEC/                 TICKETING CON FECHA LIMITE', '6JUAN                      RECIBIDO DE', '5TEXTO                     OBSERVACION GENERAL', '5-CASH  5-*VI4111111111111111‡12/28   FORMA DE PAGO', 'PE‡CORREO@MAIL.COM‡        EMAIL', 'W-NOMBRE‡CALLE‡CIUDAD     DIRECCION', '3DOCS/P/USA/123456/USA/12JUL80/M/20JUL30/PEREZ/JUAN-1.1   APIS', '3VGML1-1.1                 SSR COMIDA VEGETARIANA SEG 1', '3WCHR1                     SSR SILLA DE RUEDAS', '3OSI AA VIP PASSENGER      OSI', 'FFAA123456-1.1             VIAJERO FRECUENTE', 'DK123456                   NUMERO DE CLIENTE', 'E  ER  EW                  FINALIZAR / FINALIZAR Y REDESPLEGAR', 'I  IR                      IGNORAR / IGNORAR Y RECUPERAR'],
    DISPLAY: ['*ABCDEF    RECUPERAR POR LOCALIZADOR', '*-PEREZ    BUSCAR POR APELLIDO', '*R  *A     DESPLEGAR PNR COMPLETO', '*I  *IA    ITINERARIO', '*N         NOMBRES', '*P9        TELEFONOS', '*T         TICKETING', '*P3        SSR/OSI', '*P5        OBSERVACIONES', '*B         ASIENTOS', '*FF        VIAJERO FRECUENTE', '*PE        EMAILS', '*PQ        PRICE QUOTE', '*H         HISTORIAL', 'MD MU MT MB   MOVER PANTALLA'],
    MODIFY: ['X2         CANCELAR SEGMENTO 2', 'X1-3  X1/3 CANCELAR VARIOS', 'XI         CANCELAR TODO EL ITINERARIO', '.1HK       CAMBIAR ESTATUS DEL SEGMENTO 1', '-1.1¤PEREZ/JUAN MR    CAMBIAR NOMBRE', '92¤        BORRAR TELEFONO 2', '91¤305-555-0000-H     CAMBIAR TELEFONO 1', '53¤        BORRAR OBSERVACION 3', '3¤2        BORRAR SSR/OSI ITEM 2', 'D1         DIVIDIR PNR (PASAJERO 1)'],
    FARES: ['WP         COTIZAR ITINERARIO', 'WPNC       TARIFA MAS BAJA DISPONIBLE', 'WPNCB      COTIZAR Y RESERVAR LA MAS BAJA', 'WPRQ       COTIZAR Y GUARDAR PRICE QUOTE', 'WPP1ADT/1CNN   COTIZAR POR TIPO DE PASAJERO', '*PQ        VER PRICE QUOTES', 'PQD-ALL    BORRAR PRICE QUOTES', 'FQMIAMAD15DEC‡AA   DESPLIEGUE DE TARIFAS', 'RD3        REGLAS DE LA TARIFA LINEA 3', 'DC‡USD100/EUR      CONVERSION DE MONEDA'],
    TICKET: ['W‡PQ1‡FCASH       EMITIR BOLETO CON PQ 1 EN EFECTIVO', 'W‡FCK             EMITIR CON CHEQUE', 'W‡F*VI4111111111111111‡12/28   EMITIR CON TARJETA', 'W‡PQ1‡FCASH‡KP5   CON COMISION 5%', 'WETR              LISTA DE BOLETOS ELECTRONICOS', 'WETR*2            DETALLE DEL BOLETO LINEA 2', 'WV2               ANULAR (VOID) BOLETO DEL ITEM 2 DE *T', 'WFR2              REEMBOLSAR BOLETO DEL ITEM 2 DE *T'],
    SEATS: ['4G1*             MAPA DE ASIENTOS SEGMENTO 1', '4G1/12A          ASIGNAR ASIENTO 12A SEG 1', '4G1/12AB         DOS ASIENTOS (DOS PASAJEROS)', '4G1/14C-1.2      ASIENTO PARA PASAJERO 1.2', '4GX1             CANCELAR ASIENTOS DEL SEGMENTO 1'],
    HOTEL: ['HOTMAD/15DEC-18DEC2   HOTELES EN MADRID, 2 HUESPEDES', 'HOD3                  DESCRIPCION DEL HOTEL LINEA 3', '0H3                   RESERVAR HOTEL LINEA 3', 'CFMAD/15DEC-18DEC/1000-1000   AUTOS EN MADRID', '0C2                   RESERVAR AUTO LINEA 2'],
    QUEUE: ['QC/         CONTEO DE COLAS', 'QP/50       COLOCAR PNR EN COLA 50 (AL FINALIZAR)', 'QP/A1B2/9   COLOCAR EN COLA 9 DE OTRA OFICINA', 'Q/50        ENTRAR A LA COLA 50', 'I           SIGUIENTE (SIN CAMBIOS)', 'QR          REMOVER Y SIGUIENTE', 'E           GUARDAR Y SIGUIENTE', 'QXI         SALIR DE LA COLA'],
    MISC: ['T‡MAD            HORA LOCAL EN MADRID', 'T‡15DEC‡30       SUMAR 30 DIAS A UNA FECHA', 'T‡125*3+10      CALCULADORA', 'DC‡USD250/MXN   CONVERSION DE MONEDA', 'HELP            ESTA AYUDA', 'CLEAR / PAUSA   LIMPIAR PANTALLA (TAMBIEN ESC)', 'ENTRADA1§ENTRADA2   COMBINAR ENTRADAS CON FIN DE ITEM'],
  };

  // ---------------------------------------------------------------- sesion
  const S = {
    signedIn: false,
    agent: { id: '', pcc: 'A1B2' },
    area: 'A',
    areas: {},
  };
  function area() {
    if (!S.areas[S.area]) S.areas[S.area] = { pnr: null, orig: null, avail: null, fq: null, hotels: null, cars: null, names: null, queue: null, warned: false };
    return S.areas[S.area];
  }
  function work() { const a = area(); if (!a.pnr) a.pnr = emptyPNR(); return a.pnr; }
  function hasWork() { const a = area(); return !!a.pnr; }

  function storeAvailParams(a, p) { a.availParams = p; }

  // ---------------------------------------------------------------- comandos
  function cmdAvail(m, page) {
    const a = area();
    let p;
    if (page) {
      if (!a.availParams) return ['NO PREVIOUS AVAILABILITY'];
      p = Object.assign({}, a.availParams, { page: a.availParams.page + 1 });
    } else {
      const date = m.date ? parseDate(m.date) : iso(today());
      if (!date) return ['INVALID DATE'];
      const o = resolvePoint(m.o), d = resolvePoint(m.d);
      if (!o) return [`*${m.o}* - CITY/AIRPORT CODE NOT FOUND`];
      if (!d) return [`*${m.d}* - CITY/AIRPORT CODE NOT FOUND`];
      if (m.c && !D.AIRLINES[m.c]) return ['INVALID CARRIER CODE'];
      p = { o, d, oc: m.o, dc: m.d, date, c: m.c, time: m.time ? parseTime(m.time) : null, page: 0 };
    }
    const all = options(p.o, p.d, p.date, p.c, p.time);
    if (!all.length) return ['NO DIRECT OR CONNECTING FLIGHTS FOUND', 'VERIFY CITY PAIR / CARRIER'];
    const per = 5;
    const slice = all.slice(p.page * per, p.page * per + per);
    if (!slice.length) return ['NO MORE AVAILABILITY'];
    storeAvailParams(a, p);
    const diff = (off(p.d) - off(p.o)) / 60;
    const o = [];
    o.push(`${ddmmm(p.date)}  ${dow3(p.date)}   ${p.oc}/${D.AIRPORTS[p.o][5] >= 0 ? 'Z‡' : 'Z¥'}${Math.abs(D.AIRPORTS[p.o][5])}     ${p.dc}/${diff >= 0 ? '‡' : '¥'}${Math.abs(diff)}`);
    const lines = [];
    let n = 0;
    for (const opt of slice) {
      opt.legs.forEach((l, li) => {
        n++;
        const avail = {};
        let r1 = '', r2 = '';
        for (const c of D.CLASS_ROW1) { avail[c] = seats(l, l.date, c); r1 += `${c}${avail[c]} `; }
        for (const c of D.CLASS_ROW2) { avail[c] = seats(l, l.date, c); r2 += `${c}${avail[c]} `; }
        const dayInd = l.dayOff > 0 ? '‡' + l.dayOff : l.dayOff < 0 ? '¥' + -l.dayOff : '  ';
        const first = `${lpad(n, 2)}${l.carrier}${lpad(l.flight, 5)} ${r1}${l.orig}${l.dest} ${lpad(fmtTime(l.dep), 5)} ${lpad(fmtTime(l.arr), 5)}${dayInd} ${l.equip} 0 ${l.meal}  ${durTxt(l.dur)} /E`;
        o.push((li > 0 ? '' : '') + first);
        o.push(`          ${r2}${li > 0 ? '' : opt.legs.length > 1 ? '   CONX' : ''}`.replace(/ +$/, ''));
        lines.push(Object.assign({ n, avail, conxWith: opt.legs.length > 1 ? opt.legs.length : 0 }, l));
      });
    }
    a.avail = lines;
    o.push(all.length > (p.page + 1) * per ? 'MORE AVAILABILITY - USE 1*' : 'END OF AVAILABILITY');
    return o;
  }

  function sellSeg(l, cls, qty, status) {
    const pnr = work();
    const seg = {
      type: 'AIR', carrier: l.carrier, flight: l.flight, cls, date: l.date, orig: l.orig, dest: l.dest,
      status, qty, dep: l.dep, arr: l.arr, dayOff: l.dayOff, equip: l.equip, meal: l.meal, dur: l.dur,
    };
    pnr.segs.push(seg);
    sortSegs(pnr);
    hist(pnr, 'AS', `${seg.carrier}${seg.flight}${cls} ${ddmmm(seg.date)} ${seg.orig}${seg.dest} ${status}${qty}`);
    return seg;
  }
  function segTime(s) {
    if (!s.date) return Infinity;
    return fromIso(s.date).getTime() + (s.dep || 0) * 60000;
  }
  function sortSegs(pnr) {
    // Sabre ordena automaticamente por fecha; ARNK conserva su posicion relativa
    const arnk = [];
    const rest = [];
    pnr.segs.forEach((s, i) => (s.type === 'ARNK' ? arnk.push(i) : rest.push(s)));
    if (arnk.length) return;
    rest.sort((a, b) => segTime(a) - segTime(b));
    pnr.segs = rest;
  }

  function cmdSellAvail(qty, spec, ll) {
    const a = area();
    if (!a.avail) return ['NO AVAILABILITY DISPLAYED - REQUEST AVAILABILITY FIRST'];
    const parts = spec.match(/[A-Z]\d{1,2}/g);
    const out = [];
    const toSell = [];
    for (const p of parts) {
      const cls = p[0], ln = +p.slice(1);
      const l = a.avail.find((x) => x.n === ln);
      if (!l) return ['INVALID LINE NUMBER - ' + ln];
      if (!(cls in l.avail)) return [`CLASS ${cls} NOT OFFERED`];
      if (!ll && l.avail[cls] < qty) return [`UNABLE - ${cls} CLASS NOT AVAILABLE ON LINE ${ln}`, 'USE LL TO WAITLIST OR SELECT OTHER CLASS'];
      toSell.push([l, cls]);
    }
    for (const [l, cls] of toSell) {
      const seg = sellSeg(l, cls, qty, ll ? 'LL' : 'SS');
      out.push(segLine(seg, work().segs.indexOf(seg)));
      out.push(`OPERATED BY ${D.AIRLINES[l.carrier][0]}`);
      if (!ll) out.push(`DEPARTS ${l.orig} TERMINAL ${1 + (hash(l.orig + l.carrier) % 4)}  - ARRIVES ${l.dest} TERMINAL ${1 + (hash(l.dest + l.carrier) % 4)}`);
    }
    return out;
  }

  function cmdDirectSell(m) {
    const [, al, fn, cls, dt, o, d, st, q] = m;
    if (!D.AIRLINES[al]) return ['INVALID CARRIER CODE'];
    const date = parseDate(dt);
    if (!date) return ['INVALID DATE'];
    const oo = resolvePoint(o), dd = resolvePoint(d);
    if (!oo || !dd) return ['CHECK CITY PAIR'];
    let f = findFlight(al, fn, oo, dd);
    if (!f) {
      if (st !== 'GK') return [`FLIGHT ${al}${fn} DOES NOT OPERATE ${o}${d} - USE GK FOR PASSIVE`];
      const dur = legDuration(oo, dd);
      f = { carrier: al, flight: fn, orig: oo, dest: dd, dep: 600, arr: (600 - off(oo) + dur + off(dd) + 1440) % 1440, dayOff: 0, equip: '320', meal: 'M', dur };
    }
    if (!D.CLASSES[cls]) return ['INVALID CLASS'];
    const seg = sellSeg(Object.assign({ date }, f), cls, +q, st);
    return [segLine(seg, work().segs.indexOf(seg)), `OPERATED BY ${D.AIRLINES[al][0]}`];
  }

  function parseNames(txt) {
    // -2PEREZ/JUAN MR/ANA MRS  |  -PEREZ/JUAN MR*C05  | -I/PEREZ/LUIS*12JAN25
    let inf = false;
    if (txt.startsWith('I/')) { inf = true; txt = txt.slice(2); }
    const m = /^(\d)?([A-Z' -]+)\/(.+)$/.exec(txt);
    if (!m) return null;
    const last = m[2].trim();
    const firsts = m[3].split('/');
    if (m[1] && +m[1] !== firsts.length) return 'MISMATCH';
    return firsts.map((f) => {
      let ptc = inf ? 'INF' : 'ADT', age = null, dob = null;
      const cm = /\*C(\d{2})$/.exec(f) || /\*CNN$/.exec(f);
      if (cm) { ptc = 'CNN'; age = cm[1] || null; f = f.replace(/\*C.*$/, ''); }
      const im = /\*(\d{1,2}[A-Z]{3}\d{2})$/.exec(f);
      if (im) { dob = im[1]; f = f.replace(/\*.*$/, ''); }
      const tm = /^(.*?)\s+(MR|MRS|MS|MISS|MSTR|DR|PROF)$/.exec(f.trim());
      return { last, first: tm ? tm[1].trim() : f.trim(), title: tm ? tm[2] : '', ptc, age, dob, newGroup: false };
    });
  }

  function cmdName(rest) {
    const pnr = work();
    const ch = /^(\d\.\d)¤(.*)$/.exec(rest);
    if (ch) {
      const idx = findName(pnr, ch[1]);
      if (idx < 0) return ['NAME NUMBER NOT IN PNR'];
      if (pnr.tickets.some((t) => t.status === 'OPEN')) return ['NAME CHANGE NOT ALLOWED - TICKETED PNR'];
      if (!ch[2]) { hist(pnr, 'XN', pnr.names[idx].last + '/' + pnr.names[idx].first); pnr.names.splice(idx, 1); return ['*']; }
      const nn = parseNames(ch[2]);
      if (!nn || nn === 'MISMATCH' || nn.length !== 1) return ['FORMAT'];
      hist(pnr, 'XN', pnr.names[idx].last + '/' + pnr.names[idx].first);
      pnr.names[idx] = nn[0];
      hist(pnr, 'AN', nn[0].last + '/' + nn[0].first);
      return ['*'];
    }
    const nn = parseNames(rest);
    if (nn === 'MISMATCH') return ['NUMBER OF NAMES DOES NOT MATCH NUMBER IN PARTY'];
    if (!nn) return ['FORMAT - USE -APELLIDO/NOMBRE'];
    if (pnr.names.length + nn.length > 99) return ['MAX NAMES EXCEEDED'];
    if (nn[0].ptc === 'INF' && !pnr.names.some((n) => n.ptc === 'ADT')) return ['INFANT REQUIRES ADULT NAME FIRST'];
    if (pnr.names.length && pnr.names[pnr.names.length - 1].last === nn[0].last) nn[0].newGroup = true;
    pnr.names.push(...nn);
    nn.forEach((n) => hist(pnr, 'AN', n.last + '/' + n.first));
    return ['*'];
  }

  function itemChange(list, rest, label, pnr, code) {
    const m = /^(\d+)¤(.*)$/.exec(rest);
    if (!m) return null;
    const i = +m[1] - 1;
    if (!list[i]) return [`${label} ITEM NUMBER NOT IN PNR`];
    hist(pnr, 'X' + code, list[i]);
    if (m[2]) { list[i] = m[2]; hist(pnr, 'A' + code, m[2]); } else list.splice(i, 1);
    return ['*'];
  }

  function cmdPhone(rest) {
    const pnr = work();
    const c = itemChange(pnr.phones, rest, 'PHONE', pnr, '9');
    if (c) return c;
    if (!/^[A-Z]{0,3}[\d -]{7,}(-[AHBMF])?$/.test(rest)) return ['FORMAT - EJ: 9305-555-1234-A'];
    let p = rest;
    if (!/^[A-Z]{3}/.test(p)) p = 'MIA' + p;
    if (!/-[AHBMF]$/.test(p)) p += '-A';
    pnr.phones.push(p);
    hist(pnr, 'A9', p);
    return ['*'];
  }

  function cmdTicketing(rest) {
    const pnr = work();
    if (rest === '¤') { hist(pnr, 'X7', pnr.tkt || ''); pnr.tkt = null; return ['*']; }
    let m;
    if ((m = /^TAW(\d{1,2}[A-Z]{3})?\/(.*)$/.exec(rest))) {
      if (m[1] && !parseDate(m[1])) return ['INVALID DATE'];
      pnr.tkt = 'TAW' + (m[1] || '') + '/' + (m[2] || '');
    } else if (/^T-?A$/.test(rest) || rest === 'TA') pnr.tkt = 'T-' + ddmmm(today()) + '-' + S.agent.pcc + '*A' + S.agent.id.slice(-2);
    else if ((m = /^TAX(\d{1,2}[A-Z]{3})\/(.*)$/.exec(rest))) pnr.tkt = 'TAX' + m[1] + '/' + m[2];
    else return ['FORMAT - USE 7TAW/ O 7TAW15DEC/'];
    hist(pnr, 'A7', pnr.tkt);
    return ['*'];
  }

  function cmdRemark(rest) {
    const pnr = work();
    if (rest.startsWith('-')) {
      const f = rest.slice(1);
      let m;
      if (f === 'CASH' || f === 'CK' || f === 'CHECK') pnr.fop = f === 'CASH' ? 'CASH' : 'CHECK';
      else if ((m = /^\*([A-Z]{2})(\d{13,19})‡(\d{2}\/\d{2})$/.exec(f))) {
        if (!luhn(m[2])) return ['CREDIT CARD NUMBER FAILS VALIDATION'];
        pnr.fop = `*${m[1]}${'X'.repeat(m[2].length - 4)}${m[2].slice(-4)}‡${m[3]}`;
      } else return ['FORMAT - 5-CASH  5-CHECK  5-*VI4111111111111111‡12/28'];
      hist(pnr, 'AF', pnr.fop);
      return ['*'];
    }
    const items = (pnr.fop ? 1 : 0) + (pnr.dk ? 1 : 0);
    const cm = /^(\d+)¤(.*)$/.exec(rest);
    if (cm) {
      let i = +cm[1];
      if (pnr.fop && i === 1) { pnr.fop = cm[2].startsWith('-') ? pnr.fop : null; if (!cm[2]) return ['*']; return cmdRemark(cm[2]); }
      if (pnr.dk && i === (pnr.fop ? 2 : 1)) { pnr.dk = null; return ['*']; }
      return itemChange(pnr.remarks, (i - items) + '¤' + cm[2], 'REMARK', pnr, '5');
    }
    if (!rest) return ['FORMAT'];
    pnr.remarks.push(rest);
    hist(pnr, 'A5', rest);
    return ['*'];
  }
  function luhn(n) {
    let s = 0, alt = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let d = +n[i];
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      s += d; alt = !alt;
    }
    return s % 10 === 0;
  }

  function cmdSSR(rest) {
    const pnr = work();
    let m;
    if ((m = /^¤(\d+)$/.exec(rest))) {
      const i = +m[1] - 1;
      if (i < pnr.osi.length) pnr.osi.splice(i, 1);
      else if (pnr.ssr[i - pnr.osi.length]) pnr.ssr.splice(i - pnr.osi.length, 1);
      else return ['ITEM NOT IN PNR'];
      return ['*'];
    }
    if ((m = /^OSI ([A-Z0-9]{2}) (.+)$/.exec(rest))) {
      pnr.osi.push(`${m[1]} ${m[2]}`);
      hist(pnr, 'A3', 'OSI ' + m[1] + ' ' + m[2]);
      return ['*'];
    }
    m = /^([A-Z]{4})([\d,-]*?)(\/.*?)?(-\d\.\d)?$/.exec(rest);
    if (!m) return ['FORMAT'];
    const code = m[1];
    if (!D.SSR_CODES[code]) return [`SSR CODE ${code} NOT RECOGNIZED - VER HELP PNR`];
    const air = pnr.segs.map((s, i) => [s, i]).filter(([s]) => s.type === 'AIR');
    if (!air.length) return ['NEED ITINERARY FOR SSR'];
    let segIdx = [];
    if (m[2]) {
      for (const part of m[2].split(',')) {
        const r = part.split('-').map(Number);
        for (let i = r[0]; i <= (r[1] || r[0]); i++) segIdx.push(i - 1);
      }
      if (segIdx.some((i) => !pnr.segs[i] || pnr.segs[i].type !== 'AIR')) return ['INVALID SEGMENT NUMBER'];
    }
    const nm = m[4] ? m[4].slice(1) : null;
    if (nm && findName(pnr, nm) < 0) return ['NAME NUMBER NOT IN PNR'];
    if (['DOCS', 'DOCA', 'DOCO', 'CTCE', 'CTCM', 'FOID'].includes(code)) {
      if (code === 'DOCS' && (!m[3] || m[3].split('/').length < 9)) return ['FORMAT - 3DOCS/P/PAIS/NUMERO/NACIONALIDAD/FECHANAC/SEXO/VENCE/APELLIDO/NOMBRE-1.1'];
      const carriers = [...new Set(air.map(([s]) => s.carrier))];
      for (const c of carriers) pnr.ssr.push({ code, carrier: c, status: 'HK', qty: 1, text: (m[3] ? m[3].slice(1) : '') + (nm ? '-' + nm : '') });
      hist(pnr, 'A3', code);
      return ['*'];
    }
    const targets = segIdx.length ? segIdx : air.map(([, i]) => i);
    for (const i of targets) {
      const s = pnr.segs[i];
      pnr.ssr.push({ code, carrier: s.carrier, status: 'NN', qty: 1, text: `${s.orig}${s.dest}${s.flight}${s.cls}${ddmmm(s.date)}${m[3] ? m[3] : ''}${nm ? '-' + nm : ''}` });
    }
    hist(pnr, 'A3', code);
    return ['*'];
  }

  function cmdSeat(rest) {
    const pnr = work();
    let m;
    if ((m = /^G(\d+)\*$/.exec(rest))) {
      const s = pnr.segs[+m[1] - 1];
      if (!s || s.type !== 'AIR') return ['INVALID SEGMENT NUMBER'];
      s._idx = +m[1] - 1;
      const sm = seatMap(s, pnr);
      delete s._idx;
      return sm.lines;
    }
    if ((m = /^GX(\d+)$/.exec(rest))) {
      const before = pnr.seats.length;
      pnr.seats = pnr.seats.filter((x) => x.segIdx !== +m[1] - 1);
      return before === pnr.seats.length ? ['NO SEATS FOR SEGMENT'] : ['SEAT CANCELLED'];
    }
    if ((m = /^G(\d+)\/(\d+)([A-K]+)(?:-(\d\.\d))?$/.exec(rest))) {
      const idx = +m[1] - 1, s = pnr.segs[idx];
      if (!s || s.type !== 'AIR') return ['INVALID SEGMENT NUMBER'];
      if (!pnr.names.length) return ['NEED NAMES BEFORE SEAT ASSIGNMENT'];
      s._idx = idx;
      const sm = seatMap(s, pnr);
      delete s._idx;
      const row = +m[2];
      if (row < sm.startRow || row >= sm.startRow + sm.rows) return ['ROW NOT IN CABIN OF BOOKED CLASS'];
      const letters = m[3].split('');
      if (letters.some((l) => !sm.cols.includes(l))) return ['INVALID SEAT LETTER FOR AIRCRAFT'];
      const adults = pnr.names.map((n, i) => [n, i]).filter(([n]) => n.ptc !== 'INF');
      let paxIdx = m[4] ? [findName(pnr, m[4])] : adults.map(([, i]) => i).slice(0, letters.length);
      if (paxIdx.some((i) => i < 0)) return ['NAME NUMBER NOT IN PNR'];
      const out = [];
      letters.forEach((l, k) => {
        const id = row + l;
        const occupied = (hash(s.carrier + s.flight + s.date + id) % 100) < 45;
        if (occupied) { out.push(`SEAT ${id} NOT AVAILABLE`); return; }
        const pi = paxIdx[k];
        if (pi == null) return;
        pnr.seats = pnr.seats.filter((x) => !(x.segIdx === idx && x.nameIdx === pi));
        pnr.seats.push({ segIdx: idx, nameIdx: pi, seat: id, seg: `${s.orig}${s.dest}`, flt: `${s.carrier}${s.flight}`, name: nameRef(pnr, pi) + ' ' + pnr.names[pi].last + '/' + pnr.names[pi].first });
        out.push(`${s.carrier} ${s.flight} ${ddmmm(s.date)} ${s.orig}${s.dest}  ${id} ${nameRef(pnr, pi)}  SEAT CONFIRMED`);
      });
      hist(pnr, 'AG', `${s.carrier}${s.flight} ${m[2]}${m[3]}`);
      return out;
    }
    return ['FORMAT - 4G1* MAPA  4G1/12A ASIGNAR'];
  }

  function validateEnd(pnr, isNew) {
    if (!pnr.names.length) return 'NEED NAME IN PNR - USE -';
    if (!pnr.segs.length && isNew) return 'NEED ITINERARY';
    if (!pnr.phones.length) return 'NEED PHONE FIELD - USE 9';
    if (!pnr.tkt && !pnr.tickets.length) return 'NEED TICKETING FIELD - USE 7';
    if (!pnr.received) return 'NEED RECEIVED FROM FIELD - USE 6';
    const n = paxCount(pnr);
    for (const s of pnr.segs) if (s.type === 'AIR' && s.status !== 'XX' && s.qty !== n) return 'NUMBER IN PARTY DOES NOT MATCH NUMBER OF NAMES';
    return null;
  }
  function checkWarnings(pnr) {
    const air = pnr.segs.filter((s) => s.type !== 'HTL' && s.type !== 'CAR' && s.type !== 'OTH');
    for (let i = 0; i < air.length - 1; i++) {
      const a = air[i], b = air[i + 1];
      if (a.type === 'ARNK' || b.type === 'ARNK') continue;
      if (cityOf(a.dest) !== cityOf(b.orig)) return 'CHECK CONTINUITY - USE 0A FOR ARNK OR END AGAIN';
      if (segTime(b) < segTime(a)) return 'VERIFY ORDER OF ITINERARY SEGMENTS - MODIFY OR END TRANSACTION';
    }
    return null;
  }

  function cmdEnd(kind) {
    const a = area();
    if (!a.pnr) return ['NO PNR PRESENT'];
    const pnr = a.pnr;
    const isNew = !pnr.locator;
    const changed = !!(pnr._pend && pnr._pend.length) || isNew;
    if (!changed && !pnr.queuePlace.length) {
      if (a.queue) return queueNext(false);
      a.pnr = null; a.orig = null; return ['NO CHANGES - PNR CLOSED'];
    }
    const err = validateEnd(pnr, isNew);
    if (err) return [err];
    if (!a.warned) {
      const w = checkWarnings(pnr);
      if (w) { a.warned = true; return [w]; }
    }
    a.warned = false;
    if (isNew) { pnr.locator = newLocator(); pnr.created = nowStamp(); }
    for (const s of pnr.segs) {
      if (['SS', 'NN'].includes(s.status)) {
        s.status = 'HK';
        if (s.type === 'AIR') s.airlineLoc = s.airlineLoc || newLocator().slice(0, 6);
        if (s.type === 'HTL' || s.type === 'CAR') s.conf = s.conf || String(10000000 + rnd(89999999));
      }
    }
    for (const x of pnr.ssr) if (x.status === 'NN') x.status = 'HK';
    pnr.stamp = nowStamp();
    pnr.history.push({ stamp: pnr.stamp, by: pnr.received, agent: S.agent.id, items: pnr._pend || [] });
    delete pnr._pend;
    const recv = pnr.received;
    pnr.received = '';
    for (const q of pnr.queuePlace) {
      DB.queues[q] = DB.queues[q] || [];
      if (!DB.queues[q].includes(pnr.locator)) DB.queues[q].push(pnr.locator);
    }
    const placed = pnr.queuePlace.slice();
    pnr.queuePlace = [];
    pnr.lastReceived = recv;
    DB.pnrs[pnr.locator] = clone(pnr);
    saveDB();
    const out = [`OK ${pnr.stamp.slice(0, 4)} ${pnr.locator}`];
    if (placed.length) out.push('PNR PLACED ON QUEUE ' + placed.join(','));
    if (a.queue) { a.pnr = null; return out.concat(queueNext(false)); }
    if (kind === 'ER') { a.pnr = clone(DB.pnrs[pnr.locator]); a.orig = clone(a.pnr); return out.concat(renderPNR(a.pnr, null, S.agent)); }
    a.pnr = null; a.orig = null;
    return out;
  }

  function retrieve(loc) {
    const a = area();
    const p = DB.pnrs[loc];
    if (!p) return null;
    a.pnr = clone(p);
    a.orig = clone(p);
    a.pnr.received = '';
    a.warned = false;
    return a.pnr;
  }

  function cmdCancel(spec) {
    const pnr = work();
    if (!pnr.segs.length) return ['NO ITIN'];
    let idx = [];
    if (spec === 'I') idx = pnr.segs.map((_, i) => i);
    else {
      for (const part of spec.split('/')) {
        const r = part.split('-').map(Number);
        for (let i = r[0]; i <= (r[1] || r[0]); i++) idx.push(i - 1);
      }
    }
    if (idx.some((i) => !pnr.segs[i])) return ['INVALID SEGMENT NUMBER'];
    const ticketed = pnr.tickets.some((t) => t.status === 'OPEN');
    idx.sort((a, b) => b - a).forEach((i) => {
      const s = pnr.segs[i];
      hist(pnr, 'XS', s.type === 'AIR' ? `${s.carrier}${s.flight}${s.cls} ${ddmmm(s.date)} ${s.orig}${s.dest}` : s.type);
      pnr.segs.splice(i, 1);
      pnr.seats = pnr.seats.filter((x) => x.segIdx !== i).map((x) => (x.segIdx > i ? Object.assign(x, { segIdx: x.segIdx - 1 }) : x));
    });
    const out = [spec === 'I' ? 'ITINERARY CANCELLED' : 'SEGMENT CANCELLED', 'NEXT REPLACES ' + (idx.length ? Math.min(...idx) + 1 : 1)];
    if (ticketed) out.push('*** WARNING - PNR TICKETED - VERIFY E-TICKET STATUS ***');
    if (!pnr.segs.length && spec !== 'I') out.push('NO ITIN');
    return out;
  }

  function cmdPrice(rest) {
    const pnr = work();
    const cfg = { lowest: false, book: false, store: false, ptc: null };
    let r = rest.replace(/‡/g, '');
    if (/NCB/.test(r)) { cfg.lowest = true; cfg.book = true; r = r.replace('NCB', ''); }
    if (/NC/.test(r)) { cfg.lowest = true; r = r.replace('NC', ''); }
    if (/RQ/.test(r)) { cfg.store = true; r = r.replace('RQ', ''); }
    const pm = /P((?:\d[A-Z]{3}\/?)+)/.exec(r);
    if (pm) {
      cfg.ptc = pm[1].split('/').filter(Boolean).map((x) => ({ n: +x[0], ptc: x.slice(1) }));
      if (cfg.ptc.some((x) => !D.PTC[x.ptc])) return ['INVALID PASSENGER TYPE CODE'];
      r = r.replace(pm[0], '');
    }
    if (r.trim()) return ['FORMAT - WP  WPNC  WPNCB  WPRQ  WPP1ADT/1CNN'];
    const pr = priceItin(pnr, cfg);
    if (pr.err) return [pr.err];
    let rebooked = false;
    if (cfg.book) {
      const air = pnr.segs.filter((s) => s.type === 'AIR' && s.status !== 'XX');
      air.forEach((s, i) => { if (s.cls !== pr.segs[i].cls) { hist(pnr, 'XS', `${s.carrier}${s.flight}${s.cls}`); s.cls = pr.segs[i].cls; hist(pnr, 'AS', `${s.carrier}${s.flight}${s.cls}`); rebooked = true; } });
      pr.rebook = false;
    }
    if (cfg.lowest && !cfg.book) pr.rebook = true;
    const out = [];
    if (cfg.book) out.push(...pnr.segs.map((s, i) => segLine(s, i)));
    if (cfg.store) {
      if (cfg.lowest && !cfg.book) return ['CANNOT STORE PQ WITH NC - USE WPNCB'];
      const n = pnr.pq.length + 1;
      pnr.pq.push({ n, date: ddmmm(today()), lines: pr.lines, comps: pr.comps.map((c) => ({ fb: c.fb, fare: c.fare, seg: `${c.seg.carrier}${c.seg.flight}${c.seg.cls} ${c.seg.orig}${c.seg.dest}` })), total: pr.lines.reduce((a, l) => a + l.total * l.n, 0), validating: pr.validating, status: 'ACTIVE' });
      hist(pnr, 'APQ', String(n));
      out.push('PQ ' + n);
    }
    return out.concat(renderPrice(pr, { stored: cfg.store, rebooked }));
  }

  function cmdFQ(m) {
    const o = resolvePoint(m[1]), d = resolvePoint(m[2]);
    if (!o || !d) return ['CHECK CITY PAIR'];
    const date = m[3] ? parseDate(m[3]) : iso(today());
    if (!date) return ['INVALID DATE'];
    const carriers = Object.keys(D.AIRLINES).filter((al) => (!m[4] || al === m[4]) && (serves(al, o, d) || options(o, d, date, al).length));
    if (!carriers.length) return ['NO FARES FOR CITY PAIR / CARRIER'];
    const rows = [];
    for (const al of carriers.slice(0, 6)) {
      for (const cls of ['F', 'J', 'C', 'W', 'Y', 'B', 'H', 'K', 'M', 'L', 'V', 'S', 'Q', 'O']) {
        if ((hash(al + cls + o + d) % 5) === 0 && !['Y', 'J'].includes(cls)) continue;
        const seg = { carrier: al, orig: o, dest: d, cls, date };
        const ow = segFare(seg);
        const rt = Math.round(ow * 1.7);
        rows.push({ al, cls, ow, rt, fb: fareBasis(seg, false), fbr: fareBasis(seg, true), ap: ['Y', 'J', 'F', 'C', 'W', 'B'].includes(cls) ? '-' : String([3, 7, 14, 21][hash(al + cls) % 4]), mn: ['Y', 'J', 'F', 'C'].includes(cls) ? '-' : 'SU', mx: ['Y', 'J', 'F', 'C'].includes(cls) ? '-' : '12M' });
      }
    }
    rows.sort((a, b) => a.rt - b.rt);
    const out = [`FARES LAST UPDATED ${ddmmm(addDays(iso(today()), -1))}`, `${o}-${d} AT ${ddmmm(date)}  CURRENCY USD  MPM ${Math.round(distKm(o, d) * 0.621 * 1.2)}`,
      '     CXR   OW       RT     FARE BASIS   BK  AP   MIN  MAX  RTG'];
    rows.slice(0, 20).forEach((r, i) => {
      out.push(`${lpad(i + 1, 3)}  ${r.al}  ${lpad(money(r.ow), 8)} ${lpad(money(r.rt), 8)}  ${pad(r.fbr, 11)}  ${r.cls}  ${pad(r.ap, 3)}  ${pad(r.mn, 3)}  ${pad(r.mx, 3)}  ${hash(r.al) % 9 + 1}`);
    });
    area().fq = rows.slice(0, 20).map((r) => Object.assign({ o, d, date }, r));
    out.push('RD{LINEA} PARA REGLAS DE LA TARIFA');
    return out;
  }
  function cmdRD(n) {
    const fq = area().fq;
    if (!fq || !fq[n - 1]) return ['NO FARE DISPLAY - USE FQ FIRST'];
    const r = fq[n - 1];
    const flex = ['Y', 'J', 'F', 'C'].includes(r.cls);
    return [
      `V FARE BASIS     BK    FARE   TRAVEL-TICKET AP  MINMAX  RTG`,
      ` ${pad(r.fbr, 13)}  ${r.cls}  ${lpad(money(r.rt), 8)} R  ${'-'.padEnd(13)} ${pad(r.ap, 3)} ${pad(r.mn, 3)}/${pad(r.mx, 3)} ${r.al}`,
      `${r.o}-${r.d}  ${r.al}  CAT RULES`,
      `00.RULE - ${r.al}${hash(r.fbr) % 900 + 100}/${r.fbr}`,
      `01.ELIGIBILITY        - NO RESTRICTIONS`,
      `02.DAY/TIME           - PERMITTED ALL DAYS`,
      `03.SEASONALITY        - ${r.fbr[1] === 'H' ? 'HIGH SEASON' : 'LOW SEASON'}`,
      `05.ADVANCE RES/TKT    - ${r.ap === '-' ? 'NONE' : 'RESERVE AND TICKET ' + r.ap + ' DAYS BEFORE DEPARTURE'}`,
      `06.MINIMUM STAY       - ${r.mn === '-' ? 'NONE' : 'SATURDAY NIGHT STAY REQUIRED'}`,
      `07.MAXIMUM STAY       - ${r.mx === '-' ? 'NONE' : '12 MONTHS'}`,
      `08.STOPOVERS          - ${flex ? '2 FREE STOPOVERS PERMITTED' : 'NOT PERMITTED'}`,
      `16.PENALTIES          - CHANGES ${flex ? 'FREE' : 'CHARGE USD ' + (100 + (hash(r.fbr) % 3) * 50)}`,
      `                        CANCEL/REFUND ${flex ? 'REFUNDABLE' : 'NON-REFUNDABLE'}`,
      `19.CHILDREN DISCOUNTS - CHILD 2-11 25 PERCENT / INFANT UNDER 2 90 PERCENT`,
      `31.VOLUNTARY CHANGES  - SEE CAT 16`,
    ];
  }

  function cmdTicket(rest) {
    const a = area();
    const pnr = a.pnr;
    if (!pnr || !pnr.locator) return ['PNR MUST BE ENDED BEFORE TICKETING - USE ER'];
    if (pnr._pend && pnr._pend.length) return ['END OR IGNORE CHANGES BEFORE TICKETING'];
    const opts = rest.split('‡').filter(Boolean);
    let pq = null, fop = pnr.fop, comm = 0;
    for (const o of opts) {
      let m;
      if ((m = /^PQ(\d+)$/.exec(o))) { pq = pnr.pq.find((x) => x.n === +m[1] && x.status === 'ACTIVE'); if (!pq) return ['PQ RECORD NOT FOUND OR NOT ACTIVE']; }
      else if (o === 'FCASH') fop = 'CASH';
      else if (o === 'FCK') fop = 'CHECK';
      else if ((m = /^F\*([A-Z]{2})(\d{13,19})$/.exec(o))) { if (!luhn(m[2])) return ['CREDIT CARD NUMBER FAILS VALIDATION']; fop = `*${m[1]}XXXX${m[2].slice(-4)}`; }
      else if (/^\d{2}\/\d{2}$/.test(o)) { /* vencimiento */ }
      else if ((m = /^KP(\d+(\.\d+)?)$/.exec(o))) comm = +m[1];
      else if (/^A[A-Z0-9]{2}$/.test(o) || o === 'ABSP' || o === 'AARC' || o === 'ETR') { /* validadora/plan */ }
      else return ['INVALID TICKETING MODIFIER ' + o];
    }
    if (!fop) return ['NEED FORM OF PAYMENT - USE ‡F OR 5-'];
    const air = pnr.segs.filter((s) => s.type === 'AIR');
    if (!air.length) return ['NO ITINERARY TO TICKET'];
    if (air.some((s) => s.status !== 'HK')) return ['ALL SEGMENTS MUST BE CONFIRMED HK TO TICKET'];
    if (!pq) {
      pq = pnr.pq.filter((x) => x.status === 'ACTIVE').pop();
      if (!pq) {
        const pr = priceItin(pnr, {});
        pq = { n: pnr.pq.length + 1, lines: pr.lines, total: pr.lines.reduce((s, l) => s + l.total * l.n, 0), validating: pr.validating, status: 'ACTIVE', comps: [] };
      }
    }
    const pref = D.AIRLINES[pq.validating][1];
    const out = [];
    pnr.names.forEach((n, i) => {
      DB.tkt += 1 + rnd(7);
      const num = pref + String(2100000000 + DB.tkt);
      const ptc = n.ptc;
      const line = pq.lines.find((l) => l.ptc === ptc) || pq.lines[0];
      pnr.tickets.push({ num, pax: nameRef(pnr, i), name: `${n.last}/${n.first}`, status: 'OPEN', date: ddmmm(today()), amount: line.total, base: line.base, tax: line.tax, fop, comm, coupons: air.map((s) => ({ seg: `${s.carrier}${s.flight}${s.cls} ${ddmmm(s.date)} ${s.orig}${s.dest}`, status: 'OPEN' })) });
      pnr.ssr.push({ code: 'TKNE', carrier: pq.validating, status: 'HK', qty: 1, text: `${num}C1-${nameRef(pnr, i)}` });
      out.push(`ETR ${num} ${pad(n.last + '/' + n.first, 24)} USD${money(line.total)}`);
    });
    pq.status = 'TICKETED';
    DB.inv += 1;
    pnr.tkt = null;
    pnr.stamp = nowStamp();
    pnr.history.push({ stamp: pnr.stamp, by: 'TKT', agent: S.agent.id, items: ['TKT ISSUED ' + pnr.tickets.slice(-pnr.names.length).map((t) => t.num).join(' ')] });
    DB.pnrs[pnr.locator] = clone(pnr);
    saveDB();
    a.orig = clone(pnr);
    return [`OK ${money(pq.total)} ELECTRONIC TICKET ISSUED`, `INVOICE ${String(DB.inv).padStart(7, '0')}  FOP ${fop}${comm ? '  COMM ' + comm + 'PCT' : ''}`].concat(out);
  }

  function ticketByItem(pnr, n) {
    // item 1 = TAW si existe, los boletos siguen
    const i = n - 2;
    return pnr.tickets[i] || null;
  }
  function cmdWETR(rest) {
    const pnr = area().pnr;
    if (!pnr) return ['NO PNR PRESENT'];
    if (!pnr.tickets.length) return ['NO ELECTRONIC TICKETS IN PNR'];
    if (!rest) {
      const o = ['ELECTRONIC TICKET LIST'];
      pnr.tickets.forEach((t, i) => o.push(`${lpad(i + 2, 2)} ${t.num}  ${pad(t.name, 22)} ${pad(t.status, 5)} ${t.date}  USD${money(t.amount)}`));
      o.push('WETR*{ITEM} PARA DETALLE');
      return o;
    }
    const t = ticketByItem(pnr, +rest);
    if (!t) return ['ITEM NOT FOUND'];
    const o = [`ELECTRONIC TICKET RECORD`, `INV:${String(DB.inv).padStart(7, '0')}  CUST:${pnr.dk || ''}  PNR:${pnr.locator}`, `TKT:${t.num}  ISSUED:${t.date}  PCC:${S.agent.pcc}  IATA:00000000`, `NAME:${t.name}`, `FOP:${t.fop}`, ''];
    o.push('CPN  A/L FLT  CLS DATE  BRDOFF  ST');
    t.coupons.forEach((c, i) => o.push(`${lpad(i + 1, 3)}  ${c.seg}  ${t.status === 'VOID' ? 'VOID' : t.status === 'RFND' ? 'RFND' : c.status}`));
    o.push('', `FARE USD${money(t.base)}  TAX USD${money(t.tax)}  TOTAL USD${money(t.amount)}`);
    return o;
  }
  function cmdVoidRefund(kind, n) {
    const a = area(), pnr = a.pnr;
    if (!pnr || !pnr.locator) return ['NO PNR PRESENT'];
    const t = ticketByItem(pnr, n);
    if (!t) return ['TICKET ITEM NOT FOUND - USE *T'];
    if (t.status !== 'OPEN') return ['TICKET NOT IN OPEN STATUS'];
    if (kind === 'V' && t.date !== ddmmm(today())) return ['VOID NOT PERMITTED - TICKET NOT ISSUED TODAY - USE WFR'];
    t.status = kind === 'V' ? 'VOID' : 'RFND';
    t.coupons.forEach((c) => (c.status = t.status));
    pnr.stamp = nowStamp();
    pnr.history.push({ stamp: pnr.stamp, by: kind === 'V' ? 'VOID' : 'REFUND', agent: S.agent.id, items: [(kind === 'V' ? 'VOID ' : 'RFND ') + t.num] });
    DB.pnrs[pnr.locator] = clone(pnr); saveDB(); a.orig = clone(pnr);
    if (kind === 'V') return [`TICKET ${t.num} VOIDED`, 'OK'];
    const pen = Math.round(t.base * 0.15 * 100) / 100;
    return [`REFUND ${t.num}`, `FARE PAID USD${money(t.base)}  TAX USD${money(t.tax)}`, `PENALTY USD${money(pen)}`, `TOTAL REFUND USD${money(t.amount - pen)}`, 'REFUND PROCESSED - OK'];
  }

  function decode(code) {
    const out = [];
    if (D.AIRPORTS[code]) { const a = D.AIRPORTS[code]; out.push(`${code}  ${a[1]}`, `     ${a[0]}, ${D.COUNTRIES[a[2]] || a[2]}`, `     CITY CODE ${a[6] || code}  GMT${a[5] >= 0 ? '+' : ''}${a[5]}`); }
    const city = Object.keys(D.AIRPORTS).filter((k) => D.AIRPORTS[k][6] === code);
    if (city.length) out.push(`${code}  ${D.AIRPORTS[city[0]][0]} - ALL AIRPORTS`, ...city.map((c) => `     ${c} ${D.AIRPORTS[c][1]}`));
    if (D.AIRLINES[code]) out.push(`${code}  ${D.AIRLINES[code][0]}`, `     TICKET PREFIX ${D.AIRLINES[code][1]}  HUBS ${D.AIRLINES[code][2].join(' ')}`);
    if (D.CURRENCIES[code]) out.push(`${code}  ${D.CURRENCIES[code][0]}`);
    if (D.COUNTRIES[code.slice(0, 2)] && code.length === 2 && !D.AIRLINES[code]) out.push(`${code}  ${D.COUNTRIES[code]}`);
    return out.length ? out : [`*${code}* NOT FOUND`];
  }
  function encode(kind, name) {
    name = name.trim();
    const out = [];
    if (kind === 'AL') {
      for (const k in D.AIRLINES) if (D.AIRLINES[k][0].includes(name)) out.push(`${k}  ${D.AIRLINES[k][0]}`);
    } else {
      const seen = new Set();
      for (const k in D.AIRPORTS) {
        const a = D.AIRPORTS[k];
        const hay = kind === 'AP' ? a[1] : a[0];
        if (hay.includes(name)) {
          if (kind === 'CC') { const c = a[6] || k; if (seen.has(c)) continue; seen.add(c); out.push(`${c}  ${a[0]}, ${D.COUNTRIES[a[2]]}`); }
          else out.push(`${k}  ${a[1]} - ${a[0]}`);
        }
      }
    }
    return out.length ? out : ['NOT FOUND - CHECK SPELLING'];
  }

  function cmdTime(rest) {
    let m;
    if ((m = /^([A-Z]{3})$/.exec(rest))) {
      const p = resolvePoint(m[1]);
      if (!p) return ['CITY NOT FOUND'];
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const loc = new Date(utc + D.AIRPORTS[p][5] * 3600000);
      return [`${m[1]}  ${fmtTime(loc.getHours() * 60 + loc.getMinutes())}  ${DOW3[loc.getDay()]} ${ddmmm(loc)}  GMT${D.AIRPORTS[p][5] >= 0 ? '+' : ''}${D.AIRPORTS[p][5]}`];
    }
    if ((m = /^(\d{1,2}[A-Z]{3})‡(\d+)$/.exec(rest))) {
      const d = parseDate(m[1]);
      if (!d) return ['INVALID DATE'];
      const r = addDays(d, +m[2]);
      return [`${ddmmm(d)} + ${m[2]} DAYS = ${ddmmm(r)} ${dow3(r)}`];
    }
    if (/^[\d+\-*/.() ]+$/.test(rest)) {
      try {
        // eslint-disable-next-line no-new-func
        const v = Function('"use strict";return (' + rest + ')')();
        if (!isFinite(v)) return ['MATH ERROR'];
        return [`${rest} = ${Math.round(v * 100) / 100}`];
      } catch (e) { return ['FORMAT']; }
    }
    return ['FORMAT - T‡MAD  T‡15DEC‡30  T‡125*3'];
  }

  function cmdDC(rest) {
    if (!rest) return Object.entries(D.CURRENCIES).map(([k, v]) => `${k}  ${pad(v[0], 22)} 1 ${k} = ${v[1]} USD`);
    const m = /^([A-Z]{3})([\d.]+)\/([A-Z]{3})$/.exec(rest);
    if (!m) return ['FORMAT - DC‡USD100/EUR'];
    const f = D.CURRENCIES[m[1]], t = D.CURRENCIES[m[3]];
    if (!f || !t) return ['CURRENCY CODE NOT FOUND'];
    const v = (+m[2] * f[1]) / t[1];
    return [`RATE BSR 1${m[1]} - ${(f[1] / t[1]).toFixed(6)} ${m[3]}`, `${m[1]} ${money(+m[2])} = ${m[3]} ${money(v)}`, 'TASAS FICTICIAS - SOLO PARA FINES EDUCATIVOS'];
  }

  function cmdFlightInfo(al, fn, dt) {
    const date = dt ? parseDate(dt) : iso(today());
    if (!date) return ['INVALID DATE'];
    if (!D.AIRLINES[al]) return ['INVALID CARRIER'];
    const f = findFlight(al, fn);
    if (!f) return [`FLIGHT ${al}${fn} NOT OPERATING`];
    const eq = D.EQUIPMENT[f.equip];
    return [
      `${al} ${fn}  ${ddmmm(date)} ${dow3(date)}  ${D.AIRLINES[al][0]}`,
      `${pad('BRD', 5)}${pad('TIME', 8)}${pad('OFF', 5)}${pad('TIME', 8)}EQP  ELPD  MILES  MEAL`,
      `${pad(f.orig, 5)}${pad(fmtTime(f.dep), 8)}${pad(f.dest, 5)}${pad(fmtTime(f.arr) + (f.dayOff ? '‡1' : ''), 8)}${f.equip}  ${durTxt(f.dur)}  ${lpad(Math.round(f.km * 0.621), 5)}  ${D.MEALS[f.meal]}`,
      `EQUIPMENT ${eq ? eq[0] : f.equip}`,
      `DEP TERMINAL ${1 + (hash(f.orig + al) % 4)}   ARR TERMINAL ${1 + (hash(f.dest + al) % 4)}`,
      'ON TIME PERFORMANCE ' + (70 + (hash(al + fn) % 28)) + ' PCT',
    ];
  }

  function cmdTimetable(o, d, dt) {
    const oo = resolvePoint(o), dd = resolvePoint(d);
    if (!oo || !dd) return ['CHECK CITY PAIR'];
    const date = dt ? parseDate(dt) : iso(today());
    const out = [`TIMETABLE ${o}${d}  EFFECTIVE ${ddmmm(addDays(date, -15))} - ${ddmmm(addDays(date, 75))}`];
    let n = 0;
    for (const al in D.AIRLINES) {
      if (!serves(al, oo, dd)) continue;
      for (const f of scheduleRoute(al, oo, dd)) out.push(`${lpad(++n, 2)} ${al}${lpad(f.flight, 5)}  ${oo}${dd}  ${lpad(fmtTime(f.dep), 5)} ${lpad(fmtTime(f.arr), 5)}${f.dayOff ? '‡1' : '  '}  ${f.equip}  1234567  ${durTxt(f.dur)}`);
    }
    if (!n) out.push('NO NONSTOP SERVICE - USE 1 FOR CONNECTIONS');
    return out;
  }

  function cmdHotel(m) {
    const city = resolvePoint(m[1]);
    if (!city) return ['CITY NOT FOUND'];
    const din = parseDate(m[2]), dout = parseDate(m[3]);
    if (!din || !dout || dout <= din) return ['CHECK DATES - CHECK-OUT MUST BE AFTER CHECK-IN'];
    const nights = Math.round((fromIso(dout) - fromIso(din)) / 864e5);
    const g = +(m[4] || 1);
    const list = hotelsFor(m[1]);
    area().hotels = { list, city: m[1], din, dout, nights, g };
    const out = [`${m[1]} ${ddmmm(din)}-${ddmmm(dout)} ${nights}NT ${g}GST  RATES IN USD`, 'LN CHN NAME                              STARS  DIST  RATE FROM'];
    list.forEach((h, i) => out.push(`${lpad(i + 1, 2)} ${h.chain}  ${pad(h.name, 34)} ${'*'.repeat(h.stars).padEnd(5)}  ${lpad(h.dist.toFixed(1), 4)}  ${lpad(money(h.rate + (g - 1) * 20), 7)}`));
    out.push('HOD{LINEA} DESCRIPCION   0H{LINEA} RESERVAR');
    return out;
  }
  function cmdHOD(n) {
    const h = area().hotels;
    if (!h || !h.list[n - 1]) return ['NO HOTEL DISPLAY'];
    const x = h.list[n - 1];
    return [`${x.chain}${x.code}  ${x.name}`, `${'*'.repeat(x.stars)}  ${x.dist.toFixed(1)} KM DEL CENTRO`, 'ROOM RATES:', ` A1K  1 KING BED STANDARD          ${money(x.rate + (h.g - 1) * 20)}`, ` A2D  2 DOUBLE BEDS STANDARD        ${money(x.rate + 15 + (h.g - 1) * 20)}`, ` B1K  1 KING BED DELUXE            ${money(x.rate + 55 + (h.g - 1) * 20)}`, 'CANCEL POLICY: 24 HRS BEFORE ARRIVAL', 'GUARANTEE: CREDIT CARD REQUIRED', 'AMENITIES: WIFI POOL GYM RESTAURANT', '0H' + n + ' PARA RESERVAR'];
  }
  function cmdHotelSell(n) {
    const h = area().hotels;
    if (!h || !h.list[n - 1]) return ['NO HOTEL DISPLAY - USE HOT'];
    const pnr = work();
    const x = h.list[n - 1];
    const seg = { type: 'HTL', chain: x.chain, name: x.name, city: h.city, date: h.din, out: h.dout, nights: h.nights, status: 'SS', qty: 1, room: '1A1KRAC', rate: x.rate + (h.g - 1) * 20, cur: 'USD', dep: 900 };
    pnr.segs.push(seg);
    sortSegs(pnr);
    hist(pnr, 'AH', `${x.chain} ${h.city} ${ddmmm(h.din)}`);
    return [segLine(seg, pnr.segs.indexOf(seg))];
  }
  function cmdCar(m) {
    const city = resolvePoint(m[1]);
    if (!city) return ['CITY NOT FOUND'];
    const d1 = parseDate(m[2]), d2 = parseDate(m[3]);
    if (!d1 || !d2 || d2 < d1) return ['CHECK DATES'];
    const list = [];
    for (const v of D.CAR_VENDORS) for (const c of D.CAR_TYPES) {
      if (hash(v[0] + c[0] + m[1]) % 3 === 0) continue;
      list.push({ vendor: v[0], vname: v[1], car: c[0], desc: c[1], rate: c[2] + (hash(v[0] + m[1]) % 15) });
    }
    list.sort((a, b) => a.rate - b.rate);
    const sl = list.slice(0, 12);
    area().cars = { list: sl, city: m[1], d1, d2, t1: m[4] || '1000', t2: m[5] || '1000' };
    const out = [`${m[1]} ${ddmmm(d1)}-${ddmmm(d2)}  PICKUP ${m[4] || '1000'}  RETURN ${m[5] || '1000'}  USD`, 'LN VND COMPANY        TYPE  DESCRIPTION                   RATE/DAY'];
    sl.forEach((c, i) => out.push(`${lpad(i + 1, 2)} ${c.vendor}  ${pad(c.vname, 13)}  ${c.car}  ${pad(c.desc, 28)}  ${lpad(money(c.rate), 7)}`));
    out.push('0C{LINEA} PARA RESERVAR');
    return out;
  }
  function cmdCarSell(n) {
    const c = area().cars;
    if (!c || !c.list[n - 1]) return ['NO CAR DISPLAY - USE CF'];
    const x = c.list[n - 1];
    const pnr = work();
    const seg = { type: 'CAR', vendor: x.vendor, car: x.car, city: c.city, date: c.d1, out: c.d2, rate: x.rate, status: 'SS', qty: 1, dep: parseTime(c.t1) || 600 };
    pnr.segs.push(seg);
    sortSegs(pnr);
    hist(pnr, 'AC', `${x.vendor} ${c.city} ${ddmmm(c.d1)}`);
    return [segLine(seg, pnr.segs.indexOf(seg))];
  }

  function cmdQueue(cmd) {
    const a = area();
    let m;
    if (cmd === 'QC/') {
      const o = ['QUEUE COUNT FOR ' + S.agent.pcc, ' Q   PNRS  DESCRIPTION'];
      const desc = { 0: 'URGENT', 7: 'SCHEDULE CHANGE', 9: 'TICKETING', 50: 'GENERAL' };
      for (const q of Object.keys(DB.queues).sort((x, y) => x - y)) o.push(`${lpad(q, 3)}  ${lpad(DB.queues[q].length, 4)}   ${desc[q] || 'AGENCY QUEUE'}`);
      o.push(`TOTAL ${Object.values(DB.queues).reduce((s, x) => s + x.length, 0)}`);
      return o;
    }
    if ((m = /^QP\/(?:([A-Z0-9]{4})\/)?(\d{1,3})$/.exec(cmd))) {
      if (!a.pnr) return ['NO PNR PRESENT'];
      a.pnr.queuePlace.push(+m[2]);
      hist(a.pnr, 'QP', m[2]);
      return [`QUEUE PLACEMENT ${m[1] || S.agent.pcc}/${m[2]} - WILL BE PLACED ON END TRANSACTION`];
    }
    if ((m = /^Q\/(\d{1,3})$/.exec(cmd))) {
      if (a.pnr && a.pnr._pend && a.pnr._pend.length) return ['FINISH OR IGNORE CURRENT PNR FIRST'];
      const q = +m[1];
      if (!DB.queues[q] || !DB.queues[q].length) return [`QUEUE ${q} IS EMPTY`];
      a.queue = { q, pos: 0 };
      return [`QUEUE ${q} - ${DB.queues[q].length} PNRS`].concat(queueShow());
    }
    if (cmd === 'QR') { if (!a.queue) return ['NOT IN QUEUE']; return queueNext(true); }
    if (cmd === 'QXI' || cmd === 'QXE') {
      if (!a.queue) return ['NOT IN QUEUE'];
      a.queue = null; a.pnr = null; a.orig = null; return ['OFF QUEUE'];
    }
    return ['FORMAT'];
  }
  function queueShow() {
    const a = area();
    const list = DB.queues[a.queue.q];
    while (a.queue.pos < list.length && !DB.pnrs[list[a.queue.pos]]) list.splice(a.queue.pos, 1);
    if (a.queue.pos >= list.length) { const q = a.queue.q; a.queue = null; a.pnr = null; saveDB(); return [`END OF QUEUE ${q} - OFF QUEUE`]; }
    const p = retrieve(list[a.queue.pos]);
    return renderPNR(p, null, S.agent);
  }
  function queueNext(remove) {
    const a = area();
    const list = DB.queues[a.queue.q];
    if (remove) list.splice(a.queue.pos, 1); else a.queue.pos++;
    saveDB();
    a.pnr = null;
    return queueShow();
  }

  function cmdDivide(n) {
    const a = area(), pnr = a.pnr;
    if (!pnr || !pnr.locator) return ['DIVIDE REQUIRES A RETRIEVED PNR'];
    if (paxCount(pnr) < 2) return ['CANNOT DIVIDE - ONLY ONE PASSENGER'];
    const idx = findName(pnr, n.includes('.') ? n : `${n}.1`);
    if (idx < 0) return ['NAME NUMBER NOT IN PNR'];
    const np = clone(pnr);
    np.locator = newLocator();
    np.names = [pnr.names[idx]];
    np.names[0].newGroup = false;
    np.segs.forEach((s) => { if (s.type === 'AIR') s.qty = 1; });
    np.tickets = np.tickets.filter((t) => t.name === `${pnr.names[idx].last}/${pnr.names[idx].first}`);
    np.seats = []; np.pq = []; np.queuePlace = []; delete np._pend;
    np.stamp = nowStamp();
    np.history = [{ stamp: np.stamp, by: 'DIVIDE', agent: S.agent.id, items: ['DIVIDED FROM ' + pnr.locator] }];
    pnr.names.splice(idx, 1);
    pnr.segs.forEach((s) => { if (s.type === 'AIR') s.qty = Math.max(1, s.qty - 1); });
    pnr.seats = pnr.seats.filter((x) => x.nameIdx !== idx);
    pnr.history.push({ stamp: np.stamp, by: 'DIVIDE', agent: S.agent.id, items: ['DIVIDED TO ' + np.locator] });
    delete pnr._pend;
    DB.pnrs[np.locator] = np;
    DB.pnrs[pnr.locator] = clone(pnr);
    saveDB();
    a.orig = clone(pnr);
    return [`DIVIDED - NEW PNR ${np.locator}`, `ORIGINAL PNR ${pnr.locator} UPDATED`];
  }

  function cmdHistory() {
    const pnr = area().pnr;
    if (!pnr) return ['NO PNR PRESENT'];
    const o = [`HISTORY ${pnr.locator || 'NEW PNR'}`];
    for (const h of pnr.history) {
      o.push(`RCVD-${h.by}  ${S.agent.pcc}.${S.agent.pcc}*A${String(h.agent).slice(-2)} ${h.stamp}`);
      h.items.forEach((x) => o.push('   ' + x));
    }
    if (pnr._pend && pnr._pend.length) { o.push('PENDING CHANGES (NOT ENDED):'); pnr._pend.forEach((x) => o.push('   ' + x)); }
    if (o.length === 1) o.push('NO HISTORY');
    return o;
  }

  function cmdPQDisplay() {
    const pnr = area().pnr;
    if (!pnr || !pnr.pq.length) return ['NO PQ RECORD'];
    const o = [];
    for (const q of pnr.pq) {
      o.push(`PQ ${q.n}  ${q.status}  CREATED ${q.date || ''}  VALIDATING ${q.validating}`);
      q.lines.forEach((l) => o.push(`   ${l.ptc}-${String(l.n).padStart(2, '0')}  BASE USD${money(l.base)}  TAX ${money(l.tax)}  TOTAL USD${money(l.total)}`));
      (q.comps || []).forEach((c) => o.push(`   ${pad(c.seg, 26)} ${pad(c.fb, 12)} ${money(c.fare)}`));
      o.push(`   GRAND TOTAL USD${money(q.total)}`);
    }
    return o;
  }

  function cmdVI() {
    const pnr = area().pnr;
    if (!pnr) return ['NO PNR PRESENT'];
    const air = pnr.segs.filter((s) => s.type === 'AIR');
    if (!air.length) return ['NO ITIN'];
    const o = ['FLT   DATE  SEG    DPTR  ARVL   MLS  EQP  ELPD  MILES  SM'];
    pnr.segs.forEach((s, i) => {
      if (s.type !== 'AIR') return;
      o.push(`${lpad(i + 1, 2)} ${s.carrier}${lpad(s.flight, 4)} ${ddmmm(s.date)} ${s.orig}${s.dest} ${lpad(fmtTime(s.dep), 5)} ${lpad(fmtTime(s.arr), 5)}  ${s.meal}    ${s.equip}  ${durTxt(s.dur || legDuration(s.orig, s.dest))} ${lpad(Math.round(distKm(s.orig, s.dest) * 0.621), 5)}  N`);
    });
    const tot = air.reduce((x, s) => x + distKm(s.orig, s.dest), 0);
    o.push(`TOTAL MILES ${Math.round(tot * 0.621)}  TOTAL FLYING TIME ${durTxt(air.reduce((x, s) => x + (s.dur || legDuration(s.orig, s.dest)), 0))}`);
    return o;
  }

  function cmdNameSearch(q) {
    const a = area();
    const res = Object.values(DB.pnrs).filter((p) => p.names.some((n) => (n.last + '/' + n.first).startsWith(q)));
    if (!res.length) return ['NO NAMES'];
    if (res.length === 1) return renderPNR(retrieve(res[0].locator), null, S.agent);
    a.names = res.map((p) => p.locator);
    const o = ['SIMILAR NAME LIST'];
    res.forEach((p, i) => {
      const s = p.segs.find((x) => x.type === 'AIR');
      o.push(`${lpad(i + 1, 3)}  ${pad(p.names[0].last + '/' + p.names[0].first, 24)} ${s ? ddmmm(s.date) + ' ' + s.carrier + s.flight + ' ' + s.orig + s.dest : 'NO ITIN'.padEnd(18)}  ${p.locator}`);
    });
    o.push('*{LINEA} PARA SELECCIONAR');
    return o;
  }

  // ---------------------------------------------------------------- despachador
  function execOne(c) {
    const a = area();
    let m;
    if (c === '') return [];
    if ((m = /^SI\*?([A-Z0-9]{2,8})?$/.exec(c))) {
      if (!m[1]) return [S.signedIn ? `AGENT ${S.agent.id} SIGNED IN AT ${S.agent.pcc} AREA ${S.area}` : 'NOT SIGNED - USE SI*NUMERO'];
      S.signedIn = true; S.agent.id = m[1];
      return [`${S.agent.pcc}.${S.agent.pcc}*A${m[1].slice(-2)}.A`, `SIGN IN COMPLETE  ${nowStamp()}`, 'AGENCY PCC ' + S.agent.pcc + ' - SIMULADOR EDUCATIVO', 'COLAS: SIN MENSAJES NUEVOS - USE QC/'];
    }
    if (/^HELP/.test(c) || /^F\*/.test(c)) {
      const t = c.replace(/^(HELP|F\*)\s*/, '');
      return HELP[t] || HELP[''];
    }
    if (!S.signedIn) return ['SIGN IN A', 'USE SI*1234 PARA INICIAR SESION'];
    if (/^SO\*?$/.test(c)) {
      if (hasWork() && a.pnr._pend && a.pnr._pend.length) return ['FINISH OR IGNORE PNR BEFORE SIGN OUT'];
      S.signedIn = false; S.areas = {}; return [`${S.agent.id} SIGNED OUT ${nowStamp()}`];
    }
    // disponibilidad
    if (c === '1*') return cmdAvail(null, true);
    if ((m = /^1R(\d{1,2}[A-Z]{3})?(\d{1,4}[APNM]?)?$/.exec(c))) {
      if (!a.availParams) return ['NO PREVIOUS AVAILABILITY'];
      return cmdAvail({ o: a.availParams.dc, d: a.availParams.oc, date: m[1] || ddmmm(addDays(a.availParams.date, 7)), time: m[2], c: a.availParams.c });
    }
    if ((m = /^1(\d{1,2}[A-Z]{3})?([A-Z]{3})([A-Z]{3})(\d{1,4}[APNM]?)?(?:[‡¥]([A-Z0-9]{2}))?$/.exec(c))) return cmdAvail({ date: m[1], o: m[2], d: m[3], time: m[4], c: m[5] });
    if ((m = /^2([A-Z0-9]{2})(\d{1,4})(?:\/(\d{1,2}[A-Z]{3}))?$/.exec(c))) return cmdFlightInfo(m[1], m[2], m[3]);
    if ((m = /^S\*([A-Z]{3})([A-Z]{3})(?:\/(\d{1,2}[A-Z]{3}))?$/.exec(c))) return cmdTimetable(m[1], m[2], m[3]);
    if (c === 'VI*') return cmdVI();
    // venta
    if ((m = /^0(\d)((?:[A-Z]\d{1,2})+)(LL)?$/.exec(c))) return cmdSellAvail(+m[1], m[2], !!m[3]);
    if (c === '0A' || c === '0ARNK') { work().segs.push({ type: 'ARNK' }); hist(work(), 'AS', 'ARNK'); return [segLine({ type: 'ARNK' }, work().segs.length - 1)]; }
    if ((m = /^0H(\d+)$/.exec(c))) return cmdHotelSell(+m[1]);
    if ((m = /^0C(\d+)$/.exec(c))) return cmdCarSell(+m[1]);
    if ((m = /^0OTH([A-Z0-9]{2})GK1([A-Z]{3})(\d{1,2}[A-Z]{3})-(.+)$/.exec(c))) {
      const d = parseDate(m[3]); if (!d) return ['INVALID DATE'];
      const seg = { type: 'OTH', carrier: m[1], status: 'GK', qty: 1, city: m[2], date: d, text: m[4], dep: 0 };
      work().segs.push(seg); sortSegs(work()); hist(work(), 'AS', 'OTH ' + m[4]);
      return [segLine(seg, work().segs.indexOf(seg))];
    }
    if ((m = /^0([A-Z0-9]{2})(\d{1,4})([A-Z])(\d{1,2}[A-Z]{3})([A-Z]{3})([A-Z]{3})(NN|LL|GK)(\d)$/.exec(c))) return cmdDirectSell(m);
    // campos del PNR
    if (c.startsWith('-')) return cmdName(c.slice(1));
    if (c.startsWith('9')) return cmdPhone(c.slice(1));
    if (c.startsWith('7')) return cmdTicketing(c.slice(1));
    if (c.startsWith('6')) { if (c.length < 2) return ['FORMAT - 6NOMBRE']; work().received = c.slice(1); return ['*']; }
    if ((m = /^PE‡(.+?)‡?$/.exec(c))) {
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/.test(m[1])) return ['INVALID EMAIL FORMAT'];
      work().emails.push(m[1]); hist(work(), 'APE', m[1]); return ['*'];
    }
    if ((m = /^W-(.+)$/.exec(c))) { work().address = m[1].replace(/‡/g, ' / '); hist(work(), 'AW', m[1]); return ['*']; }
    if ((m = /^FF([A-Z0-9]{2})([A-Z0-9]{4,})(?:-(\d\.\d))?$/.exec(c))) {
      const pnr = work();
      if (!D.AIRLINES[m[1]]) return ['INVALID CARRIER'];
      const ref = m[3] || '1.1';
      if (findName(pnr, ref) < 0) return ['NAME NUMBER NOT IN PNR'];
      pnr.ff.push(`${m[1]} ${m[2]} ${ref}`); hist(pnr, 'AFF', m[1] + m[2]);
      return [`${m[1]} ${m[2]} - ${pnr.names[findName(pnr, ref)].last} - STATUS GOLD (SIMULADO)`];
    }
    if ((m = /^DK(\w+)$/.exec(c))) { work().dk = m[1]; hist(work(), 'ADK', m[1]); return ['*']; }
    if (c.startsWith('5')) return cmdRemark(c.slice(1));
    if (c.startsWith('3')) return cmdSSR(c.slice(1));
    if (c.startsWith('4G')) return cmdSeat(c.slice(1));
    // despliegue
    const disp = { '*R': null, '*A': 'A', '*': null, '*I': 'I', '*IA': 'I', '*N': 'N', '*P9': '9', '*T': 'T', '*P3': '3', '*P5': '5', '*B': 'B', '*FF': 'FF', '*PE': 'PE', '*P6': '6', '*W': 'W' };
    if (c in disp) {
      if (!a.pnr) return ['NO PNR PRESENT'];
      return renderPNR(a.pnr, disp[c], S.agent);
    }
    if (c === '*H') return cmdHistory();
    if (c === '*PQ') return cmdPQDisplay();
    if ((m = /^PQD-?(ALL|\d+)$/.exec(c))) {
      const pnr = a.pnr; if (!pnr || !pnr.pq.length) return ['NO PQ RECORD'];
      if (m[1] === 'ALL') pnr.pq = pnr.pq.filter((q) => q.status === 'TICKETED');
      else pnr.pq = pnr.pq.filter((q) => q.n !== +m[1] || q.status === 'TICKETED');
      hist(pnr, 'XPQ', m[1]); return ['PQ DELETED'];
    }
    if ((m = /^\*-([A-Z/ ]+)$/.exec(c))) return cmdNameSearch(m[1]);
    if ((m = /^\*(\d{1,2})$/.exec(c))) {
      if (!a.names || !a.names[+m[1] - 1]) return ['INVALID LINE NUMBER'];
      return renderPNR(retrieve(a.names[+m[1] - 1]), null, S.agent);
    }
    if ((m = /^\*([A-Z]{6})$/.exec(c))) {
      if (a.pnr && a.pnr._pend && a.pnr._pend.length) return ['FINISH OR IGNORE CURRENT PNR - USE E OR I'];
      const p = retrieve(m[1]);
      if (!p) return ['NO RECORD - ' + m[1], 'SECURED PNR OR INVALID LOCATOR'];
      return renderPNR(p, null, S.agent);
    }
    // finalizar / ignorar
    if (['E', 'ER', 'EW', 'EC'].includes(c)) return cmdEnd(c);
    if (c === 'I' || c === 'IR') {
      if (a.queue && c === 'I') return queueNext(false);
      const loc = a.pnr && a.pnr.locator;
      a.pnr = null; a.orig = null; a.warned = false;
      if (c === 'IR' && loc) return ['IGD'].concat(renderPNR(retrieve(loc), null, S.agent));
      return ['IGD'];
    }
    if ((m = /^X(I|\d+(?:[-\/]\d+)*)$/.exec(c))) return cmdCancel(m[1]);
    if ((m = /^\.(\d+)([A-Z]{2})$/.exec(c))) {
      const s = work().segs[+m[1] - 1];
      if (!s || s.type === 'ARNK') return ['INVALID SEGMENT NUMBER'];
      if (!['HK', 'KK', 'TK', 'UN', 'UC', 'HX', 'NO', 'GK', 'SS', 'LL', 'HL'].includes(m[2])) return ['INVALID STATUS CODE'];
      hist(work(), 'CS', `${m[1]} ${s.status}->${m[2]}`);
      s.status = m[2];
      return [segLine(s, +m[1] - 1)];
    }
    if ((m = /^D(\d(?:\.\d)?)$/.exec(c))) return cmdDivide(m[1]);
    // tarifas
    if ((m = /^WP(.*)$/.exec(c)) && !c.startsWith('W‡')) return cmdPrice(m[1]);
    if ((m = /^FQ([A-Z]{3})([A-Z]{3})(\d{1,2}[A-Z]{3})?(?:‡([A-Z0-9]{2}))?$/.exec(c))) return cmdFQ(m);
    if ((m = /^RD(\d+)/.exec(c))) return cmdRD(+m[1]);
    if ((m = /^DC‡?(.*)$/.exec(c))) return cmdDC(m[1]);
    // boletos
    if ((m = /^W‡(.*)$/.exec(c))) return cmdTicket(m[1]);
    if ((m = /^WETR(?:\*(\d+))?$/.exec(c))) return cmdWETR(m[1]);
    if ((m = /^WV(\d+)$/.exec(c))) return cmdVoidRefund('V', +m[1]);
    if ((m = /^WFR(\d+)$/.exec(c))) return cmdVoidRefund('R', +m[1]);
    // codificar
    if ((m = /^W\/\*([A-Z0-9]{2,3})$/.exec(c))) return decode(m[1]);
    if ((m = /^W\/-(CC|AP|AL)(.+)$/.exec(c))) return encode(m[1], m[2]);
    if ((m = /^W\/EQ\*?(\w{3})$/.exec(c))) return D.EQUIPMENT[m[1]] ? [`${m[1]}  ${D.EQUIPMENT[m[1]][0]}`, `     ${NARROW.includes(m[1]) ? 'NARROWBODY' : 'WIDEBODY'} JET`] : ['EQUIPMENT NOT FOUND'];
    if ((m = /^T‡(.+)$/.exec(c))) return cmdTime(m[1]);
    // hoteles/autos
    if ((m = /^HOT([A-Z]{3})\/(\d{1,2}[A-Z]{3})-(\d{1,2}[A-Z]{3})(\d)?$/.exec(c))) return cmdHotel(m);
    if ((m = /^HOD(\d+)$/.exec(c))) return cmdHOD(+m[1]);
    if ((m = /^CF([A-Z]{3})\/(\d{1,2}[A-Z]{3})-(\d{1,2}[A-Z]{3})(?:\/(\d{4})-(\d{4}))?$/.exec(c))) return cmdCar(m);
    // colas
    if (/^Q/.test(c)) return cmdQueue(c);
    return ['FORMAT', '¿COMANDO NO RECONOCIDO? ESCRIBA HELP'];
  }

  // Normaliza el teclado: \ -> ‡, [ -> ¤, ] -> § ; ¥ se trata como ‡
  function normalize(raw) {
    return raw.toUpperCase().replace(/\\/g, '‡').replace(/\[/g, '¤').replace(/\]/g, '§').replace(/¥/g, '‡').trim();
  }

  function exec(raw) {
    const input = normalize(raw);
    if (['MD', 'MU', 'MT', 'MB'].includes(input)) return { scroll: input, lines: [] };
    if (input === 'CLEAR' || input === 'CL') return { clear: true, lines: [] };
    const parts = input.split('§').map((x) => x.trim()).filter(Boolean);
    let lines = [];
    for (const p of parts) {
      let r;
      try { r = execOne(p); } catch (e) { console.error(e); r = ['SYSTEM ERROR - ' + e.message]; }
      lines = lines.concat(r);
      if (r.length === 1 && /^(FORMAT|NEED|INVALID|NO |UNABLE|CHECK|VERIFY)/.test(r[0]) && parts.length > 1) break;
    }
    return { lines, input };
  }

  function setArea(x) { S.area = x; area(); }
  function snapshot() {
    const a = area();
    return { signedIn: S.signedIn, agent: S.agent, area: S.area, pnr: a.pnr, queue: a.queue, inQueueCount: Object.values(DB.queues).reduce((s, x) => s + x.length, 0), pnrCount: Object.keys(DB.pnrs).length };
  }
  function resetDB() { localStorage.removeItem(DBKEY); loadDB(); S.areas = {}; }
  function listPNRs() { return Object.values(DB.pnrs); }

  G.SabreEngine = { exec, setArea, snapshot, resetDB, listPNRs, normalize, segLine, ddmmm, fmtTime, D };
})(window);
