/* NumeroSutras – calculation engine (pure functions, no DOM).
   Five independent rule sets: Pythagorean, Chaldean, Vedic, Lo Shu, Kabbalah. */
'use strict';
const NE = (() => {
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const PY = Object.fromEntries([...LET].map((c, i) => [c, (i % 9) + 1]));
  const CH = {A:1,B:2,C:3,D:4,E:5,F:8,G:3,H:5,I:1,J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7};
  const HE = {'א':['Aleph',1],'ב':['Bet',2],'ג':['Gimel',3],'ד':['Dalet',4],'ה':['He',5],'ו':['Vav',6],'ז':['Zayin',7],'ח':['Het',8],'ט':['Tet',9],'י':['Yod',10],'כ':['Kaf',20],'ל':['Lamed',30],'מ':['Mem',40],'נ':['Nun',50],'ס':['Samekh',60],'ע':['Ayin',70],'פ':['Pe',80],'צ':['Tsade',90],'ק':['Qof',100],'ר':['Resh',200],'ש':['Shin',300],'ת':['Tav',400],'ך':['Kaf (final)',20,500],'ם':['Mem (final)',40,600],'ן':['Nun (final)',50,700],'ף':['Pe (final)',80,800],'ץ':['Tsade (final)',90,900]};
  const LOSHU = [[4,9,2],[3,5,7],[8,1,6]], VG = [[3,1,9],[6,7,5],[2,8,4]];
  const LINES = [['row',[4,9,2],'mental'],['row',[3,5,7],'emotional'],['row',[8,1,6],'practical'],['col',[4,3,8],'thought'],['col',[9,5,1],'will'],['col',[2,7,6],'action'],['diag',[4,5,6],'golden'],['diag',[2,5,8],'silver']];
  const VLINES = [...VG.map(r => ['row', r, '']), ...[0,1,2].map(c => ['col', VG.map(r => r[c]), '']), ['diag',[3,7,4],''], ['diag',[9,7,2],'']];
  const KARMIC = {13:4,14:5,16:7,19:1};
  const AUSP = [10,14,15,19,21,23,24,27,32,33,37,41,42,45,46,50,51,52];
  const M = [11,22,33];
  /* supplied (unverified) tables */
  const FR_SUP = {1:[[1,2,3,9],[4,5,7],[6,8]],2:[[1,2,3,5],[4,6,7,8,9],[]],3:[[1,2,3,9],[4,7,8],[5,6]],4:[[5,6,7,8],[3],[1,2,9]],5:[[1,2,4,6],[3,7,8,9],[]],6:[[4,5,6,7,8],[3,9],[1,2]],7:[[4,5,6,8],[1,2,3],[9]],8:[[4,5,6,7],[3],[1,2,9]],9:[[1,2,3,9],[6,8],[4,5]]};
  const HARM = {1:[[1,3,5,9],[2,6,7,8]],2:[[2,4,6,8],[1,3,7,9]],3:[[1,3,5,6,9],[2,7]],4:[[2,4,6,8],[7,9]],5:[[1,3,5,7,9],[6,8]],6:[[2,3,4,6,8,9],[1,5,7]],7:[[4,5,7],[1,2,3,6,8,9]],8:[[2,4,6,8],[1,5,7]],9:[[1,3,5,6,9],[2,4,7]]};
  /* derived from the natural friendship of the mapped planets; Rahu (4) and Ketu (7) undefined */
  const DER = {};
  [['friend','1-2,1-3,1-9,3-9,5-6,6-8'],['neutral','1-5,2-3,2-9,3-8,5-8,6-9'],['mixed','1-6,1-8,2-5,2-6,2-8,3-5,3-6,5-9,8-9']].forEach(([k, l]) => l.split(',').forEach(p => DER[p] = k));

  const sum = a => a.reduce((x, y) => x + y, 0);
  const digits = n => String(n).split('').map(Number);

  function norm(str) {
    const orig = String(str || ''), fold = orig.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    const letters = [...fold.replace(/[^A-Z]/g, '')];
    let foreign = false;
    try { foreign = /\p{L}/u.test(fold.replace(/[A-Z]/g, '')); } catch (e) { foreign = /[^\x00-\x7f]/.test(fold); }
    return {orig, norm: letters.join(''), letters, foreign};
  }
  function red(n, keep) {
    n = +n || 0; const chain = [n];
    while (n > 9 && !(keep && keep.includes(n))) { n = sum(digits(n)); chain.push(n); }
    return {n, chain, master: !!(keep && keep.includes(n) && n > 9)};
  }
  const root = n => red(n).n;
  function date(d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return null;
    const y = +m[1], mo = +m[2], dd = +m[3], t = new Date(Date.UTC(y, mo - 1, dd));
    if (y < 1 || t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== dd) return null;
    return {y, mo, d: dd, str: d};
  }
  const word = (letters, map) => { const v = letters.map(l => map[l]); return {letters, vals: v, total: sum(v)}; };
  const dateSum = D => sum(digits(D.d).concat(digits(D.mo), digits(D.y)));
  const karmicOf = list => list.filter(x => KARMIC[x]).map(x => x + '/' + KARMIC[x]);

  /* vowels / consonants, Y handled per word: n = consonant, y = vowel, auto = vowel when the word has no other vowel */
  function vc(full, yv) {
    const words = String(full || '').split(/[\s\-]+/).map(w => norm(w).letters).filter(a => a.length), v = [], c = [];
    words.forEach(w => { const hasV = w.some(l => 'AEIOU'.includes(l)); w.forEach(l => { const isV = 'AEIOU'.includes(l) || (l === 'Y' && (yv === 'y' || (yv === 'auto' && !hasV))); (isV ? v : c).push(l); }); });
    return {v, c};
  }

  function pyth(P, o) {
    const full = norm(P.full), parts = [P.fn, P.mn, P.ln].map(norm), out = {}, s = vc(P.full, o.yv);
    const all = word(full.letters, PY), vv = word(s.v, PY), cc = word(s.c, PY);
    out.exp = {total: all.total, red: red(all.total, M), vals: all.vals};
    out.soul = {total: vv.total, red: red(vv.total, M), letters: s.v};
    out.pers = {total: cc.total, red: red(cc.total, M), letters: s.c};
    out.parts = parts.filter(p => p.letters.length).map(p => { const w = word(p.letters, PY); return {name: p.norm, total: w.total, red: red(w.total, M)}; });
    const ini = parts.filter(p => p.letters.length).map(p => p.letters[0]), is = sum(ini.map(l => PY[l]));
    out.bal = {ini, total: is, red: red(is, M)};
    const freq = {}; all.vals.forEach(v => freq[v] = (freq[v] || 0) + 1);
    const mx = Math.max(0, ...Object.values(freq));
    out.hidden = mx ? Object.keys(freq).filter(k => freq[k] === mx).map(Number) : [];
    out.lessons = [1,2,3,4,5,6,7,8,9].filter(n => !freq[n]);
    const D = date(P.dob);
    if (D) {
      const rm = red(D.mo, M), rd = red(D.d, M), ry = red(sum(digits(D.y)), M), comp = rm.n + rd.n + ry.n, all2 = dateSum(D);
      out.lpC = {rm, rd, ry, sum: comp, red: red(comp, M)}; out.lpA = {sum: all2, red: red(all2, M)};
      out.lp = o.lp === 'all' ? out.lpA : out.lpC;
      out.bday = {raw: D.d, red: red(D.d, M)};
      out.karmic = [...new Set([...(KARMIC[D.d] ? [D.d + '/' + KARMIC[D.d]] : []), ...karmicOf([out.lp.sum, out.exp.total, out.soul.total, out.pers.total])])];
      out.mat = red(out.lp.red.n + out.exp.red.n, M);
      out.bridge = {lpExp: Math.abs(root(out.lp.red.n) - root(out.exp.red.n)), soulPers: Math.abs(root(out.soul.red.n) - root(out.pers.red.n))};
      const m = root(D.mo), d = root(D.d), y = root(sum(digits(D.y))), e1 = 36 - root(out.lp.red.n);
      const p1 = red(m + d, M), p2 = red(d + y, M), p3 = red(p1.n + p2.n, M), p4 = red(m + y, M);
      out.pin = [{n: p1, from: 0, to: e1}, {n: p2, from: e1 + 1, to: e1 + 9}, {n: p3, from: e1 + 10, to: e1 + 18}, {n: p4, from: e1 + 19, to: null}];
      out.chal = [Math.abs(m - d), Math.abs(d - y), Math.abs(Math.abs(m - d) - Math.abs(d - y)), Math.abs(m - y)];
    }
    return out;
  }
  function stages(P, o, refISO) {
    const D = date(P.dob), R = date(refISO); if (!D || !R) return null;
    const r = pyth(P, o), age = R.y - D.y - ((R.mo < D.mo || (R.mo === D.mo && R.d < D.d)) ? 1 : 0);
    const list = r.pin.map((p, i) => ({i: i + 1, from: p.from, to: p.to, y1: D.y + p.from, y2: p.to === null ? null : D.y + p.to, pin: p.n, chal: r.chal[i], cur: age >= p.from && (p.to === null || age <= p.to)}));
    return {age, list, cur: list.find(x => x.cur) || null};
  }

  function chal(P) {
    const full = norm(P.full), out = {}, w = word(full.letters, CH);
    out.name = {total: w.total, red: red(w.total), vals: w.vals};
    out.parts = [P.fn, P.mn, P.ln].map(norm).filter(p => p.letters.length).map(p => { const q = word(p.letters, CH); return {name: p.norm, total: q.total, red: red(q.total)}; });
    const v1 = word(full.letters.filter(l => 'AEIOU'.includes(l)), CH), c1 = word(full.letters.filter(l => !'AEIOU'.includes(l)), CH);
    out.vow = {total: v1.total, red: red(v1.total)}; out.con = {total: c1.total, red: red(c1.total)};
    const D = date(P.dob);
    if (D) { out.birth = {raw: D.d, red: red(D.d)}; const t = dateSum(D); out.dest = {total: t, red: red(t)}; }
    return out;
  }

  function vedic(P, o) {
    const D = date(P.dob), out = {}, w = word(norm(P.full).letters, o.vs === 'py' ? PY : CH);
    out.nam = {total: w.total, red: red(w.total), sys: o.vs === 'py' ? 'py' : 'ch'};
    if (D) { out.mul = red(D.d); const t = dateSum(D); out.bha = {total: t, red: red(t)}; }
    return out;
  }

  /* Kua from the calendar year (the Chinese solar-year boundary is not applied) */
  function kua(y, g) { const ys = root(sum(digits(y))); let k = root(g === 'f' ? 4 + ys : 11 - ys); if (k === 5) k = g === 'f' ? 8 : 2; return k; }

  function loshu(P, o) {
    const D = date(P.dob); if (!D) return null;
    const pad = n => String(n).padStart(2, '0'), ystr = o.ly === 'two' ? String(D.y).slice(-2) : String(D.y);
    const raw = (pad(D.d) + pad(D.mo) + ystr).split('').map(Number), used = raw.filter(x => x !== 0);
    const cnt = {}; for (let i = 1; i <= 9; i++) cnt[i] = 0; used.forEach(x => cnt[x]++);
    const mul = root(D.d), bha = root(dateSum(D)), k = kua(D.y, o.g), inj = [];
    if (o.ld === 'y') { inj.push(['mulank', mul]); inj.push(['bhagyank', bha]); }
    else if (o.ld === 'vedic') { if (D.d > 9 && ![10,20,30].includes(D.d)) inj.push(['mulank', mul]); inj.push(['bhagyank', bha]); }
    if (o.kua === 'y') inj.push(['kua', k]);
    inj.forEach(x => cnt[x[1]]++);
    const vg = o.gl === 'vedic', lines = (vg ? VLINES : LINES).map(l => { const n = l[1].filter(i => cnt[i] > 0).length; return {type: l[0], nums: l[1], key: l[2], pct: Math.round(n / 3 * 100), full: n === 3, empty: n === 0}; });
    const pick = f => [1,2,3,4,5,6,7,8,9].filter(f);
    return {raw, used, cnt, mul, bha, kua: k, inj, lines, cells: vg ? VG : LOSHU, layout: vg ? 'vedic' : 'loshu', missing: pick(i => !cnt[i]), repeated: pick(i => cnt[i] > 1), single: pick(i => cnt[i] === 1)};
  }

  /* relation between two root numbers: same | friend | neutral | mixed | enemy | pending | na */
  function rel(a, b, ftab) {
    a = root(a); b = root(b); if (!a || !b) return 'na'; if (a === b) return 'same';
    if (ftab === 'sup') {
      const f = (x, y) => { const r = FR_SUP[x]; return r[0].includes(y) ? 'friend' : r[1].includes(y) ? 'neutral' : r[2].includes(y) ? 'enemy' : null; };
      const x = f(a, b), y = f(b, a);
      if (!x && !y) return 'pending'; if (!x || !y) return x || y;
      return x === y ? x : (x === 'enemy' || y === 'enemy') ? 'mixed' : 'neutral';
    }
    if ([4, 7].includes(a) || [4, 7].includes(b)) return 'pending';
    return DER[a < b ? a + '-' + b : b + '-' + a] || 'neutral';
  }
  function friends(n, ftab) {
    const out = {friend: [], neutral: [], mixed: [], pending: []};
    for (let m = 1; m <= 9; m++) { if (m === n) continue; const k = rel(n, m, ftab); out[k === 'enemy' ? 'mixed' : k].push(m); }
    return out;
  }

  /* personal and universal cycle of the Numerology engine */
  function cycle(dob, o, cdate) {
    const D = date(dob), C = date(cdate); if (!D || !C) return null;
    let yr = C.y; if (o.py === 'bday' && !(C.mo > D.mo || (C.mo === D.mo && C.d >= D.d))) yr = C.y - 1;
    const rm = root(D.mo), rd = root(D.d), ry = root(sum(digits(yr))), raw = rm + rd + ry, py = red(raw), pm = red(py.n + C.mo), pd = red(pm.n + C.d);
    const uy = red(sum(digits(C.y)), M), um = red(uy.n + C.mo, M), ud = red(um.n + C.d, M);
    const nine = []; for (let k = 0; k < 9; k++) { const y = yr + k, t = rm + rd + root(sum(digits(y))); nine.push({y, raw: t, n: root(t)}); }
    return {yr, py, pm, pd, rm, rd, ry, raw, uy, um, ud, nine, C};
  }

  /* Transit analyser: every layer keeps its compound sum, root and master status */
  const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  function transit(dob, target, c) {
    const D = date(dob), T = date(target); if (!D || !T) return null;
    let yr = T.y;
    if (c.bound === 'bday') {
      let bm = D.mo, bd = D.d;
      if (bm === 2 && bd === 29 && !isLeap(T.y)) { if (c.leap === '1') { bm = 3; bd = 1; } else bd = 28; }
      if (!(T.mo > bm || (T.mo === bm && T.d >= bd))) yr = T.y - 1;
    }
    const keep = c.master === 'y' ? [11, 22] : [], lay = (parts, label) => { const s = sum(parts); return {parts, sum: s, r: red(s, keep), root: root(s)}; };
    const comps = c.comp === 'raw' ? [D.mo, D.d, yr] : [root(D.mo), root(D.d), root(sum(digits(yr)))];
    const mA = c.mon === 'red' ? root(T.mo) : T.mo, dA = c.mon === 'red' ? root(T.d) : T.d;
    const py = lay(comps), pm = lay([py.root, mA]), pd = lay([pm.root, dA]);
    const uy = lay(digits(T.y)), um = lay([uy.root, mA]), ud = lay([um.root, dA]);
    return {D, T, yr, py, pm, pd, uy, um, ud};
  }

  function heb(txt) {
    const clean = String(txt || '').replace(/[֑-ׇ]/g, ''), items = [], bad = [];
    for (const ch of clean) { if (/\s/.test(ch)) continue; const e = HE[ch]; if (!e) { bad.push(ch); continue; } let k = e[1]; while (k >= 10 && k % 10 === 0) k /= 10; items.push({ch, name: e[0], reg: e[1], gad: e[2] || e[1], kat: k}); }
    const hech = sum(items.map(i => i.reg)), gad = sum(items.map(i => i.gad)), kat = sum(items.map(i => i.kat));
    return {items, bad, hech, gad, kat, hechRed: red(hech), gadRed: red(gad), katRed: red(kat)};
  }

  /* supplied weighted compatibility index (unverified, optional) */
  function compatSup(A, B) {
    if (!A.py.lp || !B.py.lp || !A.ve.mul || !B.ve.mul || !A.ls || !B.ls) return null;
    const harm = (a, b) => { const r = HARM[root(a)], bb = root(b); return !r ? 45 : r[0].includes(bb) ? 95 : r[1].includes(bb) ? 72 : 45; };
    const q = k => harm(A.py[k].red.n, B.py[k].red.n), lp = q('lp'), su = q('soul'), de = q('exp'), pe = q('pers');
    const west = lp * .4 + su * .3 + de * .2 + pe * .1, fr = FR_SUP[A.ve.mul.n], b = B.ve.mul.n;
    const ved = !fr ? 40 : fr[0].includes(b) ? 95 : fr[1].includes(b) ? 70 : 40;
    const mA = A.ls.missing, mB = B.ls.missing, aF = mB.filter(n => !mA.includes(n)), bF = mA.filter(n => !mB.includes(n)), gaps = mA.length + mB.length;
    const ls = Math.max(50, gaps ? Math.round((aF.length + bF.length) / gaps * 100) : 100);
    const overall = Math.round((west * .5 + ved * .3 + ls * .2) * 10) / 10;
    return {lp, su, de, pe, west: Math.round(west * 10) / 10, ved, ls, overall, tier: overall >= 85 ? 1 : overall >= 72 ? 2 : overall >= 60 ? 3 : 4};
  }

  /* spelling explorer: mechanical letter doubling / suffix only; claims nothing */
  function optimize(name, sys, tr, tc, max) {
    const map = sys === 'py' ? PY : CH, keep = sys === 'py' ? M : [], tot = s => sum(norm(s).letters.map(l => map[l] || 0));
    const cur = norm(name).norm, cs = tot(name), want = tc.length ? tc : (sys === 'ch' && !tr.length ? AUSP : []);
    const words = String(name).trim().split(/\s+/).filter(Boolean), cand = new Set();
    words.forEach((w, wi) => {
      const put = x => cand.add(words.slice(0, wi).concat([x], words.slice(wi + 1)).join(' '));
      [...w].forEach((ch, ci) => { if (/[A-Za-z]/.test(ch)) put(w.slice(0, ci + 1) + ch + w.slice(ci + 1)); });
      ['a','e','i','h','n','s','y'].forEach(e => { if (!w.toLowerCase().endsWith(e)) put(w + e); });
    });
    const hits = [];
    [...cand].sort().forEach(c => { const n = norm(c).norm; if (n === cur) return; const t = tot(c), r = red(t, keep).n; if (want.includes(t) || tr.includes(r)) hits.push({name: c, total: t, root: r, ausp: AUSP.includes(t), dist: Math.abs(n.length - cur.length)}); });
    hits.sort((a, b) => (a.ausp ? 0 : 1) - (b.ausp ? 0 : 1) || a.dist - b.dist || a.total - b.total);
    return {cur: {total: cs, root: red(cs, keep).n, ausp: AUSP.includes(cs)}, list: hits.slice(0, max || 12), count: hits.length};
  }

  return {PY, CH, HE, AUSP, M, KARMIC, sum, digits, norm, red, root, date, dateSum, pyth, stages, chal, vedic, kua, loshu, rel, friends, cycle, transit, heb, compatSup, optimize};
})();
if (typeof module !== 'undefined') module.exports = NE;
