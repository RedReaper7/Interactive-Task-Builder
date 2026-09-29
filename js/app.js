// Витрина: карточки, поиск, фильтры, «Мои задания», случайный микс
const $ = s => document.querySelector(s);
const q = $('#q'), ft = $('#ft'), fl = $('#fl'), box = $('#cards');
ft.innerHTML = '<option value="">Все типы</option>' + Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join('');
fl.innerHTML = '<option value="">Любая сложность</option>' + LEVELS.map(l => `<option>${l}</option>`).join('');

function render() {
  const mine = location.hash === '#mine', s = q.value.trim().toLowerCase();
  const list = Store.all().filter(t => (!mine || t.own) && t.title.toLowerCase().includes(s) &&
    (!ft.value || t.type === ft.value) && (!fl.value || t.level === fl.value));
  box.innerHTML = '';
  if (!list.length) box.textContent = mine ? 'Своих заданий пока нет. Нажмите «Создать», чтобы добавить первое.' : 'Ничего не найдено. Измените поиск или фильтры.';
  list.forEach((t, i) => {
    const c = el('div', 'card fade'); c.style.animationDelay = i * 60 + 'ms';
    c.innerHTML = `<span class="tag">${TYPES[t.type].n}</span><h3>${esc(t.title)}</h3><p>Сложность: ${t.level}. Элементов: ${t.rows.length}</p>`;
    const a = el('a', 'btn', 'Начать'); a.href = 'builder.html?play=' + t.id; c.append(a);
    if (t.own) {
      const e = el('a', 'btn ghost', 'Изменить'); e.href = 'builder.html?edit=' + t.id;
      const d = el('button', 'ghost', 'Удалить');
      d.onclick = () => { Store.save(Store.all().filter(x => x.id !== t.id)); render(); };
      c.append(' ', e, ' ', d);
    }
    box.append(c);
  });
}

$('#mix').onclick = () => {
  const tasks = shuffle(Store.all()).slice(0, 3), p = $('#play');
  $('#list').hidden = true; p.hidden = false;
  runPlayer(tasks, p, () => location.reload());
};
q.oninput = ft.onchange = fl.onchange = render;
window.onhashchange = render;
render();
