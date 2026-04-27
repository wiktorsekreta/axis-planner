'use strict';
// Ten plik to cały mózg głównej strony aplikacji (MainPage.html).
// Obsługuje: pobieranie danych z serwera, renderowanie kalendarza (dzień/tydzień/miesiąc),
// dodawanie/usuwanie/zaznaczanie zadań, zarządzanie kategoriami.

// ── STAŁE ─────────────────────────────────────────────────────────────────────
// Polskie nazwy dni tygodnia i miesięcy — używane przy wyświetlaniu dat
const DAYS_PL   = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                   'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
// Skrócone nazwy dni — używane w nagłówku widoku tygodnia
const SHORT_DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

// ── STAN APLIKACJI ─────────────────────────────────────────────────────────────
// Zmienne globalne przechowujące aktualny stan UI i dane pobrane z serwera

let currentView    = 'day';      // aktualnie wybrany widok: 'day' | 'week' | 'month'
let currentDate    = new Date(); // aktualnie oglądana data (domyślnie: dzisiaj)
let tasks          = {};         // cache zadań: { "YYYY-MM-DD": [{id, title, desc, time, done, categoryIds}] }
let categories     = [];         // lista wszystkich kategorii: [{id, name}]
let selectedCatIds = [];         // ID kategorii zaznaczonych w formularzu dodawania zadania

// ── SKRÓTY DO ELEMENTÓW HTML ──────────────────────────────────────────────────
// $ to własna skrócona wersja document.getElementById — zamiast pisać długie getElementById
const $ = id => document.getElementById(id);

// Wszystkie elementy strony potrzebne do kalendarza i listy zadań
const els = {
	dateTitle:      $('dateTitle'),      // tytuł z aktualną datą/zakresem
	prev:           $('prev'),           // przycisk "wstecz"
	next:           $('next'),           // przycisk "naprzód"
	dayView:        $('dayView'),        // kontener widoku dnia
	weekView:       $('weekView'),       // kontener widoku tygodnia
	monthView:      $('monthView'),      // kontener widoku miesiąca
	monthGrid:      $('monthGrid'),      // siatka dni w widoku miesiąca
	weekGrid:       $('weekGrid'),       // siatka kolumn w widoku tygodnia
	taskList:       $('taskList'),       // lista zadań w widoku dnia
	taskCount:      $('taskCount'),      // licznik zadań (plakietka)
	emptyState:     $('emptyState'),     // komunikat "brak zadań"
	addBtn:         $('addTaskBtn'),     // przycisk "+ Dodaj zadanie"
	titleInput:     $('task-title'),     // pole tytułu nowego zadania
	timeInput:      $('task-time'),      // pole godziny nowego zadania
	descInput:      $('task-desc'),      // pole opisu nowego zadania
	catChipsPicker: $('catChipsPicker'), // kontener na "chipsy" kategorii w formularzu
};

// Elementy panelu zarządzania kategoriami
const catEls = {
	catCount:     $('catCount'),     // licznik kategorii (plakietka)
	addCatBtn:    $('addCatBtn'),    // przycisk "+ Dodaj" kategorię
	catNameInput: $('cat-name'),     // pole nazwy nowej kategorii
	catList:      $('catList'),      // lista istniejących kategorii
};

// ── NASŁUCHIWACZE ZDARZEŃ ─────────────────────────────────────────────────────
// Podpinamy funkcje do przycisków i pól formularza

// Kliknięcie przycisków Dzień / Tydzień / Miesiąc — przełącza widok
document.querySelectorAll('.toggle-btn').forEach(btn =>
	btn.addEventListener('click', () => switchView(btn.dataset.view))
);

// Strzałki nawigacji — przesuwają widok w czasie (wstecz i do przodu)
els.prev.addEventListener('click', () => navigate(-1));
els.next.addEventListener('click', () => navigate(1));

// Przycisk dodawania zadania i skrót klawiszowy Enter w polu tytułu
els.addBtn.addEventListener('click', addTask);
els.titleInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

// Przycisk dodawania kategorii i skrót Enter w polu nazwy
catEls.addCatBtn.addEventListener('click', addCategory);
catEls.catNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addCategory(); });

// ── KOMUNIKACJA Z SERWEREM (API) ──────────────────────────────────────────────
// Funkcja pomocnicza do wysyłania żądań POST do plików PHP w folderze /api/.
// Tablice (np. lista ID kategorii) wysyłane są jako: cats[]=1&cats[]=2
// — dzięki temu PHP widzi je jako tablicę: $_POST['cats'] = [1, 2].
async function post(endpoint, params) {
	const body = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (Array.isArray(v)) {
			// Każdy element tablicy wysyłamy osobno z kluczem "klucz[]"
			v.forEach(item => body.append(k + '[]', item));
		} else {
			body.set(k, String(v));
		}
	}
	const res = await fetch(`./api/${endpoint}`, { method: 'POST', body });

	// Jeśli serwer zwrócił 401 (brak sesji) — przekieruj na stronę logowania
	if (res.status === 401) {
		window.location.href = './index.html';
		return null;
	}
	return res.json(); // zwracamy odpowiedź jako obiekt JavaScript
}

// ── ŁADOWANIE DANYCH Z SERWERA ────────────────────────────────────────────────

// Pobiera zadania z bazy dla podanego zakresu dat i zapisuje je w lokalnym cache `tasks`.
// Kolejne wywołania scalają dane (Object.assign nie usuwa tego co już jest w cache).
async function loadRange(from, to) {
	const data = await post('tasks.php', { action: 'get', from, to });
	// Sprawdzamy czy odpowiedź to obiekt (nie błąd) i zapisujemy do cache
	if (data && typeof data === 'object' && !data.error) {
		Object.assign(tasks, data);
	}
}

// Wyznacza odpowiedni zakres dat dla aktualnego widoku i wczytuje dane.
async function loadViewData() {
	let from, to;
	if (currentView === 'day') {
		// Widok dnia — zakres to jedna data
		from = to = dateKey(currentDate);
	} else if (currentView === 'week') {
		// Widok tygodnia — od poniedziałku do niedzieli bieżącego tygodnia
		const monday = getMonday(currentDate);
		const sunday = new Date(monday);
		sunday.setDate(sunday.getDate() + 6);
		from = dateKey(monday);
		to   = dateKey(sunday);
	} else {
		// Widok miesiąca — od 1. do ostatniego dnia miesiąca
		const y = currentDate.getFullYear();
		const m = currentDate.getMonth();
		from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
		to   = dateKey(new Date(y, m + 1, 0)); // new Date(y, m+1, 0) = ostatni dzień miesiąca m
	}
	await loadRange(from, to);
}

// ── INICJALIZACJA ─────────────────────────────────────────────────────────────
// Uruchamia się raz gdy strona się załaduje.
// Sprawdza czy użytkownik jest zalogowany, ładuje kategorie i zadania, renderuje widok.
async function init() {
	// Pytamy serwer czy sesja jest aktywna
	const sessionRes = await fetch('./api/session.php');
	if (!sessionRes.ok) {
		// Brak sesji — użytkownik niezalogowany, cofamy do strony logowania
		window.location.href = './index.html';
		return;
	}
	const session = await sessionRes.json();
	// Wyświetlamy nazwę zalogowanego użytkownika w nagłówku
	document.querySelector('.username').textContent = session.username;
	sessionStorage.setItem('username', session.username);

	// Pobieramy listę wszystkich kategorii z bazy
	const cats = await post('categories.php', { action: 'get' });
	if (cats === null) return; // null = przekierowanie na login (401)
	categories = Array.isArray(cats) ? cats : [];

	// Pobieramy zadania dla aktualnego zakresu dat
	await loadViewData();

	// Renderujemy kategorie i widok kalendarza
	renderCategories();
	render();
}

// Uruchamiamy inicjalizację od razu po załadowaniu skryptu
init();

// ── PRZEŁĄCZANIE WIDOKÓW ──────────────────────────────────────────────────────

// Zmienia aktywny widok (dzień/tydzień/miesiąc) i odświeża dane.
async function switchView(view) {
	currentView = view;
	// Ustawiamy klasę "active" tylko na klikniętym przycisku
	document.querySelectorAll('.toggle-btn').forEach(b =>
		b.classList.toggle('active', b.dataset.view === view)
	);
	// Pokazujemy odpowiedni kontener, resztę chowamy (klasa "hidden")
	['day', 'week', 'month'].forEach(v =>
		els[`${v}View`].classList.toggle('hidden', v !== view)
	);
	await loadViewData();
	render();
}

// Przesuwa currentDate o jeden dzień/tydzień/miesiąc w kierunku dir (+1 lub -1).
async function navigate(dir) {
	const d = new Date(currentDate);
	if      (currentView === 'day')   d.setDate(d.getDate() + dir);
	else if (currentView === 'week')  d.setDate(d.getDate() + dir * 7);
	else                              d.setMonth(d.getMonth() + dir);
	currentDate = d;
	await loadViewData();
	render();
}

// Wywołuje odpowiednią funkcję renderowania w zależności od aktywnego widoku.
function render() {
	({ day: renderDay, week: renderWeek, month: renderMonth })[currentView]();
}

// ── WIDOK DNIA ────────────────────────────────────────────────────────────────
// Wyświetla tytuł z datą i listę zadań na wybrany dzień.
function renderDay() {
	const d = currentDate;
	els.dateTitle.textContent =
		`${DAYS_PL[d.getDay()]}, ${d.getDate()} ${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
	renderTaskList(dateKey(d));
}

// ── WIDOK TYGODNIA ────────────────────────────────────────────────────────────
// Wyświetla 7 kolumn (Pn–Nd) z miniaturami zadań. Kliknięcie kolumny przełącza na widok dnia.
function renderWeek() {
	const monday = getMonday(currentDate);
	const sunday = new Date(monday);
	sunday.setDate(sunday.getDate() + 6);

	// Tytuł: "1 Kwiecień – 7 Kwiecień 2025"
	els.dateTitle.textContent =
		`${monday.getDate()} ${MONTHS_PL[monday.getMonth()]} – ` +
		`${sunday.getDate()} ${MONTHS_PL[sunday.getMonth()]} ${sunday.getFullYear()}`;

	els.weekGrid.innerHTML = ''; // czyścimy poprzednią zawartość siatki
	const today    = dateKey(new Date());     // dzisiejsza data do podświetlenia
	const selected = dateKey(currentDate);   // aktualnie wybrana data

	// Tworzymy kolumnę dla każdego z 7 dni tygodnia
	for (let i = 0; i < 7; i++) {
		const day      = new Date(monday);
		day.setDate(day.getDate() + i);
		const key      = dateKey(day);
		const dayTasks = tasks[key] || []; // zadania na ten dzień (lub pusta tablica)

		const col = document.createElement('div');
		// Dodajemy klasy CSS "today" i "selected" jeśli pasują
		col.className =
			'week-day-col' +
			(key === today    ? ' today'    : '') +
			(key === selected ? ' selected' : '');

		// Skrócona nazwa dnia (np. "Pn")
		const nameEl = document.createElement('div');
		nameEl.className   = 'week-day-name';
		nameEl.textContent = SHORT_DAYS[i];

		// Numer dnia miesiąca (np. "15")
		const numEl = document.createElement('div');
		numEl.className   = 'week-day-num';
		numEl.textContent = day.getDate();

		col.append(nameEl, numEl);

		// Pokazujemy maksymalnie 5 zadań jako miniatury
		dayTasks.slice(0, 5).forEach(t => {
			const dot = document.createElement('div');
			dot.className   = 'week-task-item';
			dot.textContent = (t.time ? t.time + ' ' : '') + t.title;
			col.appendChild(dot);
		});
		// Jeśli jest więcej niż 5, pokazujemy "+N więcej"
		if (dayTasks.length > 5) {
			const more = document.createElement('div');
			more.className   = 'week-task-item';
			more.textContent = `+${dayTasks.length - 5} więcej`;
			col.appendChild(more);
		}

		// Kliknięcie w kolumnę przełącza na widok dnia dla tej daty
		col.addEventListener('click', () => { currentDate = new Date(day); switchView('day'); });
		els.weekGrid.appendChild(col);
	}
}

// ── WIDOK MIESIĄCA ────────────────────────────────────────────────────────────
// Wyświetla siatkę kalendarza miesięcznego z miniaturami zadań.
function renderMonth() {
	const y = currentDate.getFullYear();
	const m = currentDate.getMonth(); // 0 = Styczeń, 11 = Grudzień
	els.dateTitle.textContent = `${MONTHS_PL[m]} ${y}`;

	const firstDay = new Date(y, m, 1);    // pierwszy dzień miesiąca
	const lastDay  = new Date(y, m + 1, 0); // ostatni dzień miesiąca (0. dzień następnego)
	// Obliczamy ile pustych komórek wstawić przed 1. dniem (calendar zaczyna od poniedziałku)
	let startDow   = firstDay.getDay() - 1;
	if (startDow < 0) startDow = 6; // niedziela (0) → 6 (ostatnia kolumna)

	const today    = dateKey(new Date());
	const selected = dateKey(currentDate);

	els.monthGrid.innerHTML = ''; // czyścimy siatkę

	// Dodajemy dni z poprzedniego miesiąca (szare komórki na początku)
	for (let i = 0; i < startDow; i++)
		els.monthGrid.appendChild(createMonthCell(new Date(y, m, 1 - (startDow - i)), today, selected, true));

	// Dodajemy wszystkie dni bieżącego miesiąca
	for (let d = 1; d <= lastDay.getDate(); d++)
		els.monthGrid.appendChild(createMonthCell(new Date(y, m, d), today, selected, false));

	// Dopełniamy ostatni wiersz dniami z następnego miesiąca (szare komórki na końcu)
	const remainder = (startDow + lastDay.getDate()) % 7;
	for (let i = 1; i <= (remainder === 0 ? 0 : 7 - remainder); i++)
		els.monthGrid.appendChild(createMonthCell(new Date(y, m + 1, i), today, selected, true));
}

// Tworzy i zwraca jedną komórkę w siatce miesięcznej.
// otherMonth=true → dzień z innego miesiąca (wyszarzony)
function createMonthCell(day, today, selected, otherMonth) {
	const key      = dateKey(day);
	const dayTasks = tasks[key] || [];

	const cell = document.createElement('div');
	cell.className =
		'month-day' +
		(key === today    ? ' today'       : '') +
		(key === selected ? ' selected'    : '') +
		(otherMonth       ? ' other-month' : '');

	// Numer dnia
	const numEl = document.createElement('div');
	numEl.className   = 'day-num';
	numEl.textContent = day.getDate();
	cell.appendChild(numEl);

	// Miniaturki zadań — maksymalnie 3
	dayTasks.slice(0, 3).forEach(t => {
		const dot = document.createElement('div');
		dot.className   = 'month-task-dot';
		dot.textContent = (t.time ? t.time + ' ' : '') + t.title;
		cell.appendChild(dot);
	});
	// Jeśli jest więcej niż 3, pokazujemy "+N"
	if (dayTasks.length > 3) {
		const more = document.createElement('div');
		more.className   = 'month-task-dot';
		more.textContent = `+${dayTasks.length - 3}`;
		cell.appendChild(more);
	}

	// Kliknięcie przełącza na widok dnia
	cell.addEventListener('click', () => { currentDate = new Date(day); switchView('day'); });
	return cell;
}

// ── RENDEROWANIE LISTY ZADAŃ ──────────────────────────────────────────────────
// Wyświetla listę zadań dla podanego klucza daty (np. "2025-06-01").
function renderTaskList(key) {
	// Sortujemy zadania po godzinie; zadania bez godziny lądują na końcu
	const dayTasks = (tasks[key] || []).slice().sort((a, b) => {
		if (!a.time && !b.time) return 0;
		if (!a.time) return 1;  // brak czasu → na koniec
		if (!b.time) return -1;
		return a.time.localeCompare(b.time); // porównanie tekstowe "HH:MM"
	});

	// Usuwamy poprzednie karty zadań (zostawiamy tylko emptyState)
	[...els.taskList.children].forEach(c => { if (c !== els.emptyState) c.remove(); });

	// Jeśli brak zadań — pokazujemy komunikat "Brak zadań na ten dzień"
	if (dayTasks.length === 0) {
		els.emptyState.style.display = '';
		els.taskCount.textContent    = '0';
		return;
	}

	// Chowamy komunikat i aktualizujemy licznik
	els.emptyState.style.display = 'none';
	els.taskCount.textContent    = dayTasks.length;

	// Budujemy kartę HTML dla każdego zadania
	dayTasks.forEach(t => {
		// Zamieniamy ID kategorii na tagi HTML z nazwami
		const catTags = (t.categoryIds || [])
			.map(id => categories.find(c => c.id === id)) // znajdź obiekt kategorii po ID
			.filter(Boolean)                               // usuń undefined (gdy kategoria usunięta)
			.map(c => `<span class="task-cat-tag">${escHtml(c.name)}</span>`) // buduj HTML tagu
			.join('');

		const item = document.createElement('div');
		item.className  = 'task-item' + (t.done ? ' completed' : ''); // "completed" = przekreślone
		item.dataset.id = t.id;
		// innerHTML z escHtml zapobiega atakom XSS (gdyby tytuł zawierał np. <script>)
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

		// Podpinamy obsługę przycisków ✓ i ✕
		item.querySelector('.task-check') .addEventListener('click', () => toggleDone(key, t.id));
		item.querySelector('.task-delete').addEventListener('click', () => deleteTask(key, t.id));
		// insertBefore(item, emptyState) — zadanie wstawiane przed komunikatem "brak zadań"
		els.taskList.insertBefore(item, els.emptyState);
	});
}

// ── OPERACJE NA ZADANIACH ─────────────────────────────────────────────────────
// Każda operacja: 1) wyślij POST do tasks.php, 2) zaktualizuj cache, 3) przerenderuj listę.

// Dodaje nowe zadanie na podstawie wartości z formularza.
async function addTask() {
	const title = els.titleInput.value.trim();
	if (!title) { flashError(els.titleInput); return; } // brak tytułu — podświetl pole na czerwono

	const key  = dateKey(currentDate);
	const time = els.timeInput.value || '';
	const desc = els.descInput.value.trim();

	const data = await post('tasks.php', {
		action: 'add',
		title,
		date:  key,
		time,
		desc,
		cats:  selectedCatIds, // tablica ID wybranych kategorii
	});

	if (!data.ok) return;

	// Optymistyczna aktualizacja cache — dodajemy zadanie lokalnie bez ponownego fetcha z serwera
	if (!tasks[key]) tasks[key] = [];
	tasks[key].push({
		id:          data.id, // ID zadania nadane przez bazę danych
		title,
		time,
		desc,
		done:        false,
		categoryIds: [...selectedCatIds], // kopia tablicy (spread), żeby nie współdzielić referencji
	});

	// Czyścimy formularz po dodaniu
	els.titleInput.value = '';
	els.timeInput.value  = '';
	els.descInput.value  = '';
	selectedCatIds       = []; // zerujemy wybrane kategorie
	renderCategorySelector(); // odświeżamy "chipsy" (żadna nie jest już zaznaczona)
	renderTaskList(key);
}

// Przełącza zadanie między "wykonane" a "niewykonane".
async function toggleDone(key, id) {
	const data = await post('tasks.php', { action: 'toggle', id });
	if (!data.ok) return;
	// Aktualizujemy pole "done" w lokalnym cache
	const t = (tasks[key] || []).find(x => x.id === id);
	if (t) { t.done = data.done; renderTaskList(key); }
}

// Usuwa zadanie z listy i z lokalnego cache.
async function deleteTask(key, id) {
	const data = await post('tasks.php', { action: 'delete', id });
	if (!data.ok) return;
	if (tasks[key]) {
		// filter() tworzy nową tablicę bez usuniętego zadania
		tasks[key] = tasks[key].filter(x => x.id !== id);
		renderTaskList(key);
	}
}

// ── OPERACJE NA KATEGORIACH ───────────────────────────────────────────────────

// Dodaje nową kategorię na podstawie wartości z pola tekstowego.
async function addCategory() {
	const name = catEls.catNameInput.value.trim();
	if (!name) { flashError(catEls.catNameInput); return; }

	const data = await post('categories.php', { action: 'add', name });
	if (!data.ok) return;

	// Dodajemy nową kategorię do lokalnego cache i czyścimy pole
	categories.push({ id: data.id, name });
	catEls.catNameInput.value = '';
	renderCategories(); // odświeżamy panel kategorii i selektor "chipsy"
}

// Usuwa kategorię i aktualizuje wszystkie zadania w cache.
async function deleteCategory(id) {
	const data = await post('categories.php', { action: 'delete', id });
	if (!data.ok) return;

	// Usuwamy kategorię z lokalnej listy
	categories     = categories.filter(c => c.id !== id);
	// Usuwamy ją z zaznaczonych (gdyby była zaznaczona w formularzu)
	selectedCatIds = selectedCatIds.filter(cid => cid !== id);

	// Usuwamy ID tej kategorii ze wszystkich zadań w cache (bez ponownego fetcha)
	Object.values(tasks).forEach(dayTasks =>
		dayTasks.forEach(t => {
			t.categoryIds = t.categoryIds.filter(cid => cid !== id);
		})
	);

	renderCategories();
	renderTaskList(dateKey(currentDate));
}

// Renderuje panel kategorii (lista po lewej) i selektor chipsy (w formularzu).
function renderCategories() {
	catEls.catCount.textContent = categories.length;
	catEls.catList.innerHTML    = '';

	if (categories.length === 0) {
		// Brak kategorii — wyświetlamy komunikat zastępczy
		const empty = document.createElement('div');
		empty.className   = 'cat-empty';
		empty.textContent = 'Brak kategorii';
		catEls.catList.appendChild(empty);
	} else {
		// Budujemy kartę dla każdej kategorii z przyciskiem usuwania
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

	// Zawsze aktualizujemy też selektor kategorii w formularzu dodawania zadania
	renderCategorySelector();
}

// Renderuje "chipsy" (klikalne etykiety) w formularzu dodawania zadania.
// Zaznaczone chipsy (w selectedCatIds) mają klasę "selected" i są podświetlone.
function renderCategorySelector() {
	els.catChipsPicker.innerHTML = '';

	if (categories.length === 0) {
		// Brak kategorii — pokazujemy tekst informacyjny
		const hint = document.createElement('span');
		hint.className   = 'cat-no-cats';
		hint.textContent = 'Brak kategorii — dodaj je poniżej';
		els.catChipsPicker.appendChild(hint);
		return;
	}

	// Dla każdej kategorii tworzymy klikalny "chip"
	categories.forEach(cat => {
		const chip = document.createElement('span');
		// Dodajemy klasę "selected" jeśli ID tej kategorii jest w selectedCatIds
		chip.className   = 'cat-chip' + (selectedCatIds.includes(cat.id) ? ' selected' : '');
		chip.textContent = cat.name;
		chip.dataset.id  = cat.id;
		chip.addEventListener('click', () => {
			const active = selectedCatIds.includes(cat.id);
			// Jeśli już zaznaczona — odznacz; jeśli niezaznaczona — zaznacz
			selectedCatIds = active
				? selectedCatIds.filter(id => id !== cat.id) // usuń z listy
				: [...selectedCatIds, cat.id];               // dodaj do listy
			chip.classList.toggle('selected', !active);
		});
		els.catChipsPicker.appendChild(chip);
	});
}

// ── FUNKCJE POMOCNICZE ────────────────────────────────────────────────────────

// Zamienia obiekt Date na string "YYYY-MM-DD" — format używany jako klucz w cache i w SQL.
// padStart(2, '0') sprawia, że miesiąc i dzień mają zawsze 2 cyfry (np. "06" zamiast "6").
function dateKey(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Zwraca datę poniedziałku dla tygodnia zawierającego datę d.
// JavaScript traktuje niedzielę jako dzień 0 — poprawiamy to do europejskiego układu (Pn=0).
function getMonday(d) {
	const day = new Date(d);
	const dow = day.getDay(); // 0=Nd, 1=Pn, ..., 6=So
	day.setDate(day.getDate() + (dow === 0 ? -6 : 1 - dow));
	return day;
}

// Tablica zamieniająca znaki specjalne HTML na bezpieczne encje — ochrona przed XSS.
// XSS (Cross-Site Scripting) = atak polegający na wstrzyknięciu kodu JS przez dane wejściowe.
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
const escHtml = s => s.replace(/[&<>"']/g, c => ESC[c]);

// Podświetla pole formularza na czerwono przez 1.2 sekundy, gdy brakuje wymaganej wartości.
function flashError(el) {
	el.focus();
	el.style.outline = '2px solid #f44336'; // czerwone obramowanie
	setTimeout(() => { el.style.outline = ''; }, 1200); // po 1.2s przywracamy normalne
}
