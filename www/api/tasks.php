<?php
// Ten plik obsługuje wszystkie operacje na zadaniach (CRUD = Create, Read, Update, Delete).
// JavaScript wysyła żądania POST z polem "action", które mówi, co chcemy zrobić:
//   get    — pobierz zadania z wybranego zakresu dat
//   add    — dodaj nowe zadanie
//   toggle — zaznacz zadanie jako wykonane / niewykonane
//   delete — usuń zadanie

// Mówimy przeglądarce, że odpowiedź jest w formacie JSON
header('Content-Type: application/json');

// Uruchamiamy sesję PHP — potrzebujemy jej, żeby wiedzieć, kto jest zalogowany
session_start();

// Dołączamy plik z połączeniem do bazy danych
require __DIR__ . '/db.php';

// Sprawdzamy, czy użytkownik jest zalogowany (czy w sesji istnieje user_id)
if (empty($_SESSION['user_id'])) {
    // Niezalogowany użytkownik nie może korzystać z zadań
    http_response_code(401); // 401 = brak autoryzacji
    echo json_encode(['error' => 'Nie zalogowano.']);
    exit;
}

// Pobieramy ID zalogowanego użytkownika z sesji
// (int) zapewnia, że to będzie liczba całkowita, a nie przypadkowy tekst
$uid    = (int) $_SESSION['user_id'];

// Pobieramy nazwę akcji, którą JavaScript chce wykonać
$action = $_POST['action'] ?? '';

// W zależności od akcji wykonujemy odpowiednią operację
switch ($action) {

    // ── GET ──────────────────────────────────────────────────────────────────
    // Pobiera listę zadań dla podanego zakresu dat.
    // JavaScript wysyła: from = data początkowa (YYYY-MM-DD), to = data końcowa
    // Odpowiedź ma postać: { "2025-06-01": [{id, title, desc, time, done, categoryIds}], ... }
    case 'get':
        // Pobieramy zakres dat z żądania; jeśli podano samo "date", używamy go jako obu granic
        $from = $_POST['from'] ?? ($_POST['date'] ?? '');
        $to   = $_POST['to']   ?? $from;

        // Jeśli brak daty — błąd
        if (!$from || !$to) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak daty.']);
            exit;
        }

        // Pobieramy zadania z bazy — LEFT JOIN dołącza kategorie przypisane do każdego zadania.
        // GROUP_CONCAT() zbiera ID kategorii z wielu wierszy w jeden string, np. "1,3,5"
        $stmt = $pdo->prepare('
            SELECT t.TaskId, t.Title, t.Description, t.Date, t.Time, t.IsDone,
                   GROUP_CONCAT(tc.CategoryId) AS CategoryIds
            FROM tasks t
            LEFT JOIN taskcategories tc ON tc.TaskId = t.TaskId
            WHERE t.UserId = ? AND t.Date BETWEEN ? AND ?
            GROUP BY t.TaskId
            ORDER BY t.Date, t.Time
        ');
        $stmt->execute([$uid, $from, $to]);
        $rows = $stmt->fetchAll(); // pobieramy wszystkie pasujące wiersze naraz

        // Zamieniamy płaską listę wierszy na słownik pogrupowany po dacie
        $result = [];
        foreach ($rows as $r) {
            $t = $r['Time'];
            // Jeśli czas to "00:00:00" — znaczy, że użytkownik nie podał godziny → zwracamy pusty string
            $timeStr = ($t && $t !== '00:00:00') ? substr($t, 0, 5) : '';

            // Dodajemy zadanie do odpowiedniej daty w tablicy wynikowej
            $result[$r['Date']][] = [
                'id'          => (int) $r['TaskId'],
                'title'       => $r['Title'],
                'desc'        => $r['Description'] ?? '',
                'time'        => $timeStr,
                'done'        => (bool) $r['IsDone'],       // 0/1 z bazy zamieniamy na true/false
                // GROUP_CONCAT dał nam string "1,2,3" — zamieniamy go na tablicę liczb [1, 2, 3]
                'categoryIds' => $r['CategoryIds']
                    ? array_map('intval', explode(',', $r['CategoryIds']))
                    : [],
            ];
        }

        echo json_encode($result);
        break;

    // ── ADD ──────────────────────────────────────────────────────────────────
    // Dodaje nowe zadanie do bazy.
    // JavaScript wysyła: title, date, time (opcjonalnie), desc (opcjonalnie), cats[] (tablica ID kategorii)
    // Odpowiedź: { ok: true, id: <nowe TaskId> }
    case 'add':
        $title = trim($_POST['title'] ?? '');  // tytuł zadania (wymagany)
        $date  = $_POST['date']  ?? '';        // data zadania (wymagana)
        $time  = $_POST['time']  ?? '';        // godzina (opcjonalna)
        $desc  = trim($_POST['desc'] ?? '');   // opis (opcjonalny)
        // cats[] to tablica ID kategorii przesłana z formularza
        // array_map('intval', ...) zamienia każdy element na liczbę całkowitą
        $cats  = array_map('intval', (array) ($_POST['cats'] ?? []));

        // Bez tytułu lub daty nie możemy zapisać zadania
        if (!$title || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak tytułu lub daty.']);
            exit;
        }

        // Wstawiamy zadanie do tabeli "tasks"
        $stmt = $pdo->prepare(
            'INSERT INTO tasks (UserId, Title, Description, Date, Time) VALUES (?, ?, ?, ?, ?)'
        );
        // Jeśli użytkownik nie podał godziny, wstawiamy "00:00:00" (kolumna jest NOT NULL)
        // Jeśli nie podał opisu, wstawiamy NULL (null w PHP → NULL w SQL)
        $stmt->execute([$uid, $title, $desc ?: null, $date, $time ?: '00:00:00']);

        // Pobieramy ID właśnie dodanego rekordu
        $taskId = (int) $pdo->lastInsertId();

        // Dla każdej wybranej kategorii tworzymy powiązanie w tabeli pośredniej "taskcategories"
        // INSERT IGNORE pomija duplikaty (gdyby ta para już istniała)
        foreach (array_filter($cats) as $catId) {
            $pdo->prepare('INSERT IGNORE INTO taskcategories (TaskId, CategoryId) VALUES (?, ?)')
                ->execute([$taskId, $catId]);
        }

        echo json_encode(['ok' => true, 'id' => $taskId]);
        break;

    // ── TOGGLE ───────────────────────────────────────────────────────────────
    // Przełącza zadanie między "zrobione" a "niezrobione".
    // JavaScript wysyła: id (TaskId)
    // Odpowiedź: { ok: true, done: true|false }
    case 'toggle':
        $id = (int) ($_POST['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak id.']);
            exit;
        }

        // "NOT IsDone" w SQL odwraca wartość 0→1 lub 1→0 bezpośrednio w bazie
        // Warunek "AND UserId = ?" zapobiega edycji cudzych zadań
        $pdo->prepare('UPDATE tasks SET IsDone = NOT IsDone WHERE TaskId = ? AND UserId = ?')
            ->execute([$id, $uid]);

        // Pobieramy aktualny stan zadania, żeby przekazać go z powrotem do JavaScript
        $row = $pdo->prepare('SELECT IsDone FROM tasks WHERE TaskId = ?');
        $row->execute([$id]);
        $task = $row->fetch();

        echo json_encode(['ok' => true, 'done' => (bool) $task['IsDone']]);
        break;

    // ── DELETE ───────────────────────────────────────────────────────────────
    // Usuwa zadanie z bazy.
    // JavaScript wysyła: id (TaskId)
    // Odpowiedź: { ok: true }
    case 'delete':
        $id = (int) ($_POST['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak id.']);
            exit;
        }

        // Najpierw usuwamy powiązania z kategoriami z tabeli pośredniej "taskcategories"
        // (baza nie ma skonfigurowanych kaskadowych usunięć, więc robimy to ręcznie)
        $pdo->prepare('DELETE FROM taskcategories WHERE TaskId = ?')->execute([$id]);

        // Dopiero teraz usuwamy samo zadanie
        // Warunek "AND UserId = ?" zapobiega usunięciu cudzego zadania
        $pdo->prepare('DELETE FROM tasks WHERE TaskId = ? AND UserId = ?')->execute([$id, $uid]);

        echo json_encode(['ok' => true]);
        break;

    // Jeśli "action" nie pasuje do żadnego przypadku powyżej
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Nieznana akcja.']);
}
