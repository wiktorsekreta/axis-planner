<?php
// Endpoint do zarządzania zadaniami (CRUD).
// Każde żądanie musi mieć $_POST['action']: get | add | toggle | delete
// Wymaga aktywnej sesji PHP (zalogowany użytkownik).

header('Content-Type: application/json');
session_start();
require __DIR__ . '/db.php';

// Blokada dla niezalogowanych
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Nie zalogowano.']);
    exit;
}

$uid    = (int) $_SESSION['user_id'];  // ID zalogowanego użytkownika z sesji
$action = $_POST['action'] ?? '';

switch ($action) {

    // ── GET ─────────────────────────────────────────────────────────────────
    // Pobiera zadania dla zakresu dat.
    // $_POST: from (YYYY-MM-DD), to (YYYY-MM-DD)  [lub date zamiast from+to]
    // Zwraca: { "YYYY-MM-DD": [{id, title, desc, time, done, categoryIds}] }
    case 'get':
        $from = $_POST['from'] ?? ($_POST['date'] ?? '');
        $to   = $_POST['to']   ?? $from;

        if (!$from || !$to) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak daty.']);
            exit;
        }

        // JOIN z taskcategories, GROUP_CONCAT zbiera ID kategorii w jeden string
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
        $rows = $stmt->fetchAll();

        // Grupowanie wierszy po dacie → { "YYYY-MM-DD": [...] }
        $result = [];
        foreach ($rows as $r) {
            $t       = $r['Time'];
            // Czas "00:00:00" traktujemy jako "brak godziny" → pusty string
            $timeStr = ($t && $t !== '00:00:00') ? substr($t, 0, 5) : '';

            $result[$r['Date']][] = [
                'id'          => (int) $r['TaskId'],
                'title'       => $r['Title'],
                'desc'        => $r['Description'] ?? '',
                'time'        => $timeStr,
                'done'        => (bool) $r['IsDone'],
                // GROUP_CONCAT zwraca string "1,2,3" — zamieniamy na tablicę int
                'categoryIds' => $r['CategoryIds']
                    ? array_map('intval', explode(',', $r['CategoryIds']))
                    : [],
            ];
        }

        echo json_encode($result);
        break;

    // ── ADD ─────────────────────────────────────────────────────────────────
    // Dodaje nowe zadanie.
    // $_POST: title, date, time (opcjonalnie), desc (opcjonalnie), cats[] (IDs kategorii)
    // Zwraca: { ok: true, id: <nowe TaskId> }
    case 'add':
        $title = trim($_POST['title'] ?? '');
        $date  = $_POST['date']  ?? '';
        $time  = $_POST['time']  ?? '';
        $desc  = trim($_POST['desc'] ?? '');
        // cats[] to tablica ID kategorii z formularza (klucz cats[] → PHP: $_POST['cats'])
        $cats  = array_map('intval', (array) ($_POST['cats'] ?? []));

        if (!$title || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak tytułu lub daty.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO tasks (UserId, Title, Description, Date, Time) VALUES (?, ?, ?, ?, ?)'
        );
        // Kolumna Time jest NOT NULL → wstawiamy "00:00:00" gdy użytkownik nie podał godziny
        $stmt->execute([$uid, $title, $desc ?: null, $date, $time ?: '00:00:00']);
        $taskId = (int) $pdo->lastInsertId();

        // Zapisujemy powiązania zadanie↔kategoria (tabela pośrednia)
        foreach (array_filter($cats) as $catId) {
            $pdo->prepare('INSERT IGNORE INTO taskcategories (TaskId, CategoryId) VALUES (?, ?)')
                ->execute([$taskId, $catId]);
        }

        echo json_encode(['ok' => true, 'id' => $taskId]);
        break;

    // ── TOGGLE ──────────────────────────────────────────────────────────────
    // Przełącza status wykonania zadania (IsDone 0↔1).
    // $_POST: id (TaskId)
    // Zwraca: { ok: true, done: true|false }
    case 'toggle':
        $id = (int) ($_POST['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Brak id.']); exit; }

        // NOT IsDone odwraca wartość bitową bezpośrednio w SQL
        $pdo->prepare('UPDATE tasks SET IsDone = NOT IsDone WHERE TaskId = ? AND UserId = ?')
            ->execute([$id, $uid]);

        $row = $pdo->prepare('SELECT IsDone FROM tasks WHERE TaskId = ?');
        $row->execute([$id]);
        $task = $row->fetch();

        echo json_encode(['ok' => true, 'done' => (bool) $task['IsDone']]);
        break;

    // ── DELETE ──────────────────────────────────────────────────────────────
    // Usuwa zadanie i jego powiązania z kategoriami.
    // $_POST: id (TaskId)
    // Zwraca: { ok: true }
    case 'delete':
        $id = (int) ($_POST['id'] ?? 0);
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Brak id.']); exit; }

        // Najpierw usuwamy z tabeli pośredniej (brak ON DELETE CASCADE w dump.sql)
        $pdo->prepare('DELETE FROM taskcategories WHERE TaskId = ?')->execute([$id]);
        $pdo->prepare('DELETE FROM tasks WHERE TaskId = ? AND UserId = ?')->execute([$id, $uid]);

        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Nieznana akcja.']);
}
