// Отрисовка заданий, проверка ответов и проигрыватель (прогресс, итог, конфетти)
const mark = (e, ok) => { e.classList.remove('good', 'bad'); void e.offsetWidth; e.classList.add(ok ? 'good' : 'bad'); };

// случайная выборка из банка (порядок строк сохраняется)
const pick = t => t.type === 'error' || !t.n || t.n >= t.rows.length ? t.rows :
  shuffle(t.rows.map((r, i) => i)).slice(0, t.n).sort((a, b) => a - b).map(i => t.rows[i]);

// Drag & Drop: chips перетаскиваются в zones (у зоны может быть свой метод take)
function dnd(chips, zones) {
  let cur;
  chips.forEach(c => {
    c.draggable = true;
    c.ondragstart = () => { cur = c; c.classList.add('drag'); };
    c.ondragend = () => c.classList.remove('drag');
  });
  zones.forEach(z => {
    z.ondragover = e => { e.preventDefault(); z.classList.add('over'); };
    z.ondragleave = () => z.classList.remove('over');
    z.ondrop = e => { e.preventDefault(); z.classList.remove('over'); if (cur) (z.take || (x => z.append(x)))(cur); };
  });
}

// Каждый рендерер строит задание в box и возвращает функцию проверки → {ok, total, fb}
const R = {};

const choice = multi => (rows, box) => {
  const qs = rows.map(([q, o, k]) => {
    const f = el('fieldset', 'q'), nm = 'n' + Math.random();
    f.append(el('legend', '', q));
    shuffle(o.split(';').map((t, i) => [t.trim(), String(i + 1)])).forEach(([t, i]) => {
      const l = el('label', 'opt'), inp = el('input');
      inp.type = multi ? 'checkbox' : 'radio'; inp.name = nm; inp.value = i;
      l.append(inp, ' ' + t); f.append(l);
    });
    box.append(f);
    return { f, good: k.split(',').map(x => x.trim()).sort() };
  });
  return () => {
    let ok = 0; const fb = [];
    qs.forEach(({ f, good }) => {
      const inputs = [...f.querySelectorAll('input')];
      const got = inputs.filter(i => i.checked).map(i => i.value).sort();
      const r = got.join() === good.join();
      ok += +r; mark(f, r);
      if (!r) fb.push('«' + f.querySelector('legend').textContent + '» — верно: ' +
        good.map(g => inputs.find(i => i.value === g).parentNode.textContent.trim()).join(', '));
    });
    return { ok, total: qs.length, fb };
  };
};
R.single = choice(false);
R.multi = choice(true);

R.sequence = (rows, box) => {
  const ul = el('ul', 'seq');
  shuffle(rows.map((r, i) => [r[0], i])).forEach(([t, i]) => { const li = el('li', 'chip', t); li.dataset.k = i; ul.append(li); });
  let cur;
  [...ul.children].forEach(c => {
    c.draggable = true;
    c.ondragstart = () => { cur = c; c.classList.add('drag'); };
    c.ondragend = () => c.classList.remove('drag');
    c.ondragover = e => {
      e.preventDefault(); if (cur === c) return;
      const r = c.getBoundingClientRect();
      ul.insertBefore(cur, e.clientY < r.top + r.height / 2 ? c : c.nextSibling);
    };
  });
  box.append(ul);
  return () => {
    let ok = 0;
    [...ul.children].forEach((c, i) => { const r = +c.dataset.k === i; ok += +r; mark(c, r); });
    return { ok, total: rows.length, fb: ok < rows.length ? ['Верный порядок: ' + rows.map(r => r[0]).join(' → ')] : [] };
  };
};

R.match = (rows, box) => {
  const pool = el('div', 'pool zone'), wrap = el('div', 'pairs');
  const slots = rows.map(([a], i) => {
    const r = el('div', 'pair'), s = el('div', 'slot zone');
    s.dataset.k = i;
    s.take = c => { [...s.children].forEach(x => pool.append(x)); s.append(c); };
    r.append(el('span', 'term', a), s); wrap.append(r);
    return s;
  });
  shuffle(rows.map(([, b], i) => { const c = el('span', 'chip', b); c.dataset.k = i; return c; })).forEach(c => pool.append(c));
  dnd([...pool.children], [...slots, pool]);
  box.append(wrap, pool);
  return () => {
    let ok = 0;
    slots.forEach(s => { const c = s.firstChild, r = !!c && c.dataset.k === s.dataset.k; ok += +r; mark(s, r); });
    return { ok, total: rows.length, fb: ok < rows.length ? ['Верные пары: ' + rows.map(r => r[0] + ' — ' + r[1]).join('; ')] : [] };
  };
};

R.sort = R.bucket = (rows, box) => {
  const cats = [...new Set(rows.map(r => r[1]))], pool = el('div', 'pool zone'), wrap = el('div', 'buckets');
  const zs = cats.map(c => { const z = el('div', 'zone bucket'); z.dataset.c = c; z.append(el('h4', '', c)); wrap.append(z); return z; });
  shuffle(rows).forEach(([t, c]) => { const ch = el('span', 'chip', t); ch.dataset.c = c; pool.append(ch); });
  dnd([...pool.children], [...zs, pool]);
  box.append(pool, wrap);
  return () => {
    let ok = 0;
    box.querySelectorAll('.chip').forEach(c => { const r = c.parentNode.dataset.c === c.dataset.c; ok += +r; mark(c, r); });
    return { ok, total: rows.length, fb: ok < rows.length ? ['Правильно: ' + cats.map(c => c + ' — ' + rows.filter(r => r[1] === c).map(r => r[0]).join(', ')).join('; ')] : [] };
  };
};

R.fill = (rows, box) => {
  const items = rows.map(([t, a]) => {
    const p = el('p', 'q'), [x, ...y] = t.split('____'), i = el('input', 'gap');
    p.append(x, i, y.join('____')); box.append(p);
    return { p, i, a: a.split('|').map(s => s.trim().toLowerCase()) };
  });
  return () => {
    let ok = 0; const fb = [];
    items.forEach(({ p, i, a }) => {
      const r = a.includes(i.value.trim().toLowerCase());
      ok += +r; mark(p, r); if (!r) fb.push('Допустимые ответы: ' + a.join(' / '));
    });
    return { ok, total: items.length, fb };
  };
};

R.error = (rows, box) => {
  let sel = -1; const pre = el('div', 'code');
  rows.forEach(([l], i) => {
    const d = el('div', 'line', l);
    d.onclick = () => { sel = i; [...pre.children].forEach(x => x.classList.toggle('sel', x === d)); };
    pre.append(d);
  });
  box.append(el('p', '', 'Нажмите на строку с ошибкой:'), pre);
  return () => {
    const bad = rows.findIndex(r => r[1]), r = sel >= 0 && !!rows[sel][1];
    mark(pre.children[sel] || pre, r);
    return { ok: +r, total: 1, fb: [r ? rows[sel][1] : 'Ошибка в строке ' + (bad + 1) + ': ' + rows[bad][1]] };
  };
};

function confetti() {
  for (let i = 0; i < 70; i++) {
    const c = el('i', 'conf');
    c.style.cssText = `left:${Math.random() * 100}vw;background:hsl(${Math.random() * 360},80%,55%);animation-delay:${Math.random() * .8}s`;
    document.body.append(c); setTimeout(() => c.remove(), 3600);
  }
}

// Проигрыватель: проходит задания по очереди, считает общий результат
function runPlayer(tasks, box, exit) {
  let i = 0, ok = 0, total = 0;
  const next = () => {
    if (i >= tasks.length) return done();
    const t = tasks[i]; box.innerHTML = '';
    const bar = el('div', 'bar'), fill = el('i'), body = el('div', 'play fade'), res = el('div', 'fb'), btn = el('button', '', 'Проверить');
    fill.style.width = i / tasks.length * 100 + '%'; bar.append(fill);
    body.append(el('h2', '', t.title), el('p', '', t.instr || ''));
    const chk = R[t.type](pick(t), body);
    btn.onclick = () => {
      if (btn.dataset.done) { i++; return next(); }
      const r = chk(); ok += r.ok; total += r.total;
      res.innerHTML = `<b>Правильно — ${r.ok}; Ошибки — ${r.total - r.ok}</b>` + r.fb.map(x => '<p>' + esc(x) + '</p>').join('');
      fill.style.width = (i + 1) / tasks.length * 100 + '%';
      btn.dataset.done = 1; btn.textContent = i + 1 < tasks.length ? 'Дальше' : 'Результат';
    };
    box.append(bar, body, res, btn);
  };
  const done = () => {
    const p = total ? Math.round(ok / total * 100) : 0; box.innerHTML = '';
    const d = el('div', 'result fade');
    d.innerHTML = `<h2>Результат</h2><div class="big">0%</div><p>Правильно — ${ok}; Ошибки — ${total - ok}; Результат — ${p}%</p>` +
      `<p>${p >= 80 ? 'Отличная работа!' : p >= 50 ? 'Неплохо. Повторите материал и попробуйте ещё раз.' : 'Попробуйте ещё раз: подсказки помогут исправить ошибки.'}</p>`;
    const again = el('button', '', 'Пройти ещё раз'); again.onclick = () => runPlayer(tasks, box, exit);
    d.append(again);
    if (exit) { const b = el('button', 'ghost', 'К заданиям'); b.onclick = exit; d.append(' ', b); }
    box.append(d);
    let n = 0; const big = d.querySelector('.big');
    const iv = setInterval(() => { n = Math.min(p, n + 2); big.textContent = n + '%'; if (n >= p) clearInterval(iv); }, 20);
    if (p >= 80) confetti();
  };
  next();
}
