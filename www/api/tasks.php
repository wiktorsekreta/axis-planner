<?php
header('Content-Type: application/json');
session_start();
require __DIR__ . '/db.php';

// Autoryzacja
if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Nie zalogowano.']);
    exit;
}

$uid    = (int) $_SESSION['user_id'];
$action = $_POST['action'] ?? '';

switch ($action) {

   
    case 'get':
        $from = $_POST['from'] ?? ($_POST['date'] ?? '');
        $to   = $_POST['to']   ?? $from;

        if (!$from || !$to) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak daty.']);
            exit;
        }

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

        // Grupowanie po dacie
        $result = [];
        foreach ($rows as $r) {
            $t = $r['Time'];
            $timeStr = ($t && $t !== '00:00:00') ? substr($t, 0, 5) : '';

            $result[$r['Date']][] = [
                'id' => (int) $r['TaskId'],
                'title' => $r['Title'],
                'desc' => $r['Description'] ?? '',
                'time' => $timeStr,
                'done' => (bool) $r['IsDone'],
                'categoryIds' => $r['CategoryIds']
                    ? array_map('intval', explode(',', $r['CategoryIds']))
                    : [],
            ];
        }

        echo json_encode($result);
        break;

    
    case 'add':
        $title = trim($_POST['title'] ?? '');
        $date  = $_POST['date']  ?? '';
        $time  = $_POST['time']  ?? '';
        $desc  = trim($_POST['desc'] ?? '');
        $cats  = array_map('intval', (array) ($_POST['cats'] ?? []));

        if (!$title || !$date) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak tytułu lub daty.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO tasks (UserId, Title, Description, Date, Time) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$uid, $title, $desc ?: null, $date, $time ?: '00:00:00']);

        $taskId = (int) $pdo->lastInsertId();

    
        foreach (array_filter($cats) as $catId) {
            $pdo->prepare('INSERT IGNORE INTO taskcategories (TaskId, CategoryId) VALUES (?, ?)')
                ->execute([$taskId, $catId]);
        }

        echo json_encode(['ok' => true, 'id' => $taskId]);
        break;

    
    case 'toggle':
        $id = (int) ($_POST['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak id.']);
            exit;
        }

        $pdo->prepare('UPDATE tasks SET IsDone = NOT IsDone WHERE TaskId = ? AND UserId = ?')
            ->execute([$id, $uid]);

        $row = $pdo->prepare('SELECT IsDone FROM tasks WHERE TaskId = ?');
        $row->execute([$id]);
        $task = $row->fetch();

        echo json_encode(['ok' => true, 'done' => (bool) $task['IsDone']]);
        break;

    
    case 'delete':
        $id = (int) ($_POST['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak id.']);
            exit;
        }

    
        $pdo->prepare('DELETE FROM taskcategories WHERE TaskId = ?')->execute([$id]);

        $pdo->prepare('DELETE FROM tasks WHERE TaskId = ? AND UserId = ?')->execute([$id, $uid]);

        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Nieznana akcja.']);
}
