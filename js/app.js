// Три дня телефониста. Все тексты выводятся через textContent.
(() => {
  const $ = id => document.getElementById(id), card = $('card'), desk = $('desk'), bar = $('bar'), tags = $('tags'), live = $('live'), hg = $('house').getContext('2d');
  const KIND = { call: 'Звонок', sms: 'СМС', chat: 'Сообщение', mail: 'Письмо' };
  const DAYS = [{ scam: 3, fair: 3, checks: 7 }, { scam: 4, fair: 3, checks: 7 }, { scam: 5, fair: 3, checks: 6 }];
  const ALL = DAYS.reduce((n, d) => n + d.scam + d.fair, 0);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let day = 0, pool = {}, harmed = [], chased = {}, dayRight = 0, daySaved = 0, dayLost = 0, shift = [], at = 0, left = 0, used = {}, saved = 0, lost = 0, right = 0, dropped = 0, log = [], state, notes, onKey = null, f = 10;

  function el(tag, cls, ...kids) { const n = document.createElement(tag); if (cls) n.className = cls; for (const k of kids) if (k != null) n.append(k); return n; }
  function button(cls, fn, ...kids) { const b = el('button', cls, ...kids); b.type = 'button'; b.onclick = fn; return b; }
  const money = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  const who = c => CATS.find(x => x.id === c.to), room = c => CATS.findIndex(x => x.id === c.to);
  const checksFor = c => [['ask', 'Спросить ' + who(c).acc, 'ждёт ли это'], ['call', 'Перезвонить', 'по настоящему номеру'], ['look', 'Рассмотреть', 'номер, файл или ссылку']];

  // ?seed=5 делает смену повторяемой
  const given = Number(new URLSearchParams(location.search).get('seed')); let s0 = given > 0 ? given : 0;
  const rnd = () => s0 ? (s0 = (s0 * 16807) % 2147483647) / 2147483647 : Math.random();
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ===== дом: имена и последствия подписаны словами
  function paint() { Pixel.house(hg, state, f); }
  function label() {
    tags.replaceChildren(...CATS.map((c, i) => {
      const t = el('div', 'tag ' + state[i], el('b', '', c.name), el('span', '', notes[i] || c.about));
      t.style.left = (5 + (i % 3) * 66) / 204 * 100 + '%'; t.style.top = (15 + (i / 3 | 0) * 50) / 118 * 100 + '%'; return t;
    }));
  }
  function refresh() { paint(); label(); }
  function reset() { state = CATS.map(() => 'idle'); notes = CATS.map((c, i) => harmed[i] ? 'потеря ' + money(harmed[i]) : ''); refresh(); }

  function progress() {
    const total = shift.length, text = 'День ' + (day + 1) + ' из ' + DAYS.length + ', вызов ' + Math.min(at + 1, total) + ' из ' + total;
    const row = el('div', 'steps'); row.setAttribute('role', 'img'); row.setAttribute('aria-label', text);
    for (let i = 0; i < total; i++) row.append(el('i', log[i] === undefined ? (i === at ? 'now' : '') : log[i] ? 'ok' : 'bad'));
    bar.replaceChildren(el('div', '', el('small', '', text), row), el('div', 'sum', el('small', '', 'Спасено'), el('b', '', money(saved))));
  }
  const step = (n, text, ...kids) => el('section', 'step', el('h3', '', el('i', '', String(n)), text), ...kids);

  // ===== начало
  function start() {
    harmed = CATS.map(() => 0); reset(); bar.replaceChildren();
    const how = (n, icon, color, title, text) => el('li', '', Pixel.icon(icon, color), el('div', '', el('b', '', title), el('span', '', text)));
    card.replaceChildren(el('h1', '', 'Кот на проводе'), el('p', 'lead', 'Все звонки и сообщения этого дома идут через тебя. Не дай мошенникам обмануть котов.'));
    desk.replaceChildren(el('ol', 'how', how(1, 'chat', undefined, 'Прочитай', 'Кто и что хочет от кота'), how(2, 'look', undefined, 'Проверь', 'Если есть сомнения. Проверок не хватит на всё'), how(3, 'yes', '#2f7560', 'Реши', 'Пропустить или заблокировать')),
      button('big go', begin, 'Начать'), el('p', 'note', 'Три дня, около десяти минут.'));
    onKey = null;
  }
  function begin() {
    pool = { scam: shuffle(CALLS.filter(c => c.scam)), fair: shuffle(CALLS.filter(c => !c.scam)) };
    day = saved = lost = right = dropped = 0; harmed = CATS.map(() => 0); chased = {}; openDay();
  }
  function openDay() {
    const d = DAYS[day], scams = pool.scam.splice(0, d.scam), fair = pool.fair.splice(0, d.fair);
    // обманутому жильцу на следующий день обещают вернуть деньги
    const i = day ? CATS.findIndex((c, n) => harmed[n] && !chased[c.id]) : -1;
    if (i >= 0) { const k = CATS[i]; chased[k.id] = true; scams[scams.length - 1] = { ...COMEBACK, to: k.id, ask: COMEBACK.ask.replace('{name}', k.name) }; }
    shift = shuffle([...scams, ...fair]); at = dayRight = daySaved = dayLost = 0; left = d.checks; log = []; reset(); ring();
  }

  // ===== вызов
  function message(c) {
    const k = who(c);
    return [el('header', '', Pixel.icon(c.kind), el('div', '', el('small', '', KIND[c.kind] + ' для ' + k.gen), el('h2', '', c.from))), el('div', 'talk', ...c.lines.map(t => el('p', 'say', t)))];
  }
  function ring() {
    const c = shift[at], i = room(c); used = {}; state = state.map(s => s === 'ring' ? 'idle' : s); state[i] = 'ring'; notes[i] = { call: 'звонят' }[c.kind] || 'пишут'; refresh(); draw();
    live.textContent = 'День ' + (day + 1) + ', вызов ' + (at + 1) + ' из ' + shift.length + '. ' + KIND[c.kind] + ' для ' + who(c).gen + '. ' + c.from + ': ' + c.lines.join(' ');
    onKey = e => { if (e.key >= '1' && e.key <= '3') check(['ask', 'call', 'look'][e.key - 1]); else if (e.key === 'ArrowLeft') decide(false); else if (e.key === 'ArrowRight') decide(true); };
    scrollTo(0, 0);
  }
  function draw(focus) {
    const c = shift[at], k = who(c), list = checksFor(c); progress();
    card.replaceChildren(...message(c), ...list.filter(([n]) => used[n]).map(([n, t]) => el('div', 'clue', Pixel.icon(n), el('div', '', el('small', '', t), el('p', '', c[n])))));
    const pips = el('span', 'pips', 'осталось ' + left);
    const row = el('div', 'checks');
    for (const [n, t, sub] of list) { const b = button('check', () => check(n), Pixel.icon(n), el('b', '', used[n] ? 'Проверено' : t), el('small', '', used[n] ? 'ответ выше' : sub)); b.disabled = !!used[n] || left === 0; row.append(b); }
    const s2 = step(1, 'Сомневаешься? Проверь', row); s2.querySelector('h3').append(pips);
    const hint = day === 0 && at === 0 && left === DAYS[0].checks ? el('p', 'hint', 'Первый вызов: начни с кнопки «' + list[0][1] + '».') : null;
    const s3 = step(2, 'Реши',  el('div', 'decide', button('big no', () => decide(false), Pixel.icon('no', '#fff'), el('span', '', 'Мошенник', el('small', '', 'заблокировать'))), button('big yes', () => decide(true), Pixel.icon('yes', '#fff'), el('span', '', 'Всё честно', el('small', '', 'пропустить к ' + k.dat)))));
    s3.classList.add('final'); desk.replaceChildren(...[hint, s2, s3].filter(Boolean));
    if (focus) (desk.querySelector('.check:not(:disabled)') || desk.querySelector('.no')).focus({ preventScroll: true });
  }
  function check(n) {
    if (used[n] || left === 0) return;
    used[n] = true; left--; draw(true); live.textContent = shift[at][n] + ' Осталось проверок: ' + left;
    const last = card.querySelector('.clue:last-child'); if (last) last.scrollIntoView({ block: 'nearest' });
  }

  // ===== решение
  function decide(connect) {
    const c = shift[at], k = who(c), i = room(c), good = connect !== c.scam; onKey = null; log[at] = good; if (good) { right++; dayRight++; }
    let head, text;
    if (c.scam && !connect) { saved += c.sum; daySaved += c.sum; state[i] = 'ok'; notes[i] = 'в безопасности'; head = 'Правильно, это мошенник'; text = 'Спасено ' + money(c.sum); }
    else if (c.scam) { lost += c.sum; dayLost += c.sum; harmed[i] += c.sum; state[i] = 'lost'; notes[i] = '−' + money(c.sum); head = 'Нет, это был мошенник'; text = k.name + ' теряет ' + money(c.sum); }
    else if (connect) { state[i] = 'ok'; notes[i] = 'на связи'; head = 'Правильно, всё честно'; text = 'Вызов дошёл до адресата'; }
    else { dropped++; state[i] = 'hurt'; notes[i] = 'без связи'; head = 'Нет, всё было честно'; text = k.name + ' остаётся без важного вызова'; }
    if (harmed[i]) notes[i] = 'потеря ' + money(harmed[i]);
    refresh(); progress();
    card.replaceChildren(...message(c));
    const next = button('big go', () => { at++; at < shift.length ? ring() : day + 1 < DAYS.length ? evening() : finish(); }, at + 1 < shift.length ? 'Следующий вызов' : day + 1 < DAYS.length ? 'Закончить день' : 'Посмотреть итог');
    desk.replaceChildren(el('div', 'result ' + (good ? 'good' : 'fail'), Pixel.icon(good ? 'yes' : 'no', '#fff'), el('div', '', el('h2', '', head), el('b', '', text))), el('p', 'why', el('b', '', 'Как понять: '), c.why), next);
    live.textContent = head + '. ' + text + '. ' + c.why; next.focus({ preventScroll: true });
    if (matchMedia('(max-width: 900px)').matches) desk.scrollIntoView({ block: 'nearest' });
  }

  // ===== итог
  const stat = (v, t) => el('div', 'stat', el('b', '', v), el('small', '', t));
  function evening() {
    const n = DAYS[day + 1], prey = CATS.find((c, i) => harmed[i] && !chased[c.id]); at = shift.length - 1; onKey = null; progress();
    const words = prey ? 'Завтра будь внимательнее к вызовам для ' + prey.gen + ': обманутых часто ищут снова.' : (dayLost ? '' : 'Сегодня никто не потерял деньги. ') + 'Завтра мошенников будет больше.';
    card.replaceChildren(el('h1', '', 'День ' + (day + 1) + ' закончен'), el('p', 'lead', words));
    const go = button('big go', () => { day++; openDay(); }, 'Начать день ' + (day + 2));
    desk.replaceChildren(el('div', 'stats', stat(dayRight + ' из ' + shift.length, 'верных решений'), stat(money(daySaved), 'спасено за день'), stat(money(dayLost), 'потеряно за день')), el('p', 'why', 'Завтра вызовов: ' + (n.scam + n.fair) + ', проверок: ' + n.checks + '.'), go);
    live.textContent = 'День закончен. ' + words; go.focus({ preventScroll: true }); scrollTo(0, 0);
  }
  function rank() { const k = right / ALL; return k === 1 ? 'Ни одной ошибки' : k >= .8 ? 'Надёжный телефонист' : k >= .55 ? 'Нужна тренировка' : 'Мошенники довольны'; }
  function finish() {
    const name = rank(), pic = poster(name), note = el('p', 'note'); note.setAttribute('role', 'status'); at = shift.length - 1; progress();
    pic.className = 'poster'; pic.setAttribute('role', 'img'); pic.setAttribute('aria-label', name + '. Спасено ' + money(saved));
    card.replaceChildren(pic, el('h1', '', name));
    const save = button('check plain', () => pic.toBlob(b => { const a = el('a'); a.href = URL.createObjectURL(b); a.download = 'kot-na-provode.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); note.textContent = 'Картинка сохранена.'; }), 'Сохранить картинку');
    const share = button('check plain', () => pic.toBlob(async b => {
      const text = 'Кот на проводе: спасено ' + money(saved) + '.' + (location.protocol.startsWith('http') ? ' ' + location.origin + location.pathname : ''), file = new File([b], 'kot-na-provode.png', { type: 'image/png' });
      try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text }); else { await navigator.clipboard.writeText(text); note.textContent = 'Текст скопирован.'; } }
      catch (e) { if (e.name !== 'AbortError') note.textContent = 'Не получилось. Сохрани картинку и отправь её.'; }
    }), 'Поделиться');
    desk.replaceChildren(el('div', 'stats', stat(right + ' из ' + ALL, 'верных решений'), stat(money(lost), 'потеряно'), stat(String(dropped), 'честных заблокировано')), el('div', 'checks two', save, share), button('big go', begin, 'Сыграть ещё'), note);
    live.textContent = name + '. Спасено ' + money(saved); scrollTo(0, 0);
  }
  function poster(name) {
    const c = el('canvas'); c.width = 1200; c.height = 630; const g = c.getContext('2d'); g.fillStyle = '#e3eaea'; g.fillRect(0, 0, 1200, 630);
    const t = el('canvas'); t.width = 204; t.height = 118; Pixel.house(t.getContext('2d'), state, 10); g.imageSmoothingEnabled = false; g.drawImage(t, 536, 140, 204 * 3, 118 * 3);
    const font = (w, s) => w + ' ' + s + 'px "Segoe UI", system-ui, sans-serif';
    g.fillStyle = '#55626a'; g.font = font(400, 34); g.fillText('Спасено, ₽', 60, 190);
    const str = String(saved); Pixel.dots(g, str, 60, 220, Math.min(13, 400 / (str.length * 6 - 1)));
    g.fillStyle = '#2a3135'; g.font = font(600, 36); g.fillText(name, 60, 400); g.fillStyle = '#55626a'; g.font = font(400, 30); g.fillText('Кот на проводе', 60, 455);
    return c;
  }

  addEventListener('keydown', e => { if (onKey && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) onKey(e); });
  if (!calm) setInterval(() => { if (!document.hidden) { f++; paint(); } }, 120);
  start();
})();
