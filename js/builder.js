// Конструктор: форма редактора строится по типу, предпросмотр, сохранение, режим прохождения
const $ = s => document.querySelector(s), P = new URLSearchParams(location.search);
let type = null, id = null;

$('#level').innerHTML = LEVELS.map(l => `<option>${l}</option>`).join('');
Object.entries(TYPES).forEach(([k, v]) => {
  const b = el('button', 'ghost', v.n); b.onclick = () => choose(k); $('#types').append(b);
});

function addRow(vals = []) {
  const r = el('div', 'row');
  TYPES[type].c.forEach((ph, i) => { const inp = el('input'); inp.placeholder = ph; inp.value = vals[i] || ''; r.append(inp); });
  const x = el('button', 'ghost', '✕'); x.onclick = () => { r.remove(); refresh(); };
  r.append(x); $('#rows').append(r);
}

function choose(k, t) {
  type = k;
  [...$('#types').children].forEach(b => b.classList.toggle('on', b.textContent === TYPES[k].n));
  $('#form').hidden = false; $('#hint').textContent = TYPES[k].h; $('#rows').innerHTML = '';
  if (t) { $('#title').value = t.title; $('#instr').value = t.instr; $('#level').value = t.level; $('#n').value = t.n; t.rows.forEach(addRow); }
  else addRow();
}

const draft = () => ({
  id: id || 't' + Date.now(), type, own: true, title: $('#title').value.trim(), instr: $('#instr').value.trim(),
  level: $('#level').value, n: +$('#n').value || 0,
  rows: [...$('#rows').children].map(r => [...r.querySelectorAll('input')].map(i => i.value.trim())).filter(v => v[0])
});

function valid(d) {
  const T = TYPES[type];
  if (!d.title) return 'Введите название задания.';
  if (!d.rows.length) return 'Добавьте хотя бы одну строку.';
  if (!d.rows.every(v => v.slice(0, T.need).every(Boolean))) return 'Заполните все обязательные поля в строках.';
  if (type === 'error' && !d.rows.some(v => v[1])) return 'Укажите пояснение у строки с ошибкой.';
  if (type === 'fill' && !d.rows.every(v => v[0].includes('____'))) return 'В каждом тексте нужен пропуск ____.';
  if ((type === 'single' || type === 'multi') && !d.rows.every(v => v[2].split(',').every(k => +k >= 1 && +k <= v[1].split(';').length)))
    return 'Номера верных ответов должны соответствовать вариантам.';
  return '';
}

function preview() {
  const d = draft(), m = valid(d); $('#prev').innerHTML = '';
  if (m) $('#prev').textContent = m; else runPlayer([d], $('#prev'), null);
}
const refresh = () => { if (!$('#prev').hidden) preview(); };
const tab = p => {
  $('#edit').hidden = p; $('#prev').hidden = !p;
  $('#tEdit').className = p ? 'ghost' : 'on'; $('#tPrev').className = p ? 'on' : 'ghost';
  if (p) preview();
};
$('#tEdit').onclick = () => tab(false);
$('#tPrev').onclick = () => tab(true);
$('#add').onclick = () => type && addRow();
$('#form').addEventListener('input', refresh);
$('#save').onclick = () => {
  const d = draft(), m = valid(d);
  if (m) { $('#msg').textContent = m; return; }
  const all = Store.all(), i = all.findIndex(t => t.id === d.id);
  if (i < 0) all.push(d); else all[i] = d;
  Store.save(all); location.href = 'index.html#mine';
};

const pid = P.get('play'), eid = P.get('edit'), t0 = Store.get(pid || eid);
if (pid || eid) {
  if (!t0) { $('#editor').textContent = 'Задание не найдено.'; }
  else if (pid) { $('#editor').hidden = true; $('#play').hidden = false; runPlayer([t0], $('#play'), () => location.href = 'index.html'); }
  else { id = t0.id; choose(t0.type, t0); }
}
