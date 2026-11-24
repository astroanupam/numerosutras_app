/* NUMEROSUTRAS – interface (engine, transit analyser, files, report, about) */
'use strict';
const KEY = 'numerosutras.v1', VERSION = '1.0.2';
const SAMPLE = {fn: 'Narendra', mn: '', ln: 'Modi', full: 'Narendra Modi', dob: '1950-09-17', g: 'm'};
const DEF = {
  lang: '', theme: 'auto', fs: 100, page: 'engine', view: 'dash', ttab: 'cur', setOpen: 0,
  P: {fn: '', mn: '', ln: '', full: '', dob: '', g: 'm'},
  o: {yv: 'n', lp: 'comp', vs: 'ch', py: 'cal', ly: 'full', ld: 'n', kua: 'n', gl: 'loshu', ftab: 'der', cmpm: 'qual'},
  on: {py: 1, ch: 1, ve: 1, ls: 1, kb: 1}, mth: 'custom', ref: 'all', qry: 'lp', he: '', alts: '', biz: '', bizDate: '', cdate: '',
  B: {name: '', dob: '', g: 'f'}, rel: 'marriage', opt: {name: '', sys: 'ch', tr: '', tc: ''},
  tr: {target: '', comp: 'red', mon: 'raw', master: 'n', bound: 'cal', leap: '28'},
  rp: {title: '', by: '', note: '', disc: '', sec: {sum: 1, py: 1, ch: 1, ve: 1, ls: 1, cy: 1, kb: 0, word: 1, disc: 1}},
  profiles: [], fq: '', ff: '', editId: '', ed: {}
};
const PRESETS = {
  western: {yv: 'n', lp: 'comp', vs: 'py', py: 'cal', ly: 'full', ld: 'n', kua: 'n', ftab: 'der', cmpm: 'qual', gl: 'loshu'},
  indian: {yv: 'n', lp: 'comp', vs: 'ch', py: 'cal', ly: 'full', ld: 'vedic', kua: 'n', ftab: 'der', cmpm: 'qual', gl: 'vedic'},
  supplied: {yv: 'n', lp: 'comp', vs: 'ch', py: 'cal', ly: 'full', ld: 'vedic', kua: 'y', ftab: 'sup', cmpm: 'sup', gl: 'loshu'},
  digits: {yv: 'n', lp: 'all', vs: 'py', py: 'cal', ly: 'full', ld: 'n', kua: 'n', ftab: 'der', cmpm: 'qual', gl: 'loshu'}
};
const PAGES = ['engine', 'transit', 'files', 'report', 'about'];
const VIEWS = {overview: ['dash', 'query'], streams: ['py', 'ch', 've', 'ls', 'kb'], analysis: ['names', 'cycles', 'compat', 'biz'], reference: ['rules', 'audit']};
const QUERIES = ['lp', 'name', 'vedic', 'chal', 'lsmiss', 'lsarrow', 'karmic', 'cycle', 'pin', 'same', 'sens', 'src', 'heb', 'pending'];
const REFS = ['all', 'py', 'ch', 've', 'ls', 'kb', 'in', 'cm', 'nm', 'supplied', 'pending', 'disputed', 'std'];
const TTABS = ['cur', 'month', 'day', 'nine', 'cal', 'audit'];
const CTX = ['marriage', 'business', 'friendship', 'family'];
const STREAMS = ['py', 'ch', 've', 'ls', 'kb'];

/* ---------- state ---------- */
const merge = (d, s) => { const o = Array.isArray(d) ? [] : {}; for (const k in d) o[k] = (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) ? merge(d[k], (s && s[k]) || {}) : (s && s[k] !== undefined ? s[k] : d[k]); return o; };
let S = (() => { let s = {}; try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {} return merge(DEF, s); })();
if (!S.lang) { const n = (navigator.language || 'en').slice(0, 2); S.lang = I18N[n] ? n : 'en'; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const setK = (k, v) => { const p = k.split('.'); let o = S; while (p.length > 1) o = o[p.shift()]; o[p[0]] = v; };
const getK = k => k.split('.').reduce((o, p) => o && o[p], S);
let SHOWW = true, deferredInstall = null;

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
function t(k, ...a) { let s = (I18N[S.lang] && I18N[S.lang][k]) ?? I18N.en[k] ?? k; a.forEach((v, i) => s = s.replace('{' + i + '}', v)); return s; }
function c(sec, k) { const l = CONTENT[S.lang] || {}; return (l[sec] && l[sec][k]) ?? (CONTENT.en[sec] || {})[k]; }
const loc = () => S.lang === 'ar' ? 'ar-u-nu-latn' : S.lang;
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const iso = (y, m, d) => String(y).padStart(4, '0') + '-' + pad(m) + '-' + pad(d);
function fmtDate(s) { const D = NE.date(s); if (!D) return '–'; try { return new Intl.DateTimeFormat(loc(), {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(Date.UTC(D.y, D.mo - 1, D.d))); } catch (e) { return s; } }
function monthName(m, f) { try { return new Intl.DateTimeFormat(loc(), {month: f || 'long', timeZone: 'UTC'}).format(new Date(Date.UTC(2024, m - 1, 1))); } catch (e) { return String(m); } }
const L = a => a && a.length ? a.join(', ') : '–';
const fmtRed = r => '⁦' + r.chain.join(' → ') + '⁩' + (r.master ? ' (' + t('master') + ')' : '');
const sel = (k, opts, cur, extra) => `<select data-k="${k}" ${extra || ''}>${opts.map(o => `<option value="${esc(o[0])}"${String(o[0]) === String(cur) ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
const inp = (k, v, type, ph, extra) => `<input data-k="${k}" type="${type || 'text'}" value="${esc(v)}" placeholder="${esc(ph || '')}" ${extra || ''}>`;
const field = (label, ctl, cls) => `<label class="fld ${cls || ''}"><span>${label}</span>${ctl}</label>`;
const card = (body, cls) => `<section class="card ${cls || ''}">${body}</section>`;
const stat = (label, big, sub, det) => `<div class="stat"><span class="lbl">${label}</span><b class="big">${big}</b><span class="sub">${sub || ''}</span>${det ? `<details><summary>${t('calculation')}</summary><div class="calc">${det}</div></details>` : ''}</div>`;
const tbl = (heads, rows, cls) => `<div class="tw"><table class="${cls || ''}"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${(r.c || r).map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const kv = rows => `<div class="tw"><table class="kv"><tbody>${rows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table></div>`;
const note = s => `<p class="muted small">${s}</p>`;
const W = html => SHOWW ? html : '';
const relTag = k => `<span class="rel rel-${k}">${t('rel_' + k)}</span>`;
const planet = n => t('pl' + NE.root(n));
const core = n => { const x = c('core', n); return x ? `<b>${n} · ${x[0]}</b> – ${x[1]}` : `${n}: ${t('no_wording')}`; };
const intNote = () => note(t('int_note'));
const person = () => { const P = S.P; return {fn: P.fn, mn: P.mn, ln: P.ln, full: P.full || [P.fn, P.mn, P.ln].filter(Boolean).join(' '), dob: P.dob}; };
const opts = () => Object.assign({}, S.o, {g: S.P.g});
const lineName = l => t('lt_' + l.type) + ' ' + l.nums.join('-');
const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type: type || 'application/json'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };

/* ---------- computation ---------- */
function compute() {
  const P = person(), o = opts(), ref = S.cdate || today();
  return {P, o, ref, D: NE.date(P.dob), hasName: NE.norm(P.full).letters.length > 0, py: NE.pyth(P, o), ch: NE.chal(P), ve: NE.vedic(P, o), ls: NE.loshu(P, o), cy: NE.cycle(P.dob, o, ref), stage: NE.stages(P, o, ref), kb: NE.heb(S.he)};
}
function rows(R) {
  const r = [], on = S.on, {py, ch, ve, ls, cy, kb} = R, N = R.hasName, D = R.D;
  const add = (id, calc, stream, res, trail, rule, st) => r.push({id, calc, stream, res, trail, rule, st});
  if (on.py) {
    if (D) {
      const all = S.o.lp === 'all', alt = all ? py.lpC : py.lpA;
      add('lp', t('lifepath'), 'py', py.lp.red.n, (all ? t('lp_all') : t('lp_comp')) + ': ' + fmtRed(py.lp.red), all ? 'NUM_PY_004' : 'NUM_PY_003', 'variant');
      add('lpalt', t('lifepath') + ' – ' + (all ? t('lp_comp') : t('lp_all')), 'py', alt.red.n, fmtRed(alt.red), all ? 'NUM_PY_003' : 'NUM_PY_004', 'variant');
    }
    if (N) { add('exp', t('expression'), 'py', py.exp.red.n, fmtRed(py.exp.red), 'NUM_PY_005', 'std'); add('soul', t('soul'), 'py', py.soul.red.n, fmtRed(py.soul.red), 'NUM_PY_005', 'std'); add('pers', t('personality'), 'py', py.pers.red.n, fmtRed(py.pers.red), 'NUM_PY_005', 'std'); }
    if (D) add('karmic', t('karmic'), 'py', py.karmic.length ? py.karmic.join(', ') : t('none'), t('karmic_note'), 'NUM_PY_007', 'std');
    if (R.stage && R.stage.cur) add('pin', t('pin_now'), 'py', R.stage.cur.pin.n + ' / ' + R.stage.cur.chal, t('age') + ' ' + R.stage.age, 'NUM_PY_008', 'disputed');
    if (cy) add('cyc', t('pyear') + ' / ' + t('pmonth') + ' / ' + t('pday'), 'py', cy.py.n + ' / ' + cy.pm.n + ' / ' + cy.pd.n, fmtDate(R.ref) + ' · ' + cy.raw + ' → ' + cy.py.n, 'NUM_PY_009', 'config');
  }
  if (on.ch) {
    if (N) add('chn', t('ch_name'), 'ch', ch.name.total + ' / ' + ch.name.red.n, fmtRed(ch.name.red), 'NUM_CH_002', 'std');
    if (D) add('chb', t('ch_birth'), 'ch', ch.birth.red.n + ' / ' + ch.dest.red.n, t('day') + ' ' + ch.birth.raw + '; ' + fmtRed(ch.dest.red), 'NUM_CH_001', 'std');
  }
  if (on.ve) {
    if (D) { add('mul', t('mulank'), 've', ve.mul.n + ' (' + planet(ve.mul.n) + ')', fmtRed(ve.mul), 'NUM_VE_001', 'std'); add('bha', t('bhagyank'), 've', ve.bha.red.n + ' (' + planet(ve.bha.red.n) + ')', fmtRed(ve.bha.red), 'NUM_VE_001', 'std'); }
    if (N) add('nam', t('namank'), 've', ve.nam.red.n + ' (' + planet(ve.nam.red.n) + ')', fmtRed(ve.nam.red) + ' · ' + t('st_' + ve.nam.sys), 'NUM_VE_003', 'variant');
  }
  if (on.ls && ls) {
    add('lsm', t('ls_missing'), 'ls', L(ls.missing), t('ls_digits') + ' ' + ls.used.join(' '), 'NUM_LS_002', 'config');
    add('lsr', t('ls_repeated'), 'ls', ls.repeated.map(n => n + ' ×' + ls.cnt[n]).join(', ') || '–', '', 'NUM_LS_002', 'config');
    add('lss', t('ls_single'), 'ls', L(ls.single), '', 'NUM_LS_002', 'config');
    add('lsc', t('ls_complete'), 'ls', ls.lines.filter(l => l.full).map(lineName).join(', ') || t('none'), '', 'NUM_LS_003', 'std');
    add('lse', t('ls_empty'), 'ls', ls.lines.filter(l => l.empty).map(lineName).join(', ') || t('none'), '', 'NUM_LS_003', 'std');
  }
  if (on.kb && kb.items.length) {
    add('kbh', 'Mispar Hechrechi', 'kb', kb.hech, fmtRed(kb.hechRed), 'NUM_KB_001', 'std');
    add('kbg', 'Mispar Gadol', 'kb', kb.gad, fmtRed(kb.gadRed), 'NUM_KB_002', 'std');
    add('kbk', 'Mispar Katan', 'kb', kb.kat, fmtRed(kb.katRed), 'NUM_KB_003', 'std');
  }
  return r;
}
const rowsTable = list => tbl([t('calc_h'), t('stream_h'), t('result_h'), t('trail_h'), t('rule_h'), t('status_h')], list.length ? list.map(x => [esc(x.calc), t('st_' + x.stream), `<b>${esc(x.res)}</b>`, `<span class="muted">${esc(x.trail)}</span>`, `<code>${x.rule}</code>`, t('rs_' + x.st)]) : [[`<span class="muted">${t('enter_both')}</span>`, '', '', '', '', '']]);
function same(R) {
  const g = {}, on = S.on, {py, ch, ve} = R, put = (l, n) => (g[n] = g[n] || []).push(l);
  if (on.py) { if (R.D) put(t('lifepath'), py.lp.red.n); if (R.hasName) { put(t('expression'), py.exp.red.n); put(t('soul'), py.soul.red.n); put(t('personality'), py.pers.red.n); } }
  if (on.ch) { if (R.hasName) put(t('ch_name'), ch.name.red.n); if (R.D) { put(t('ch_birthn'), ch.birth.red.n); put(t('ch_dest'), ch.dest.red.n); } }
  if (on.ve) { if (R.D) { put(t('mulank'), ve.mul.n); put(t('bhagyank'), ve.bha.red.n); } if (R.hasName) put(t('namank'), ve.nam.red.n); }
  return Object.keys(g).filter(n => g[n].length > 1).map(n => `<b>${n}</b> (${g[n].join(', ')})`);
}
function sens(R) {
  const P = R.P, o = R.o, out = [], alt = ch => Object.assign({}, o, ch);
  if (R.D && NE.pyth(P, alt({lp: o.lp === 'all' ? 'comp' : 'all'})).lp.red.n !== R.py.lp.red.n) out.push(t('lifepath'));
  if (R.hasName) {
    const y = NE.pyth(P, alt({yv: o.yv === 'y' ? 'n' : 'y'}));
    if (y.soul.red.n !== R.py.soul.red.n || y.pers.red.n !== R.py.pers.red.n) out.push(t('soul') + ' / ' + t('personality'));
    if (NE.vedic(P, alt({vs: o.vs === 'py' ? 'ch' : 'py'})).nam.red.n !== R.ve.nam.red.n) out.push(t('namank'));
  }
  if (R.ls) { const a = NE.loshu(P, alt({ld: o.ld === 'n' ? 'y' : 'n'})), b = NE.loshu(P, alt({ly: o.ly === 'two' ? 'full' : 'two'})); if (a.missing.join() !== R.ls.missing.join() || b.missing.join() !== R.ls.missing.join()) out.push(t('ls_missing')); }
  return out;
}

/* ---------- engine views ---------- */
const offCard = () => card(`<p class="muted">${t('stream_off')}</p>`);
function warn(R) {
  const w = [];
  if (!R.hasName) w.push(t('w_name')); if (!R.D) w.push(t('w_dob'));
  if (NE.norm(R.P.full).foreign) w.push(t('w_script'));
  return w.length ? card('<ul>' + w.map(x => `<li>${x}</li>`).join('') + '</ul>', 'warn') : '';
}
function vDash(R) {
  const on = S.on, {py, ch, ve, cy, kb} = R, N = R.hasName, D = R.D, na = `<span class="muted">${t('na')}</span>`;
  const cell = (k, ok, f) => !on[k] ? '–' : ok ? f() : na, x = () => na, K = kb.items.length;
  const rws = [
    [t('r_life'), cell('py', D, () => py.lp.red.n), cell('ch', D, () => ch.birth.red.n + ' · ' + ch.dest.red.n), cell('ve', D, () => ve.mul.n + ' · ' + ve.bha.red.n), x(), x()],
    [t('r_name'), cell('py', N, () => py.exp.red.n), cell('ch', N, () => ch.name.total + ' / ' + ch.name.red.n), cell('ve', N, () => ve.nam.red.n), x(), cell('kb', K, () => kb.hech)],
    [t('r_soul'), cell('py', N, () => py.soul.red.n), cell('ch', N, () => ch.vow.total + ' / ' + ch.vow.red.n), x(), x(), x()],
    [t('personality'), cell('py', N, () => py.pers.red.n), cell('ch', N, () => ch.con.total + ' / ' + ch.con.red.n), x(), x(), x()],
    [t('r_compound'), x(), cell('ch', N, () => ch.name.total), cell('ve', N, () => ve.nam.total), x(), cell('kb', K, () => kb.gad)],
    [t('r_cycle'), cell('py', cy, () => cy.py.n + ' / ' + cy.pm.n + ' / ' + cy.pd.n), x(), x(), x(), x()]
  ].map(r => [`<b>${r[0]}</b>`].concat(r.slice(1)));
  const sm = same(R);
  return card(`<h2>${t('cmp_title')}</h2>` + tbl([t('calc_h')].concat(STREAMS.map(s => t('st_' + s))), rws) + note(t('cmp_note'))) +
    card(`<h2>${t('syn_title')}</h2>` + kv([[t('syn_same'), sm.length ? sm.join('; ') : t('none')], [t('syn_src'), t('syn_src_t')], [t('syn_judge'), t('syn_judge_t')]]) + note(t('disc_short')));
}
function answer(q, R) {
  const all = rows(R), pick = ids => { const l = all.filter(x => ids.includes(x.id)); return l.length ? rowsTable(l) : `<p class="muted">${t('enter_both')}</p>`; };
  const rules = f => rulesTable(RULES.filter(f));
  switch (q) {
    case 'lp': return pick(['lp', 'lpalt']);
    case 'name': return pick(['exp', 'soul', 'pers']);
    case 'vedic': return pick(['mul', 'bha', 'nam']);
    case 'chal': return pick(['chn', 'chb']);
    case 'lsmiss': return pick(['lsm', 'lsr', 'lss']);
    case 'lsarrow': return pick(['lsc', 'lse']);
    case 'karmic': return pick(['karmic']);
    case 'cycle': return pick(['cyc']);
    case 'pin': return pick(['pin']);
    case 'same': { const s = same(R); return `<p>${s.length ? s.join('; ') : t('none')}</p>` + note(t('same_note')); }
    case 'sens': { const s = sens(R); return `<p>${s.length ? s.join(', ') : t('sens_none')}</p>` + note(t('sens_note')); }
    case 'src': return rules(r => r[2] === 'supplied' || r[2] === 'derived');
    case 'heb': return pick(['kbh', 'kbg', 'kbk']);
    case 'pending': return rules(r => r[2] === 'pending' || r[2] === 'derived');
  }
  return '';
}
const vQuery = R => card(`<h2>${t('q_' + S.qry)}</h2>` + answer(S.qry, R));
function vPy(R) {
  if (!S.on.py) return offCard();
  const {py} = R, N = R.hasName, D = R.D, lt = ls => ls.map(l => l + '<sub>' + NE.PY[l] + '</sub>').join(' ');
  let h = '<div class="stats">';
  if (D) {
    h += stat(t('lifepath'), py.lp.red.n, S.o.lp === 'all' ? fmtRed(py.lpA.red) : `${py.lpC.rm.n} + ${py.lpC.rd.n} + ${py.lpC.ry.n} = ${fmtRed(py.lpC.red)}`);
    h += stat(t('birthday'), py.bday.red.n, fmtRed(py.bday.red));
  }
  if (N) {
    h += stat(t('expression'), py.exp.red.n, fmtRed(py.exp.red), lt(NE.norm(R.P.full).letters));
    h += stat(t('soul'), py.soul.red.n, fmtRed(py.soul.red), lt(py.soul.letters));
    h += stat(t('personality'), py.pers.red.n, fmtRed(py.pers.red), lt(py.pers.letters));
    h += stat(t('balance'), py.bal.red.n, py.bal.ini.join(' + ') + ' = ' + py.bal.total);
  }
  if (N && D) h += stat(t('maturity'), py.mat.n, `${py.lp.red.n} + ${py.exp.red.n} = ${fmtRed(py.mat)}`);
  h += '</div>';
  const k = [];
  if (D) k.push([t('karmic'), (py.karmic.length ? py.karmic.join(', ') : t('none')) + ` <span class="muted">(${t('karmic_note')})</span>`]);
  if (N) k.push([t('hidden'), L(py.hidden)], [t('lessons'), L(py.lessons)], [t('nameparts'), py.parts.map(p => `${p.name} ${fmtRed(p.red)}`).join(' · ') || '–']);
  if (N && D) k.push([t('bridge'), `${t('lifepath')} – ${t('expression')}: ${py.bridge.lpExp} · ${t('soul')} – ${t('personality')}: ${py.bridge.soulPers}`]);
  if (k.length) h += card(kv(k));
  if (D && R.stage) {
    h += card(`<h3>${t('pin_title')}</h3>` + tbl([t('stage'), t('ages'), t('years'), t('pinnacle'), t('challenge')], R.stage.list.map(s => ({cls: s.cur ? 'hl' : '', c: [s.i + ' · ' + t('era' + s.i), s.from + ' – ' + (s.to === null ? '…' : s.to), s.y1 + ' – ' + (s.y2 === null ? '…' : s.y2), `<b>${s.pin.n}</b>`, `<b>${s.chal}</b>`]}))) +
      W(R.stage.cur ? `<p class="small">${t('challenge')} ${R.stage.cur.chal}: ${c('chal', R.stage.cur.chal) || ''}</p>` : '') + note(t('pin_note')));
  }
  const w = [];
  if (D) { w.push(t('lifepath') + ' ' + core(py.lp.red.n)); py.karmic.forEach(x => w.push(t('karmic') + ` <b>${x}</b> – ` + c('karmic', x.split('/')[0]))); }
  if (N) w.push(t('expression') + ' ' + core(py.exp.red.n), t('soul') + ' ' + core(py.soul.red.n));
  if (w.length) h += W(card(`<h3>${t('wording')}</h3><ul>${w.map(x => `<li>${x}</li>`).join('')}</ul>` + intNote()));
  return h;
}
function vCh(R) {
  if (!S.on.ch) return offCard();
  const {ch} = R, N = R.hasName, D = R.D; let h = '<div class="stats">';
  if (N) {
    h += stat(t('ch_name') + ` (${t('compound_root')})`, ch.name.total + ' / ' + ch.name.red.n, fmtRed(ch.name.red), NE.norm(R.P.full).letters.map(l => l + '<sub>' + NE.CH[l] + '</sub>').join(' '));
    h += stat(t('vowels'), ch.vow.total + ' / ' + ch.vow.red.n, fmtRed(ch.vow.red)) + stat(t('consonants'), ch.con.total + ' / ' + ch.con.red.n, fmtRed(ch.con.red));
  }
  if (D) h += stat(t('ch_birthn'), ch.birth.raw + ' / ' + ch.birth.red.n, fmtRed(ch.birth.red)) + stat(t('ch_dest'), ch.dest.total + ' / ' + ch.dest.red.n, fmtRed(ch.dest.red));
  h += '</div>';
  if (N) {
    const m = c('comp', ch.name.total), au = NE.AUSP.includes(ch.name.total);
    h += card(kv([[t('nameparts'), ch.parts.map(p => `${p.name} ${p.total} / ${p.red.n}`).join(' · ') || '–'], [t('compound') + ' ' + ch.name.total, (au ? t('ausp_yes') : t('ausp_no')) + W(m ? ' – ' + m : '')]]) + note(t('ch_note')) + W(intNote()));
  }
  return h;
}
function vVe(R) {
  if (!S.on.ve) return offCard();
  const {ve} = R, ft = S.o.ftab; let h = '<div class="stats">';
  if (R.D) h += stat(t('mulank') + ' (मूलांक)', ve.mul.n, planet(ve.mul.n) + ' · ' + fmtRed(ve.mul)) + stat(t('bhagyank') + ' (भाग्यांक)', ve.bha.red.n, planet(ve.bha.red.n) + ' · ' + fmtRed(ve.bha.red));
  if (R.hasName) h += stat(t('namank') + ' (नामांक)', ve.nam.red.n, planet(ve.nam.red.n) + ' · ' + fmtRed(ve.nam.red) + ' · ' + t('st_' + ve.nam.sys));
  h += '</div>';
  const fr = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => { const f = NE.friends(n, ft); return [`<b>${n}</b>`, planet(n), `<span class="muted">${c('sig', n)}</span>`, `<span class="rel-friend">${L(f.friend)}</span>`, L(f.neutral), `<span class="rel-mixed">${L(f.mixed)}</span>`, `<span class="muted">${L(f.pending)}</span>`]; });
  let mine = '';
  if (R.D) mine = `<p><b>${t('ve_mine')}:</b> ` + [...new Set([ve.mul.n, ve.bha.red.n])].map(n => `${n} (${planet(n)}): ${L(NE.friends(n, ft).friend)}`).join(' · ') + '</p>';
  return h + card(`<p class="small">${t('ve_terms')}</p><p class="small">${t('ve_table')}: <b>${t(ft === 'sup' ? 'ft_sup' : 'ft_der')}</b></p>` + tbl([t('no_h'), t('planet'), t('signif'), t('rel_friend'), t('rel_neutral'), t('rel_mixed'), t('rel_pending')], fr) + note(t('ve_note')) + mine);
}
function vLs(R) {
  if (!S.on.ls) return offCard();
  const ls = R.ls; if (!ls) return card(`<p class="muted">${t('w_dob')}</p>`);
  const grid = '<div class="grid9">' + ls.cells.flat().map(n => `<div class="cell${ls.cnt[n] ? ' on' : ''}"><small>${n}</small><b>${ls.cnt[n] ? String(n).repeat(ls.cnt[n]) : '·'}</b></div>`).join('') + '</div>';
  const info = kv([[t('ls_digits'), ls.used.join(' ') + ` <span class="muted">(${t('ls_zero')}; ${t(S.o.ly === 'two' ? 'ly_two' : 'ly_full')})</span>`], [t('ls_missing'), L(ls.missing)], [t('ls_repeated'), ls.repeated.map(n => n + ' ×' + ls.cnt[n]).join(', ') || '–'], [t('ls_single'), L(ls.single)],
    [t('ls_derived'), `${t('mulank')} ${ls.mul}, ${t('bhagyank')} ${ls.bha}, Kua ${ls.kua} – ` + (ls.inj.length ? t('ls_added') + ': ' + ls.inj.map(x => (x[0] === 'kua' ? 'Kua' : t(x[0])) + ' ' + x[1]).join(', ') : t('ls_notadded'))]]);
  const lines = ls.lines.map(l => { const p = l.key ? c('planes', l.key) : null; return {cls: l.full ? 'hl' : '', c: [lineName(l), p ? p[0] : '–', l.pct + '%', `<span class="${l.full ? 'rel-friend' : l.empty ? 'rel-mixed' : ''}">${t(l.full ? 'complete' : l.empty ? 'empty' : 'partial')}</span>`, W(p ? `<span class="muted">${p[1]}</span>` : '')]}; });
  return card(`<div class="lsrow">${grid}<div class="grow">${info}</div></div>` + note(t('ls_layout') + ' ' + ls.cells.map(r => r.join(' ')).join(' / ')) +
    `<h3>${t('ls_arrows')}</h3>` + tbl([t('line_h'), t('plane_h'), t('complete'), t('status_h'), t('meaning_h')], lines) + note(t('ls_note')) + W(intNote()));
}
function kbBody(R) {
  if (!S.on.kb) return offCard();
  const kb = R.kb; if (!kb.items.length) return card(`<p class="muted">${t('kb_enter')}</p>`);
  return `<div class="stats">${stat('Mispar Hechrechi', kb.hech, fmtRed(kb.hechRed))}${stat('Mispar Gadol', kb.gad, fmtRed(kb.gadRed))}${stat('Mispar Katan', kb.kat, fmtRed(kb.katRed))}</div>` +
    card(tbl([t('letter_h'), t('name_h'), 'Hechrechi', 'Gadol', 'Katan'], kb.items.map(i => [`<b class="he">${i.ch}</b>`, i.name, i.reg, i.gad, i.kat])) + (kb.bad.length ? note(t('kb_bad') + ' ' + esc(kb.bad.join(' '))) : ''));
}
function vNames(R) {
  const o = R.o, ft = S.o.ftab, list = [[t('fullname'), R.P.full]].concat(S.alts.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10).map((s, i) => [t('alt') + ' ' + (i + 1), s])).filter(x => NE.norm(x[1]).letters.length);
  const relTo = n => R.D ? relTag(NE.rel(n, R.ve.mul.n, ft)) + ' / ' + relTag(NE.rel(n, R.ve.bha.red.n, ft)) : '–';
  let h = card(`<h2>${t('nm_cmp')}</h2>` + (list.length ? tbl(['', t('name_h'), t('nm_pyexp'), t('nm_chal'), t('namank'), t('nm_rel')], list.map(x => { const P = {fn: '', mn: '', ln: '', full: x[1], dob: ''}, p = NE.pyth(P, o), q = NE.chal(P), v = NE.vedic(P, o); return [x[0], `<b>${esc(x[1])}</b>`, fmtRed(p.exp.red), q.name.total + ' / <b>' + q.name.red.n + '</b>', `<b>${v.nam.red.n}</b> (${planet(v.nam.red.n)})`, relTo(v.nam.red.n)]; })) : `<p class="muted">${t('w_name')}</p>`) + note(t('nm_note')));
  const nm = S.opt.name.trim() || R.P.full;
  if (NE.norm(nm).letters.length) {
    const num = s => String(s || '').split(/[,\s]+/).map(Number).filter(n => Number.isInteger(n) && n > 0), r = NE.optimize(nm, S.opt.sys, num(S.opt.tr), num(S.opt.tc), 12), ch = S.opt.sys === 'ch';
    h += card(`<h2>${t('sx_title')} <code>NUM_NM_001</code></h2><p>${t('sx_current')}: <b>${esc(nm)}</b> = ${r.cur.total} → ${r.cur.root}${ch ? ' · ' + (r.cur.ausp ? t('ausp_yes') : t('ausp_no')) : ''}</p>` +
      (r.list.length ? tbl([t('sx_spelling'), t('compound'), t('root'), t('sx_ausp'), t('nm_rel'), t('wording')], r.list.map(x => [`<b>${esc(x.name)}</b>`, x.total, x.root, ch ? (x.ausp ? t('yes') : t('no')) : '–', relTo(x.root), W(ch ? `<span class="muted">${c('comp', x.total) || ''}</span>` : '')])) : `<p class="muted">${t('sx_none')}</p>`) + note(t('sx_note')));
  }
  return h;
}
function cyclesBody(R) {
  const cy = R.cy; if (!cy) return card(`<p class="muted">${t('w_dob')}</p>`);
  return `<div class="stats">${stat(t('pyear'), cy.py.n, `${cy.rm} + ${cy.rd} + ${cy.ry} (${cy.yr}) = ${fmtRed(cy.py)}`)}${stat(t('pmonth'), cy.pm.n, `${cy.py.n} + ${cy.C.mo} = ${fmtRed(cy.pm)}`)}${stat(t('pday'), cy.pd.n, `${cy.pm.n} + ${cy.C.d} = ${fmtRed(cy.pd)}`)}</div>` +
    card(`<h3>${t('uni_title')}</h3>` + kv([[t('uyear') + ' ' + cy.C.y, fmtRed(cy.uy)], [t('umonth'), `${cy.uy.n} + ${cy.C.mo} = ${fmtRed(cy.um)}`], [t('uday'), `${cy.um.n} + ${cy.C.d} = ${fmtRed(cy.ud)}`]]) +
      `<h3>${t('nine_title')}</h3>` + tbl([t('year'), t('sum_h'), t('pyear'), t('wording')], cy.nine.map((n, i) => ({cls: i === 0 ? 'hl' : '', c: [n.y, n.raw, `<b>${n.n}</b>`, W(`<span class="muted">${c('transits', n.n)}</span>`)]}))) + note(t('cy_note')) + W(intNote()));
}
function vCompat(R) {
  const B = S.B, o = R.o, ft = S.o.ftab, PB = {fn: '', mn: '', ln: '', full: B.name, dob: B.dob};
  if (!NE.date(B.dob) || !R.D) return card(`<p class="muted">${t('cm_need')}</p>`);
  const oB = Object.assign({}, o, {g: B.g}), b = {py: NE.pyth(PB, oB), ve: NE.vedic(PB, oB), ls: NE.loshu(PB, oB)}, nB = NE.norm(B.name).letters.length > 0;
  const pairs = [[t('lifepath'), R.py.lp.red.n, b.py.lp.red.n], [t('mulank'), R.ve.mul.n, b.ve.mul.n], [t('bhagyank'), R.ve.bha.red.n, b.ve.bha.red.n]];
  if (R.hasName && nB) pairs.push([t('expression'), R.py.exp.red.n, b.py.exp.red.n], [t('soul'), R.py.soul.red.n, b.py.soul.red.n], [t('namank'), R.ve.nam.red.n, b.ve.nam.red.n]);
  const mA = R.ls.missing, mB = b.ls.missing;
  let h = card(`<h2>${t('v_compat')} – ${t('ctx_' + S.rel)}</h2>` + tbl([t('calc_h'), esc(R.P.full || 'A'), esc(B.name || 'B'), t('relation')], pairs.map(p => [p[0], `<b>${p[1]}</b>`, `<b>${p[2]}</b>`, relTag(NE.rel(p[1], p[2], ft))])) +
    `<h3>${t('st_ls')}</h3>` + kv([[t('cm_afills'), L(mB.filter(n => !mA.includes(n)))], [t('cm_bfills'), L(mA.filter(n => !mB.includes(n)))], [t('cm_both'), L(mA.filter(n => mB.includes(n)))]]) + note(t('cm_note')));
  if (S.o.cmpm === 'sup') {
    const s = R.hasName && nB ? NE.compatSup(R, b) : null;
    h += card(`<h3>${t('cm_index')} <code>NUM_CM_002</code></h3>` + (s ? kv([[t('lifepath') + ' ×0.4', s.lp], [t('soul') + ' ×0.3', s.su], [t('expression') + ' ×0.2', s.de], [t('personality') + ' ×0.1', s.pe], [t('cm_west') + ' ×0.5', s.west], [t('st_ve') + ' ×0.3', s.ved], [t('st_ls') + ' ×0.2', s.ls], [`<b>${t('cm_overall')}</b>`, `<b>${s.overall}</b> – ${t('tier' + s.tier)}`]]) : `<p class="muted">${t('cm_neednames')}</p>`) + note(t('cm_index_note')), 'warn');
  }
  return h;
}
function vBiz(R) {
  const n = NE.norm(S.biz); if (!n.letters.length) return card(`<p class="muted">${t('bz_enter')}</p>`);
  const P = {fn: '', mn: '', ln: '', full: S.biz, dob: ''}, p = NE.pyth(P, R.o), q = NE.chal(P), ft = S.o.ftab, m = c('comp', q.name.total), k = [];
  k.push([t('nm_pyexp'), fmtRed(p.exp.red)], [t('nm_chal'), q.name.total + ' / <b>' + q.name.red.n + '</b> (' + planet(q.name.red.n) + ')'], [t('compound') + ' ' + q.name.total, (NE.AUSP.includes(q.name.total) ? t('ausp_yes') : t('ausp_no')) + W(m ? ' – ' + m : '')]);
  if (R.D) k.push([t('bz_founder'), `${t('mulank')} ${R.ve.mul.n}: ${relTag(NE.rel(q.name.red.n, R.ve.mul.n, ft))} · ${t('bhagyank')} ${R.ve.bha.red.n}: ${relTag(NE.rel(q.name.red.n, R.ve.bha.red.n, ft))}`]);
  const D = NE.date(S.bizDate);
  if (D) { const mu = NE.root(D.d), bh = NE.red(NE.dateSum(D)); k.push([t('bz_launch'), `${fmtDate(S.bizDate)} – ${t('mulank')} ${mu} (${planet(mu)}), ${t('bhagyank')} ${bh.n} (${planet(bh.n)}); ${t('bz_vsname')}: ${relTag(NE.rel(q.name.red.n, bh.n, ft))}`]); }
  return card(`<h2>${esc(S.biz)}</h2>` + kv(k) + note(t('bz_note')));
}
const rulesTable = list => tbl([t('rule_h'), t('stream_h'), t('rule_text'), t('status_h')], list.map(r => [`<code>${r[0]}</code>`, t('st_' + r[1]), c('rules', r[0]), `<span class="tag tag-${r[2]}">${t('rs_' + r[2])}</span>`]));
function vRules() {
  const f = S.ref, list = RULES.filter(r => f === 'all' || r[1] === f || (f === 'supplied' && r[2] === 'supplied') || (f === 'pending' && (r[2] === 'pending' || r[2] === 'derived')) || (f === 'disputed' && ['disputed', 'variant', 'derived'].includes(r[2])) || (f === 'std' && r[2] === 'std'));
  return card(`<h2>${t('v_rules')} – ${t('ref_' + f)}</h2>` + rulesTable(list) + note(t('src_status')));
}
function vAudit(R) {
  const o = Object.assign({}, DEF.o, {g: 'm'}), p = NE.pyth(SAMPLE, o), q = NE.chal(SAMPLE), v = NE.vedic(SAMPLE, o), l = NE.loshu(SAMPLE, o), cy = NE.cycle(SAMPLE.dob, o, '2026-11-24'), h = NE.heb('שלום');
  const tests = [[t('lifepath'), 5, p.lp.red.n], [t('expression'), 8, p.exp.red.n], [t('soul'), 22, p.soul.red.n], [t('personality'), 4, p.pers.red.n], [t('ch_name'), '41 / 5', q.name.total + ' / ' + q.name.red.n], [t('mulank'), 8, v.mul.n], [t('bhagyank'), 5, v.bha.red.n], [t('ls_missing'), '2, 3, 4, 6, 8', l.missing.join(', ')], ['Kua', 2, l.kua], [t('pyear') + ' 2026-11-24', '9 / 2 / 8', cy.py.n + ' / ' + cy.pm.n + ' / ' + cy.pd.n], ['שלום Hechrechi / Gadol / Katan', '376 / 936 / 16', h.hech + ' / ' + h.gad + ' / ' + h.kat]];
  const n = NE.norm(R.P.full);
  return card(`<h2>${t('au_title')}</h2><p class="small">${t('au_text')}</p>` + tbl([t('calc_h'), t('expected'), t('got'), t('status_h')], tests.map(x => [x[0], x[1], x[2], String(x[1]) === String(x[2]) ? `<span class="rel-friend">✓ ${t('pass')}</span>` : `<span class="rel-mixed">✗ ${t('fail')}</span>`]))) +
    (n.letters.length ? card(`<h3>${t('au_letters')}</h3>` + tbl([t('letter_h'), t('st_py'), t('st_ch')], n.letters.map(x => [`<b>${x}</b>`, NE.PY[x], NE.CH[x]]).concat([[`<b>${t('sum_h')}</b>`, `<b>${NE.sum(n.letters.map(x => NE.PY[x]))}</b>`, `<b>${NE.sum(n.letters.map(x => NE.CH[x]))}</b>`]]))) : '') +
    card(`<h3>${t('settings_now')}</h3><pre>${esc(JSON.stringify(R.o))}</pre>`);
}
function summary(R) {
  const list = rows(R).filter(x => x.id !== 'lpalt'), sm = same(R), se = sens(R);
  return card(`<h2>${t('summary')}</h2>
    <p><b>${t('profile')}:</b> ${esc(R.P.full) || t('no_name')}, ${R.D ? fmtDate(R.P.dob) : t('no_dob')}. <b>${t('methods')}:</b> ${t('mth_' + S.mth)}. ${t('results')}: ${list.length} · ${t('active_streams')}: ${STREAMS.filter(s => S.on[s]).length}.</p>
    <p><b>${t('syn_same')}:</b> ${sm.length ? sm.join('; ') : t('none')}. ${t('same_note')}</p>
    <p><b>${t('method_sensitive')}:</b> ${se.length ? se.join(', ') + '. ' + t('sens_note') : t('sens_none')}</p>
    <p><b>${t('source_status')}:</b> ${t('src_status')}</p>${note(t('disc_short'))}
    <h3>${t('summary_table')}</h3>${rowsTable(list)}
    <p class="btns noprint"><button class="pri" data-act="print">${t('print')}</button><button data-act="json">${t('dl_json')}</button><button data-act="goreport">${t('pg_report')}</button></p>`, 'gold');
}
const VIEWFN = {dash: vDash, query: vQuery, py: vPy, ch: vCh, ve: vVe, ls: vLs, kb: kbBody, names: vNames, cycles: cyclesBody, compat: vCompat, biz: vBiz, rules: vRules, audit: vAudit};

/* per-view input controls (rendered once, never re-rendered while typing) */
function viewCtl() {
  const v = S.view;
  if (v === 'kb') return card(`<h2>${t('kb_title')}</h2><div class="row"><input class="he big-in" data-k="he" dir="rtl" value="${esc(S.he)}" placeholder="שלום"><button data-act="he-clear">${t('clear')}</button></div><div class="hekeys" dir="rtl">${Object.keys(NE.HE).map(ch => `<button data-he="${ch}" title="${NE.HE[ch][0]}">${ch}</button>`).join('')}</div>${note(t('kb_note'))}`);
  if (v === 'names') return card(`<h2>${t('nm_title')}</h2>${note(t('nm_hint'))}<textarea data-k="alts" rows="3" placeholder="Anoop Shukla&#10;Anup Shukla">${esc(S.alts)}</textarea><h3>${t('sx_title')}</h3>${note(t('sx_hint'))}<div class="grid">${field(t('sx_name'), inp('opt.name', S.opt.name, 'text', person().full))}${field(t('system'), sel('opt.sys', [['ch', t('st_ch')], ['py', t('st_py')]], S.opt.sys))}${field(t('sx_roots'), inp('opt.tr', S.opt.tr, 'text', '1, 5, 6'))}${field(t('sx_comps'), inp('opt.tc', S.opt.tc, 'text', '19, 23, 24'))}</div>`);
  if (v === 'cycles') return card(`<div class="grid"><h2 class="grow">${t('cy_title')}</h2>${field(t('ref_date'), inp('cdate', S.cdate || today(), 'date'))}${field(t('s_py'), sel('o.py', [['cal', t('py_cal')], ['bday', t('py_bday')]], S.o.py))}</div>`);
  if (v === 'compat') return card(`<h2>${t('v_compat')}</h2><div class="grid">${field(t('cm_bname'), inp('B.name', S.B.name))}${field(t('dob'), inp('B.dob', S.B.dob, 'date'))}${field(t('sex'), sel('B.g', [['m', t('male')], ['f', t('female')]], S.B.g))}${field(t('context'), sel('rel', CTX.map(k => [k, t('ctx_' + k)]), S.rel))}${field(t('s_cmpm'), sel('o.cmpm', [['qual', t('cmpm_qual')], ['sup', t('cmpm_sup')]], S.o.cmpm))}</div>${profilePick('pickB')}`);
  if (v === 'biz') return card(`<h2>${t('bz_title')}</h2><div class="grid">${field(t('bz_name'), inp('biz', S.biz))}${field(t('bz_date'), inp('bizDate', S.bizDate, 'date'))}</div>`);
  return '';
}
const profilePick = k => S.profiles.length ? `<p class="small">${t('pick_saved')}: ${sel(k, [['', '—']].concat(S.profiles.map(p => [p.id, p.name + ' · ' + p.dob])), '')}</p>` : '';

function engineShell() {
  const o = S.o, P = S.P, s = (k, list) => field(t('s_' + k), sel('o.' + k, list.map(x => [x, t(k + '_' + x)]), o[k]));
  return card(`<h1>${t('eng_title')}</h1><p class="muted">${t('eng_sub')}</p><div class="flow">${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `<span class="chip">${i} ${t('f' + i)}</span>`).join('<i>›</i>')}</div><details><summary>${t('how_title')}</summary><p class="muted small">${t('how_text')}</p></details>`, 'gold noprint') +
    card(`<div class="grid">${field(t('methods'), sel('mth', ['custom', 'western', 'indian', 'supplied', 'digits'].map(k => [k, t('mth_' + k)]), S.mth))}${field(t('reference'), sel('ref', REFS.map(k => [k, t('ref_' + k)]), S.ref))}${field(t('query'), sel('qry', QUERIES.map(k => [k, t('q_' + k)]), S.qry), 'grow')}</div>${note(t('mthd_' + S.mth))}`, 'noprint') +
    card(`<div class="row"><h2>${t('profile')}</h2>${sel('load', [['', t('load_ph')], ['sample', 'Narendra Modi (' + t('sample') + ')']].concat(S.profiles.map(p => [p.id, p.name + ' · ' + p.dob])), '')}<button data-act="saveprof">${t('save_profile')}</button><button data-act="reset">${t('reset')}</button></div>
      <div class="grid">${field(t('fn'), inp('P.fn', P.fn))}${field(t('mn'), inp('P.mn', P.mn))}${field(t('ln'), inp('P.ln', P.ln))}${field(t('fullname_birth'), inp('P.full', P.full), 'grow')}${field(t('dob'), inp('P.dob', P.dob, 'date'))}${field(t('sex_kua'), sel('P.g', [['m', t('male')], ['f', t('female')]], P.g))}</div>
      <details id="setdet"${S.setOpen ? ' open' : ''}><summary><b>${t('settings')}</b></summary><div class="grid">${s('lp', ['comp', 'all'])}${s('yv', ['n', 'y', 'auto'])}${s('vs', ['ch', 'py'])}${s('py', ['cal', 'bday'])}${s('ly', ['full', 'two'])}${s('ld', ['n', 'y', 'vedic'])}${s('kua', ['n', 'y'])}${s('gl', ['loshu', 'vedic'])}${s('ftab', ['der', 'sup'])}${s('cmpm', ['qual', 'sup'])}</div></details>
      <div class="row small"><span class="muted">${t('streams')}:</span>${STREAMS.map(k => `<label class="chk"><input type="checkbox" data-k="on.${k}"${S.on[k] ? ' checked' : ''}> ${t('st_' + k)}</label>`).join('')}</div>`, 'noprint') +
    card(Object.keys(VIEWS).map(g => `<div class="navrow"><span class="muted small">${t('g_' + g)}</span>${VIEWS[g].map(v => `<button data-view="${v}" class="${S.view === v ? 'on' : ''}">${t('v_' + v)}</button>`).join('')}</div>`).join(''), 'noprint') +
    `<div class="noprint">${viewCtl()}</div><div id="out"></div>`;
}
function engineOut() { const R = compute(); return (S.view === 'rules' ? '' : warn(R)) + VIEWFN[S.view](R) + summary(R); }

/* ---------- transit analyser ---------- */
function transitShell() {
  const T = S.tr, P = S.P, s = (k, list) => field(t('t_' + k), sel('tr.' + k, list.map(x => [x, t('t_' + k + '_' + x)]), T[k]));
  return card(`<h1>${t('tr_title')}</h1><p class="muted">${t('tr_sub')}</p>`, 'gold noprint') +
    card(`<div class="navrow">${TTABS.map(k => `<button data-ttab="${k}" class="${S.ttab === k ? 'on' : ''}">${t('tt_' + k)}</button>`).join('')}</div>`, 'noprint') +
    card(`<div class="row"><h2>${t('profile')}</h2><span class="muted small">${t('tr_shared')}</span><button data-act="sample">${t('load_sample')}</button><button data-act="tr-reset">${t('reset_settings')}</button></div><div class="grid">${field(t('name_h'), inp('P.full', P.full || person().full), 'grow')}${field(t('dob'), inp('P.dob', P.dob, 'date'))}${field(t('target_date'), inp('tr.target', T.target || today(), 'date'))}<button data-act="today">${t('today')}</button></div>
      <h3>${t('tr_config')}</h3><div class="grid">${s('comp', ['red', 'raw'])}${s('mon', ['raw', 'red'])}${s('master', ['n', 'y'])}${s('bound', ['cal', 'bday'])}${s('leap', ['28', '1'])}</div>${note(t('tr_config_note'))}`, 'noprint') + '<div id="out"></div>';
}
function transitOut() {
  const T = S.tr, target = T.target || today(), dob = S.P.dob, x = NE.transit(dob, target, T), ft = S.o.ftab;
  if (!x) return card(`<p class="muted">${t('w_dob')}</p>`, 'warn');
  const calc = l => l.parts.join(' + ') + ' = ' + fmtRed(l.r), ms = l => l.r.master ? t('master') + ' ' + l.r.n + '/' + l.root : '–';
  const lay = [['pyear', x.py], ['pmonth', x.pm], ['pday', x.pd], ['uyear', x.uy], ['umonth', x.um], ['uday', x.ud]];
  const al = (a, b) => relTag(NE.rel(a.root, b.root, ft)), tab = S.ttab, D = x.T;
  const at = (y, m, d) => NE.transit(dob, iso(y, m, d), T), dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  let h = '';
  if (tab === 'cur') {
    const g = {}; lay.forEach(l => (g[l[1].root] = g[l[1].root] || []).push(t(l[0])));
    const sm = Object.keys(g).filter(n => g[n].length > 1).map(n => `<b>${n}</b> (${g[n].join(', ')})`);
    h += `<div class="stats">${lay.slice(0, 3).map(l => stat(t(l[0]), l[1].r.n, calc(l[1]), W(c('transits', l[1].r.n) || c('transits', l[1].root)))).join('')}</div>` +
      card(`<h2>${t('summary')}</h2><p><b>${t('date_h')}:</b> ${fmtDate(target)} · <b>${t('born')}:</b> ${fmtDate(dob)} · <b>${t('cycle_year')}:</b> ${x.yr} (${t('t_bound_' + T.bound)})</p>
        <p><b>${t('tr_personal')}:</b> ${x.py.root} / ${x.pm.root} / ${x.pd.root} · <b>${t('tr_universal')}:</b> ${x.uy.root} / ${x.um.root} / ${x.ud.root} · <b>${t('tr_samelayers')}:</b> ${sm.length ? sm.join('; ') : t('none')}</p>
        <p><b>${t('tr_align')}:</b> ${al(x.py, x.uy)} / ${al(x.pm, x.um)} / ${al(x.pd, x.ud)} · <b>${t('tr_status')}:</b> ${t(x.py.root === 1 ? 'cs_start' : x.py.root === 9 ? 'cs_end' : 'cs_mid')}</p>${note(t('disc_short'))}` +
        tbl([t('layer_h'), t('calc_h'), t('compound_sum'), t('root'), t('master_status')], lay.map(l => [t(l[0]), calc(l[1]), l[1].sum, `<b>${l[1].root}</b>`, ms(l[1])])) +
        `<h3>${t('tr_matrix')}</h3>` + tbl(['', t('tr_personal'), t('tr_universal'), t('relation')], [[t('year'), x.py.root, x.uy.root, al(x.py, x.uy)], [t('month'), x.pm.root, x.um.root, al(x.pm, x.um)], [t('day'), x.pd.root, x.ud.root, al(x.pd, x.ud)]]) +
        `<p class="btns noprint"><button class="pri" data-act="print">${t('print')}</button><button data-act="tjson">${t('dl_json')}</button></p>`, 'gold');
  } else if (tab === 'month') {
    h += card(`<h2>${t('tt_month')} – ${D.y}</h2>` + tbl([t('month'), t('pmonth'), t('root'), t('umonth'), t('relation'), t('wording')], Array.from({length: 12}, (_, i) => { const y = at(D.y, i + 1, Math.min(D.d, dim(D.y, i + 1))); return {cls: i + 1 === D.mo ? 'hl' : '', c: [monthName(i + 1), calc(y.pm), `<b>${y.pm.root}</b>`, y.um.root, al(y.pm, y.um), `<span class="muted">${c('transits', y.pm.root)}</span>`]}; })));
  } else if (tab === 'day') {
    h += card(`<h2>${t('tt_day')} – ${monthName(D.mo)} ${D.y}</h2>` + tbl([t('date_h'), t('pday'), t('root'), t('uday'), t('relation')], Array.from({length: dim(D.y, D.mo)}, (_, i) => { const y = at(D.y, D.mo, i + 1); return {cls: i + 1 === D.d ? 'hl' : '', c: [i + 1 + ' ' + monthName(D.mo, 'short'), calc(y.pd), `<b>${y.pd.root}</b>`, y.ud.root, al(y.pd, y.ud)]}; })));
  } else if (tab === 'nine') {
    const start = x.yr - (x.py.root - 1);
    h += card(`<h2>${t('nine_title')}</h2>` + tbl([t('year'), t('calc_h'), t('pyear'), t('wording')], Array.from({length: 9}, (_, i) => { const y = at(start + i, T.bound === 'bday' ? 12 : 6, 28); return {cls: start + i === x.yr ? 'hl' : '', c: [start + i, calc(y.py), `<b>${y.py.r.n}</b>`, `<span class="muted">${c('transits', y.py.root)}</span>`]}; })) + note(t('nine_note')));
  } else if (tab === 'cal') {
    let g = `<div class="tw"><table class="cal"><thead><tr><th></th>${Array.from({length: 31}, (_, i) => `<th>${i + 1}</th>`).join('')}</tr></thead><tbody>`;
    for (let m = 1; m <= 12; m++) { g += `<tr><th>${monthName(m, 'short')}</th>`; for (let d = 1; d <= 31; d++) { if (d > dim(D.y, m)) { g += '<td></td>'; continue; } const y = at(D.y, m, d); g += `<td class="n${y.pd.root}${m === D.mo && d === D.d ? ' now' : ''}${y.pd.root === y.ud.root ? ' eq' : ''}">${y.pd.root}</td>`; } g += '</tr>'; }
    h += card(`<h2>${t('tt_cal')} – ${D.y}</h2>${g}</tbody></table></div>` + note(t('cal_note')));
  } else {
    h += card(`<h2>${t('tr_math')}</h2>` + kv([[t('m_dr'), 'DR(n) = 1 + ((n − 1) mod 9), n &gt; 0; DR(0) = 0'], [t('pyear'), 'PY = DR(' + t('m_py') + ')'], [t('pmonth'), 'PM = DR(PY + ' + t('month') + ')'], [t('pday'), 'PD = DR(PM + ' + t('day') + ')'], [t('uyear'), 'UY = DR(' + t('m_uy') + ')'], [t('umonth') + ' / ' + t('uday'), 'UM = DR(UY + ' + t('month') + '); UD = DR(UM + ' + t('day') + ')']]) + note(t('m_note'))) +
      card(`<h3>${t('settings_now')}</h3><pre>${esc(JSON.stringify({target, dob, config: T, layers: Object.fromEntries(lay.map(l => [l[0], {parts: l[1].parts, sum: l[1].sum, root: l[1].root}]))}, null, 1))}</pre>`);
  }
  return h;
}

/* ---------- files ---------- */
function filesShell() {
  const folders = [...new Set(S.profiles.map(p => p.folder).filter(Boolean))].sort();
  return card(`<h1>${t('fl_title')}</h1><p class="muted">${t('fl_sub')}</p>
    <p class="btns"><button class="pri" data-act="saveprof">${t('fl_savecur')}</button><button data-act="f-new">${t('fl_new')}</button><button data-act="f-expall">${t('fl_expall')}</button><button data-act="f-import">${t('fl_import')}</button><input type="file" id="impfile" accept=".json,application/json" hidden></p>
    <div class="grid">${field(t('fl_search'), inp('fq', S.fq, 'search'), 'grow')}${field(t('fl_folder'), sel('ff', [['', t('fl_allfolders')]].concat(folders.map(f => [f, f])), S.ff))}</div>${note(t('privacy'))}`, 'gold') + '<div id="out"></div>';
}
function filesOut() {
  const q = S.fq.toLowerCase(), list = S.profiles.filter(p => (!S.ff || p.folder === S.ff) && (!q || (p.name + ' ' + (p.notes || '') + ' ' + (p.folder || '') + ' ' + p.dob).toLowerCase().includes(q))).sort((a, b) => a.name.localeCompare(b.name));
  let h = '';
  if (S.editId) {
    const e = S.ed, q2 = (k, v, ty) => `<input data-k="ed.${k}" data-quiet type="${ty || 'text'}" value="${esc(v || '')}">`;
    h += card(`<h2>${t(S.editId === 'new' ? 'fl_new' : 'fl_edit')}</h2><div class="grid">${field(t('fn'), q2('fn', e.fn))}${field(t('mn'), q2('mn', e.mn))}${field(t('ln'), q2('ln', e.ln))}${field(t('dob'), q2('dob', e.dob, 'date'))}${field(t('sex'), sel('ed.g', [['m', t('male')], ['f', t('female')]], e.g || 'm', 'data-quiet'))}${field(t('fl_folder'), q2('folder', e.folder))}${field(t('fl_notes'), q2('notes', e.notes), 'grow')}</div><p class="btns"><button class="pri" data-act="f-save">${t('save')}</button><button data-act="f-cancel">${t('cancel')}</button></p>`, 'warn');
  }
  const b = (a, id, l, cls) => `<button class="sm ${cls || ''}" data-act="${a}" data-id="${id}">${t(l)}</button>`;
  h += card(`<h2>${t('fl_list')} (${list.length} / ${S.profiles.length})</h2>` + (list.length ? tbl([t('name_h'), t('dob'), t('fl_folder'), t('fl_notes'), t('lifepath'), t('mulank'), t('fl_updated'), ''], list.map(p => { const D = NE.date(p.dob), py = D ? NE.pyth({fn: '', mn: '', ln: '', full: p.name, dob: p.dob}, opts()) : null; return [`<b>${esc(p.name)}</b>`, fmtDate(p.dob), esc(p.folder || '–'), `<span class="muted">${esc(p.notes || '')}</span>`, py ? py.lp.red.n : '–', D ? NE.root(D.d) : '–', `<span class="muted">${esc((p.upd || '').slice(0, 10))}</span>`, `<span class="btns">${b('f-open', p.id, 'fl_open', 'pri')}${b('f-edit', p.id, 'fl_edit')}${b('f-dup', p.id, 'fl_dup')}${b('f-exp', p.id, 'fl_export')}${b('f-del', p.id, 'fl_delete', 'danger')}</span>`]; })) : `<p class="muted">${t('fl_empty')}</p>`));
  return h;
}
const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const profName = p => [p.fn, p.mn, p.ln].filter(Boolean).join(' ') || p.full || '';
function saveCurrent() {
  const P = S.P, name = person().full.trim(); if (!name && !P.dob) { alert(t('fl_needname')); return; }
  const ex = S.profiles.find(p => p.name === name && p.dob === P.dob), rec = {fn: P.fn, mn: P.mn, ln: P.ln, name, dob: P.dob, g: P.g, upd: new Date().toISOString()};
  if (ex) Object.assign(ex, rec); else S.profiles.push(Object.assign({id: uid(), folder: '', notes: ''}, rec));
  save(); toast(t('fl_saved'));
}
function loadProfile(p) { S.P = {fn: p.fn || '', mn: p.mn || '', ln: p.ln || '', full: p.name || p.full || '', dob: p.dob || '', g: p.g || 'm'}; if (!S.P.fn && S.P.full) { const w = S.P.full.split(/\s+/); S.P.fn = w[0] || ''; S.P.ln = w.length > 1 ? w[w.length - 1] : ''; S.P.mn = w.length > 2 ? w.slice(1, -1).join(' ') : ''; } }
function importFile(file) {
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result), arr = Array.isArray(d) ? d : d.profiles || []; let n = 0; arr.forEach(p => { if (!p || typeof p !== 'object' || (!p.name && !p.dob)) return; const rec = {id: String(p.id || uid()), fn: String(p.fn || ''), mn: String(p.mn || ''), ln: String(p.ln || ''), name: String(p.name || ''), dob: NE.date(p.dob) ? p.dob : '', g: p.g === 'f' ? 'f' : 'm', folder: String(p.folder || ''), notes: String(p.notes || ''), upd: String(p.upd || new Date().toISOString())}; const i = S.profiles.findIndex(x => x.id === rec.id); if (i >= 0) S.profiles[i] = rec; else S.profiles.push(rec); n++; }); save(); renderAll(); toast(t('fl_imported', n)); } catch (e) { alert(t('fl_badfile')); } };
  r.readAsText(file);
}
function toast(msg) { let e = $('#toast'); if (!e) { e = document.createElement('div'); e.id = 'toast'; document.body.appendChild(e); } e.textContent = msg; e.className = 'show'; clearTimeout(toast.t); toast.t = setTimeout(() => e.className = '', 2200); }

/* ---------- report ---------- */
const RSEC = ['sum', 'py', 'ch', 've', 'ls', 'cy', 'kb', 'word', 'disc'];
function reportShell() {
  const o = S.rp;
  return card(`<h1>${t('rp_title')}</h1><p class="muted">${t('rp_sub')}</p>
    <div class="grid">${field(t('rp_rtitle'), inp('rp.title', o.title, 'text', t('rp_deftitle')), 'grow')}${field(t('rp_by'), inp('rp.by', o.by))}${field(t('rp_note'), inp('rp.note', o.note), 'grow')}</div>
    <h3>${t('rp_include')}</h3><div class="row small">${RSEC.map(k => `<label class="chk"><input type="checkbox" data-k="rp.sec.${k}"${o.sec[k] ? ' checked' : ''}> ${t('rps_' + k)}</label>`).join('')}</div>
    ${field(t('rp_disc_custom'), `<textarea data-k="rp.disc" rows="2" placeholder="${esc(t('disc_long'))}">${esc(o.disc)}</textarea>`)}
    <p class="btns"><button class="pri" data-act="print">${t('rp_publish')}</button><button data-act="rhtml">${t('rp_html')}</button><button data-act="json">${t('dl_json')}</button></p>${note(t('rp_hint'))}`, 'gold noprint') + '<div id="out"></div>';
}
function reportBody() {
  const R = compute(), o = S.rp, sec = o.sec, se = (title, body) => `<section class="rsec"><h2>${title}</h2>${body}</section>`;
  SHOWW = !!sec.word;
  let h = `<article class="report"><header class="rhead"><div class="rbrand">NUMEROSUTRAS</div><h1>${esc(o.title || t('rp_deftitle'))}</h1><p class="rname">${esc(R.P.full) || t('no_name')} · ${R.D ? fmtDate(R.P.dob) : t('no_dob')}</p><p class="muted small">${o.by ? t('rp_by') + ': ' + esc(o.by) + ' · ' : ''}${t('date_h')}: ${fmtDate(today())} · ${t('methods')}: ${t('mth_' + S.mth)}</p>${o.note ? `<p>${esc(o.note)}</p>` : ''}</header>`;
  if (!R.hasName || !R.D) h += warn(R);
  if (sec.sum) h += se(t('summary_table'), rowsTable(rows(R).filter(x => x.id !== 'lpalt')));
  if (sec.py && S.on.py) h += se(t('st_py'), vPy(R));
  if (sec.ch && S.on.ch) h += se(t('st_ch'), vCh(R));
  if (sec.ve && S.on.ve) h += se(t('st_ve'), vVe(R));
  if (sec.ls && S.on.ls) h += se(t('v_ls'), vLs(R));
  if (sec.cy) h += se(t('cy_title') + ' – ' + fmtDate(R.ref), cyclesBody(R));
  if (sec.kb && S.on.kb && R.kb.items.length) h += se(t('st_kb') + ' – ' + esc(S.he), kbBody(R));
  if (sec.disc) h += `<section class="rsec disc"><h2>${t('disclaimer')}</h2><p>${esc(o.disc.trim() || t('disc_long'))}</p></section>`;
  SHOWW = true;
  return h + `<footer class="rfoot">NUMEROSUTRAS v${VERSION} · ${t('rp_foot')}</footer></article>`;
}
async function reportHTML() {
  let css = ''; try { css = await (await fetch('styles.css')).text(); } catch (e) {}
  const html = `<!doctype html><html lang="${S.lang}" dir="${S.lang === 'ar' ? 'rtl' : 'ltr'}" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(S.rp.title || t('rp_deftitle'))}</title><style>${css}</style></head><body><main class="wrap">${reportBody()}</main></body></html>`;
  download('numerosutras-report.html', html, 'text/html');
}

/* ---------- about ---------- */
function aboutShell() {
  const pic = ini => (typeof PHOTOS !== 'undefined' && PHOTOS[ini.toLowerCase()]) || '';
  const bio = (ini, name, tag, role, text) => card(`<div class="bio">${pic(ini) ? `<img class="avatar photo" src="${pic(ini)}" alt="${name}">` : `<div class="avatar" aria-hidden="true">${ini}</div>`}<div><h2>${t('ab_about')} ${name}</h2>${tag ? `<p class="tagline">${tag}</p>` : ''}<p class="muted small"><b>${role}</b></p><p>${text}</p></div></div>`);
  return card(`<h1>${t('ab_title')}</h1><p class="tagline">${t('tagline')}</p><p class="tag2">${t('tagline2')}</p><p>${t('ab_p1')}</p><p>${t('ab_p2')}</p>`, 'gold') +
    bio('SV', 'Shweta Vijayvarrgiya', t('ab_sv_tag'), '(NumeroSutras) · ' + t('ab_sv_role'), t('ab_sv_bio')) +
    bio('AS', 'Anoopam Shukla', '', '(AppstroSutras) · ' + t('ab_as_role'), t('ab_as_bio')) +
    card(`<h2>${t('ab_streams')}</h2><ul>${STREAMS.map(s => `<li><b>${t('st_' + s)}</b> – ${t('ab_' + s)}</li>`).join('')}</ul>`) +
    card(`<h2>${t('ab_features')}</h2><ul>${[1, 2, 3, 4, 5, 6].map(i => `<li>${t('ab_f' + i)}</li>`).join('')}</ul>`) +
    card(`<h2>${t('ab_privacy')}</h2><p>${t('privacy')}</p><h2>${t('disclaimer')}</h2><p>${t('disc_long')}</p>`) +
    card(`<h2>${t('ab_credits')}</h2><p>${t('dev_by')}</p><p>${t('ab_credit_t')} <a href="https://astroanupam.github.io/appstrosutras_app/" target="_blank" rel="noopener">AppstroSutras</a></p><p class="muted small">NUMEROSUTRAS v${VERSION}</p>`) + '<div id="out"></div>';
}

/* ---------- rendering ---------- */
const SHELL = {engine: engineShell, transit: transitShell, files: filesShell, report: reportShell, about: aboutShell};
const OUT = {engine: engineOut, transit: transitOut, files: filesOut, report: reportBody, about: () => ''};
function applyTheme() { const d = S.theme === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : S.theme; document.documentElement.dataset.theme = d; const m = $('meta[name=theme-color]'); if (m) m.content = d === 'dark' ? '#0b1120' : '#1e3a8a'; }
function applyChrome() { const h = document.documentElement; h.lang = S.lang; h.dir = S.lang === 'ar' ? 'rtl' : 'ltr'; h.style.fontSize = (16 * S.fs / 100) + 'px'; document.body.className = 'pg-' + S.page; applyTheme(); }
function renderOut() { const e = $('#out'); if (e) e.innerHTML = OUT[S.page](); }
function renderAll() {
  applyChrome();
  $('#top').innerHTML = `<div class="brand"><img src="icon-192.png" alt="" width="40" height="40"><div><b>NUMEROSUTRAS <span class="beta">(${t('beta')})</span></b><small class="tag1">${t('tagline')}</small><small class="tag2">${t('tagline2')}</small></div></div>
    <div class="tools"><label>${t('language')} ${sel('lang', LANGS, S.lang)}</label><label>${t('theme')} ${sel('theme', [['auto', t('th_auto')], ['light', t('th_light')], ['dark', t('th_dark')]], S.theme)}</label>
    <span class="fs" title="${t('font_size')}"><button data-act="fs-" aria-label="${t('font_size')} −">A−</button><button data-act="fs0">${S.fs}%</button><button data-act="fs+" aria-label="${t('font_size')} +">A+</button></span>
    <button class="pri" data-act="install" id="install"${deferredInstall ? '' : ' hidden'}>${t('install')}</button></div>`;
  const ICON = {engine: '#', transit: '↻', files: '▤', report: '⎙', about: 'ⓘ'};
  $('#nav').innerHTML = PAGES.map(p => `<button data-page="${p}" class="${S.page === p ? 'on' : ''}"${S.page === p ? ' aria-current="page"' : ''}><i aria-hidden="true">${ICON[p]}</i><span>${t('pg_' + p)}</span></button>`).join('');
  $('#nav').setAttribute('aria-label', t('main_nav'));
  $('#skip').textContent = t('skip');
  $('#page').innerHTML = SHELL[S.page]();
  $('#foot').innerHTML = `<p><b>${t('dev_by')}</b></p><p>${t('disc_short')} · ${t('privacy_short')}</p><p>© ${new Date().getFullYear()} NUMEROSUTRAS · v${VERSION}</p>`;
  renderOut();
}

/* ---------- events ---------- */
const isText = el => el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'file'].includes(el.type));
const FULL = k => k === 'lang' || k === 'mth' || k.startsWith('o.') || k === 'ref' || k === 'qry';
function hook(k, el) {
  if (k === 'mth' && PRESETS[S.mth]) Object.assign(S.o, PRESETS[S.mth]);
  if (k.startsWith('o.')) S.mth = 'custom';
  if (['P.fn', 'P.mn', 'P.ln'].includes(k)) { S.P.full = [S.P.fn, S.P.mn, S.P.ln].filter(Boolean).join(' '); const f = $('[data-k="P.full"]'); if (f) f.value = S.P.full; }
  if (k === 'ref') S.view = 'rules'; if (k === 'qry') S.view = 'query';
  if (k === 'theme') applyTheme();
}
document.addEventListener('input', e => { const el = e.target, k = el.dataset && el.dataset.k; if (!k || !isText(el)) return; setK(k, el.value); hook(k, el); save(); if (el.dataset.quiet === undefined) renderOut(); });
document.addEventListener('change', e => {
  const el = e.target, k = el.dataset && el.dataset.k;
  if (el.id === 'impfile') { if (el.files[0]) importFile(el.files[0]); el.value = ''; return; }
  if (!k || isText(el)) return;
  if (k === 'load' || k === 'pickB') { const p = el.value === 'sample' ? Object.assign({name: SAMPLE.full}, SAMPLE) : S.profiles.find(x => x.id === el.value); if (p) { if (k === 'load') loadProfile(p); else S.B = {name: p.name, dob: p.dob, g: p.g || 'm'}; save(); renderAll(); } return; }
  setK(k, el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value); hook(k, el); save();
  if (el.dataset.quiet !== undefined) return;
  FULL(k) ? renderAll() : renderOut();
});
document.addEventListener('toggle', e => { if (e.target.id === 'setdet') { S.setOpen = e.target.open ? 1 : 0; save(); } }, true);
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if (d.page) { S.page = d.page; save(); renderAll(); scrollTo(0, 0); return; }
  if (d.view) { S.view = d.view; save(); renderAll(); return; }
  if (d.ttab) { S.ttab = d.ttab; save(); renderAll(); return; }
  if (d.he) { S.he += d.he; const i = $('[data-k="he"]'); if (i) i.value = S.he; save(); renderOut(); return; }
  const a = d.act, id = d.id, prof = () => S.profiles.find(p => p.id === id); if (!a) return;
  if (a === 'fs-' || a === 'fs+' || a === 'fs0') { S.fs = a === 'fs0' ? 100 : Math.max(80, Math.min(160, S.fs + (a === 'fs+' ? 10 : -10))); save(); renderAll(); }
  else if (a === 'install') { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; b.hidden = true; } }
  else if (a === 'print') window.print();
  else if (a === 'goreport') { S.page = 'report'; save(); renderAll(); scrollTo(0, 0); }
  else if (a === 'json') { const R = compute(); download('numerosutras.json', JSON.stringify({app: 'NUMEROSUTRAS', version: VERSION, generated: new Date().toISOString(), profile: R.P, settings: R.o, streams: S.on, results: rows(R)}, null, 2)); }
  else if (a === 'tjson') { const x = NE.transit(S.P.dob, S.tr.target || today(), S.tr); download('numerosutras-transit.json', JSON.stringify({app: 'NUMEROSUTRAS', generated: new Date().toISOString(), config: S.tr, result: x}, null, 2)); }
  else if (a === 'rhtml') reportHTML();
  else if (a === 'reset') { S.P = Object.assign({}, DEF.P); S.o = Object.assign({}, DEF.o); S.mth = 'custom'; save(); renderAll(); }
  else if (a === 'saveprof') { saveCurrent(); renderAll(); }
  else if (a === 'sample') { loadProfile(Object.assign({name: SAMPLE.full}, SAMPLE)); save(); renderAll(); }
  else if (a === 'tr-reset') { S.tr = Object.assign({}, DEF.tr); save(); renderAll(); }
  else if (a === 'today') { S.tr.target = today(); save(); renderAll(); }
  else if (a === 'he-clear') { S.he = ''; save(); renderAll(); }
  else if (a === 'f-new') { S.editId = 'new'; S.ed = {g: 'm', folder: S.ff}; renderOut(); }
  else if (a === 'f-edit') { const p = prof(); if (p) { S.editId = id; S.ed = Object.assign({}, p); if (!p.fn && !p.ln) S.ed.fn = p.name; renderOut(); scrollTo(0, 0); } }
  else if (a === 'f-cancel') { S.editId = ''; renderOut(); }
  else if (a === 'f-save') {
    const e2 = S.ed, name = profName(e2).trim(); if (!name) { alert(t('fl_needname')); return; }
    const rec = {fn: e2.fn || '', mn: e2.mn || '', ln: e2.ln || '', name, dob: NE.date(e2.dob) ? e2.dob : '', g: e2.g || 'm', folder: (e2.folder || '').trim(), notes: e2.notes || '', upd: new Date().toISOString()};
    if (S.editId === 'new') S.profiles.push(Object.assign({id: uid()}, rec)); else Object.assign(S.profiles.find(p => p.id === S.editId) || {}, rec);
    S.editId = ''; save(); renderAll(); toast(t('fl_saved'));
  }
  else if (a === 'f-open') { const p = prof(); if (p) { loadProfile(p); S.page = 'engine'; S.view = 'dash'; save(); renderAll(); scrollTo(0, 0); } }
  else if (a === 'f-dup') { const p = prof(); if (p) { S.profiles.push(Object.assign({}, p, {id: uid(), name: p.name + ' (2)', upd: new Date().toISOString()})); save(); renderAll(); } }
  else if (a === 'f-del') { const p = prof(); if (p && confirm(t('fl_confirm', p.name))) { S.profiles = S.profiles.filter(x => x.id !== id); save(); renderAll(); } }
  else if (a === 'f-exp') { const p = prof(); if (p) download('numerosutras-' + (NE.norm(p.name).norm.toLowerCase() || 'profile') + '.json', JSON.stringify({app: 'NUMEROSUTRAS', profiles: [p]}, null, 2)); }
  else if (a === 'f-expall') download('numerosutras-profiles.json', JSON.stringify({app: 'NUMEROSUTRAS', exported: new Date().toISOString(), profiles: S.profiles}, null, 2));
  else if (a === 'f-import') $('#impfile').click();
});
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const b = $('#install'); if (b) b.hidden = false; });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
renderAll();
