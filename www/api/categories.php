<?php
// Ten plik obsługuje wszystkie operacje na kategoriach (CRUD).
// JavaScript wysyła żądania POST z polem "action":
//   get    — pobierz wszystkie kategorie
//   add    — dodaj nową kategorię
//   delete — usuń kategorię

// Mówimy przeglądarce, że odpowiedź jest w formacie JSON
header('Content-Type: application/json');

// Uruchamiamy sesję PHP — potrzebujemy jej, żeby sprawdzić, czy użytkownik jest zalogowany
session_start();

// Dołączamy plik z połączeniem do bazy danych
require __DIR__ . '/db.php';

// Sprawdzamy, czy użytkownik jest zalogowany
if (empty($_SESSION['user_id'])) {
    // Niezalogowany nie może zarządzać kategoriami
    http_response_code(401); // 401 = brak autoryzacji
    echo json_encode(['error' => 'Nie zalogowano.']);
    exit;
}

// Pobieramy nazwę akcji, którą JavaScript chce wykonać
$action = $_POST['action'] ?? '';

// W zależności od akcji wykonujemy odpowiednią operację
switch ($action) {

    // ── GET ──────────────────────────────────────────────────────────────────
    // Zwraca listę wszystkich kategorii posortowanych alfabetycznie.
    // Odpowiedź: [{id, name}, {id, name}, ...]
    case 'get':
        // Pobieramy wszystkie kategorie posortowane po nazwie (A → Z)
        $stmt = $pdo->query('SELECT CategoryId, Name FROM categories ORDER BY Name ASC');
        $rows = $stmt->fetchAll();

        // Zamieniamy wyniki bazy na prostą tablicę obiektów {id, name}
        // fn($r) => [...] to skrócony zapis funkcji anonimowej (arrow function)
        echo json_encode(array_map(fn($r) => [
            'id'   => (int) $r['CategoryId'],
            'name' => $r['Name'],
        ], $rows));
        break;

    // ── ADD ──────────────────────────────────────────────────────────────────
    // Dodaje nową kategorię do bazy.
    // JavaScript wysyła: name (nazwa kategorii)
    // Odpowiedź: { ok: true, id: <nowe CategoryId> }
    case 'add':
        $name = trim($_POST['name'] ?? ''); // pobieramy nazwę i usuwamy zbędne spacje

        if (!$name) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak nazwy.']);
            exit;
        }

        try {
            // Wstawiamy nową kategorię do bazy
            // Kolumna "Name" ma ograniczenie UNIQUE — nie można dodać dwóch kategorii o tej samej nazwie
            $pdo->prepare('INSERT INTO categories (Name) VALUES (?)')->execute([$name]);
            echo json_encode(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
        } catch (PDOException) {
            // Jeśli PDO rzucił wyjątek, to znaczy że kategoria o tej nazwie już istnieje
            http_response_code(409); // 409 = konflikt
            echo json_encode(['error' => 'Kategoria już istnieje.']);
        }
        break;

    // ── DELETE ───────────────────────────────────────────────────────────────
    // Usuwa kategorię z bazy.
    // JavaScript wysyła: id (CategoryId)
    // Odpowiedź: { ok: true }
    case 'delete':
        $id = (int) ($_POST['id'] ?? 0); // pobieramy ID i upewniamy się, że to liczba

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Brak id.']);
            exit;
        }

        // Najpierw usuwamy powiązania tej kategorii z zadaniami (tabela pośrednia "taskcategories")
        // (baza nie ma skonfigurowanych kaskadowych usunięć, więc robimy to ręcznie)
        $pdo->prepare('DELETE FROM taskcategories WHERE CategoryId = ?')->execute([$id]);

        // Teraz możemy bezpiecznie usunąć samą kategorię
        $pdo->prepare('DELETE FROM categories WHERE CategoryId = ?')->execute([$id]);

        echo json_encode(['ok' => true]);
        break;

    // Jeśli "action" nie pasuje do żadnego przypadku powyżej
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Nieznana akcja.']);
}
