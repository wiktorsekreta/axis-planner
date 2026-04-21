'use strict';

const STORAGE_KEY    = 'vesta_tasks';
const CATEGORIES_KEY = 'vesta_categories';

const DAYS_PL   = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                   'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const SHORT_DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

// ── STAN ───────────────────────────────────────────────────────────────────
let currentView = 'day';
let currentDate = new Date();
let tasks       = loadStorage(STORAGE_KEY, {});
let categories  = loadStorage(CATEGORIES_KEY, []);
let selectedCatIds = [];

// ── DOM ────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
	dateTitle:      $('dateTitle'),
	prev:           $('prev'),
	next:           $('next'),
	dayView:        $('dayView'),
	weekView:       $('weekView'),
	monthView:      $('monthView'),
	monthGrid:      $('monthGrid'),
	weekGrid:       $('weekGrid'),
	taskList:       $('taskList'),
	taskCount:      $('taskCount'),
	emptyState:     $('emptyState'),
	addBtn:         $('addTaskBtn'),
	titleInput:     $('task-title'),
	timeInput:      $('task-time'),
	descInput:      $('task-desc'),
	catChipsPicker: $('catChipsPicker'),
};

const catEls = {
	catCount:     $('catCount'),
	addCatBtn:    $('addCatBtn'),
	catNameInput: $('cat-name'),
	catList:      $('catList'),
};

// ── INICJALIZACJA ──────────────────────────────────────────────────────────
document.querySelectorAll('.toggle-btn').forEach(btn =>
	btn.addEventListener('click', () => switchView(btn.dataset.view))
);
els.prev.addEventListener('click', navigate.bind(null, -1));
els.next.addEventListener('click', navigate.bind(null, 1));
els.addBtn.addEventListener('click', addTask);
els.titleInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
catEls.addCatBtn.addEventListener('click', addCategory);
catEls.catNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addCategory(); });

renderCategories();
render();

// ── WIDOKI ─────────────────────────────────────────────────────────────────
function switchView(view) {
	currentView = view;
	document.querySelectorAll('.toggle-btn').forEach(b =>
		b.classList.toggle('active', b.dataset.view === view)
	);
	['day', 'week', 'month'].forEach(v =>
		els[`${v}View`].classList.toggle('hidden', v !== view)
	);
	render();
}

function navigate(dir) {
	const d = new Date(currentDate);
	if      (currentView === 'day')   d.setDate(d.getDate() + dir);
	else if (currentView === 'week')  d.setDate(d.getDate() + dir * 7);
	else                              d.setMonth(d.getMonth() + dir);
	currentDate = d;
	render();
}

function render() {
	({ day: renderDay, week: renderWeek, month: renderMonth })[currentView]();
}

// ── DZIEŃ ──────────────────────────────────────────────────────────────────
function renderDay() {
	const d = currentDate;
	els.dateTitle.textContent =
		`${DAYS_PL[d.getDay()]}, ${d.getDate()} ${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
	renderTaskList(dateKey(d));
}

// ── TYDZIEŃ ────────────────────────────────────────────────────────────────
function renderWeek() {
	const monday = getMonday(currentDate);
	const sunday = new Date(monday);
	sunday.setDate(sunday.getDate() + 6);

	els.dateTitle.textContent =
		`${monday.getDate()} ${MONTHS_PL[monday.getMonth()]} – ` +
		`${sunday.getDate()} ${MONTHS_PL[sunday.getMonth()]} ${sunday.getFullYear()}`;

	els.weekGrid.innerHTML = '';
	const today    = dateKey(new Date());
	const selected = dateKey(currentDate);

	for (let i = 0; i < 7; i++) {
		const day  = new Date(monday);
		day.setDate(day.getDate() + i);
		const key      = dateKey(day);
		const dayTasks = tasks[key] || [];

		const col = document.createElement('div');
		col.className =
			'week-day-col' +
			(key === today    ? ' today'    : '') +
			(key === selected ? ' selected' : '');

		const nameEl = document.createElement('div');
		nameEl.className   = 'week-day-name';
		nameEl.textContent = SHORT_DAYS[i];

		const numEl = document.createElement('div');
		numEl.className   = 'week-day-num';
		numEl.textContent = day.getDate();

		col.append(nameEl, numEl);

		dayTasks.slice(0, 5).forEach(t => {
			const dot = document.createElement('div');
			dot.className   = 'week-task-item';
			dot.textContent = (t.time ? t.time + ' ' : '') + t.title;
			col.appendChild(dot);
		});
		if (dayTasks.length > 5) {
			const more = document.createElement('div');
			more.className   = 'week-task-item';
			more.textContent = `+${dayTasks.length - 5} więcej`;
			col.appendChild(more);
		}

		col.addEventListener('click', () => { currentDate = new Date(day); switchView('day'); });
		els.weekGrid.appendChild(col);
	}
}

// ── MIESIĄC ────────────────────────────────────────────────────────────────
function renderMonth() {
	const y = currentDate.getFullYear();
	const m = currentDate.getMonth();
	els.dateTitle.textContent = `${MONTHS_PL[m]} ${y}`;

	const firstDay = new Date(y, m, 1);
	const lastDay  = new Date(y, m + 1, 0);
	let startDow   = firstDay.getDay() - 1;
	if (startDow < 0) startDow = 6;

	const today    = dateKey(new Date());
	const selected = dateKey(currentDate);

	els.monthGrid.innerHTML = '';

	for (let i = 0; i < startDow; i++)
		els.monthGrid.appendChild(createMonthCell(new Date(y, m, 1 - (startDow - i)), today, selected, true));

	for (let d = 1; d <= lastDay.getDate(); d++)
		els.monthGrid.appendChild(createMonthCell(new Date(y, m, d), today, selected, false));

	const remainder = (startDow + lastDay.getDate()) % 7;
	for (let i = 1; i <= (remainder === 0 ? 0 : 7 - remainder); i++)
		els.monthGrid.appendChild(createMonthCell(new Date(y, m + 1, i), today, selected, true));
}

function createMonthCell(day, today, selected, otherMonth) {
	const key      = dateKey(day);
	const dayTasks = tasks[key] || [];

	const cell = document.createElement('div');
	cell.className =
		'month-day' +
		(key === today    ? ' today'       : '') +
		(key === selected ? ' selected'    : '') +
		(otherMonth       ? ' other-month' : '');

	const numEl = document.createElement('div');
	numEl.className   = 'day-num';
	numEl.textContent = day.getDate();
	cell.appendChild(numEl);

	dayTasks.slice(0, 3).forEach(t => {
		const dot = document.createElement('div');
		dot.className   = 'month-task-dot';
		dot.textContent = (t.time ? t.time + ' ' : '') + t.title;
		cell.appendChild(dot);
	});
	if (dayTasks.length > 3) {
		const more = document.createElement('div');
		more.className   = 'month-task-dot';
		more.textContent = `+${dayTasks.length - 3}`;
		cell.appendChild(more);
	}

	cell.addEventListener('click', () => { currentDate = new Date(day); switchView('day'); });
	return cell;
}

// ── LISTA ZADAŃ ────────────────────────────────────────────────────────────
function renderTaskList(key) {
	const dayTasks = (tasks[key] || []).slice().sort((a, b) => {
		if (!a.time && !b.time) return 0;
		if (!a.time) return 1;
		if (!b.time) return -1;
		return a.time.localeCompare(b.time);
	});

	[...els.taskList.children].forEach(c => { if (c !== els.emptyState) c.remove(); });

	if (dayTasks.length === 0) {
		els.emptyState.style.display = '';
		els.taskCount.textContent    = '0';
		return;
	}

	els.emptyState.style.display = 'none';
	els.taskCount.textContent    = dayTasks.length;

	dayTasks.forEach(t => {
		const catTags = (t.categoryIds || [])
			.map(id => categories.find(c => c.id === id))
			.filter(Boolean)
			.map(c => `<span class="task-cat-tag">${escHtml(c.name)}</span>`)
			.join('');

		const item = document.createElement('div');
		item.className  = 'task-item' + (t.done ? ' completed' : '');
		item.dataset.id = t.id;
		item.innerHTML  = `
            <div class="task-time-badge">${t.time || '––'}</div>
            <div class="task-body">
                <div class="task-title">${escHtml(t.title)}</div>
                ${t.desc    ? `<div class="task-desc">${escHtml(t.desc)}</div>` : ''}
                ${catTags   ? `<div class="task-cats">${catTags}</div>`         : ''}
            </div>
            <div class="task-actions">
                <button class="task-check"  title="Oznacz jako wykonane">✓</button>
                <button class="task-delete" title="Usuń zadanie">✕</button>
            </div>`;

		item.querySelector('.task-check') .addEventListener('click', () => toggleDone(key, t.id));
		item.querySelector('.task-delete').addEventListener('click', () => deleteTask(key, t.id));
		els.taskList.insertBefore(item, els.emptyState);
	});
}

// ── OPERACJE NA ZADANIACH ──────────────────────────────────────────────────
function addTask() {
	const title = els.titleInput.value.trim();
	if (!title) { flashError(els.titleInput); return; }

	const key = dateKey(currentDate);
	if (!tasks[key]) tasks[key] = [];

	tasks[key].push({
		id:          crypto.randomUUID(),
		title,
		time:        els.timeInput.value || '',
		desc:        els.descInput.value.trim(),
		done:        false,
		categoryIds: [...selectedCatIds],
	});

	saveTasks();
	els.titleInput.value = '';
	els.timeInput.value  = '';
	els.descInput.value  = '';
	selectedCatIds       = [];
	renderCategorySelector();
	renderTaskList(key);
}

function toggleDone(key, id) {
	const t = (tasks[key] || []).find(x => x.id === id);
	if (t) { t.done = !t.done; saveTasks(); renderTaskList(key); }
}

function deleteTask(key, id) {
	if (!tasks[key]) return;
	tasks[key] = tasks[key].filter(x => x.id !== id);
	if (tasks[key].length === 0) delete tasks[key];
	saveTasks();
	renderTaskList(key);
}

// ── KATEGORIE ─────────────────────────────────────────────────────────────
function addCategory() {
	const name = catEls.catNameInput.value.trim();
	if (!name) { flashError(catEls.catNameInput); return; }
	categories.push({ id: crypto.randomUUID(), name });
	saveCategories();
	catEls.catNameInput.value = '';
	renderCategories();
}

function deleteCategory(id) {
	categories     = categories.filter(c => c.id !== id);
	selectedCatIds = selectedCatIds.filter(cid => cid !== id);
	saveCategories();
	renderCategories();
	renderTaskList(dateKey(currentDate));
}

function renderCategories() {
	catEls.catCount.textContent = categories.length;
	catEls.catList.innerHTML    = '';

	if (categories.length === 0) {
		const empty = document.createElement('div');
		empty.className   = 'cat-empty';
		empty.textContent = 'Brak kategorii';
		catEls.catList.appendChild(empty);
	} else {
		categories.forEach(cat => {
			const item = document.createElement('div');
			item.className  = 'cat-item';
			item.dataset.id = cat.id;
			item.innerHTML  = `
                <span class="cat-name-text">${escHtml(cat.name)}</span>
                <button class="cat-delete-btn" title="Usuń kategorię">✕</button>`;
			item.querySelector('.cat-delete-btn').addEventListener('click', () => deleteCategory(cat.id));
			catEls.catList.appendChild(item);
		});
	}

	renderCategorySelector();
}

function renderCategorySelector() {
	els.catChipsPicker.innerHTML = '';

	if (categories.length === 0) {
		const hint = document.createElement('span');
		hint.className   = 'cat-no-cats';
		hint.textContent = 'Brak kategorii — dodaj je poniżej';
		els.catChipsPicker.appendChild(hint);
		return;
	}

	categories.forEach(cat => {
		const chip = document.createElement('span');
		chip.className   = 'cat-chip' + (selectedCatIds.includes(cat.id) ? ' selected' : '');
		chip.textContent = cat.name;
		chip.dataset.id  = cat.id;
		chip.addEventListener('click', () => {
			const active = selectedCatIds.includes(cat.id);
			selectedCatIds = active
				? selectedCatIds.filter(id => id !== cat.id)
				: [...selectedCatIds, cat.id];
			chip.classList.toggle('selected', !active);
		});
		els.catChipsPicker.appendChild(chip);
	});
}

// ── STORAGE ────────────────────────────────────────────────────────────────
function loadStorage(key, fallback) {
	try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
	catch { return fallback; }
}

function saveTasks()      { try { localStorage.setItem(STORAGE_KEY,    JSON.stringify(tasks));       } catch {} }
function saveCategories() { try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)); } catch {} }

// ── HELPERS ────────────────────────────────────────────────────────────────
function dateKey(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonday(d) {
	const day = new Date(d);
	const dow = day.getDay();
	day.setDate(day.getDate() + (dow === 0 ? -6 : 1 - dow));
	return day;
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
const escHtml = s => s.replace(/[&<>"']/g, c => ESC[c]);

function flashError(el) {
	el.focus();
	el.style.outline = '2px solid #f44336';
	setTimeout(() => { el.style.outline = ''; }, 1200);
}
