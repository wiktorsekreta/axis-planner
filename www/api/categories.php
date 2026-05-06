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

$action = $_POST['action'] ?? '';

switch ($action) {

    case 'get':
        $stmt = $pdo->query('SELECT CategoryId, Name FROM categories ORDER BY Name ASC');
        $rows = $stmt->fetchAll();

        echo json_encode(array_map(fn($r) => [
            'id'   => (int) $r['CategoryId'],
            'name' => $r['Name'],
        ], $rows));
        break;

    case 'add':
        $name = trim($_POST['name'] ?? '');

        if (!$name) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak nazwy.']);
            exit;
        }

        try {
            $pdo->prepare('INSERT INTO categories (Name) VALUES (?)')->execute([$name]);
            echo json_encode(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
        } catch (PDOException) {
            http_response_code(409);
            echo json_encode(['error' => 'Kategoria już istnieje.']);
        }
        break;

    case 'delete':
        $id = (int) ($_POST['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak id.']);
            exit;
        }

        // Powiązania
        $pdo->prepare('DELETE FROM taskcategories WHERE CategoryId = ?')->execute([$id]);

        $pdo->prepare('DELETE FROM categories WHERE CategoryId = ?')->execute([$id]);

        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Nieznana akcja.']);
}
