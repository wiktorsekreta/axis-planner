<?php
header('Content-Type: application/json');

// Baza
try {
    require __DIR__ . '/db.php';
} catch (Exception $e) {
    http_response_code(503);
    echo json_encode(['error' => 'Błąd połączenia z bazą danych.']);
    exit;
}

// Dane
$username = trim($_POST['username'] ?? '');
$email    = trim($_POST['email']   ?? '');
$password = $_POST['password'] ?? '';

// Walidacja
if (!$username || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Wypełnij wszystkie pola.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Nieprawidłowy adres e-mail.']);
    exit;
}

try {
    // Duplikacja 
    $stmt = $pdo->prepare('SELECT UserId FROM users WHERE UserName = ? OR Email = ?');
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Użytkownik lub e-mail już istnieje.']);
        exit;
    }

    // Hash
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Zapis
    $pdo->prepare('INSERT INTO users (UserName, Email, Password) VALUES (?, ?, ?)')
        ->execute([$username, $email, $hash]);

    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Błąd serwera: ' . $e->getMessage()]);
}
