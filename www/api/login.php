<?php
header('Content-Type: application/json');
session_start();

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
$password = $_POST['password'] ?? '';

// Walidacja
if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Wypełnij wszystkie pola.']);
    exit;
}

// Zapytanie
$stmt = $pdo->prepare('SELECT UserId, UserName, Password FROM users WHERE UserName = ? OR Email = ?');
$stmt->execute([$username, $username]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Nieprawidłowa nazwa użytkownika/e-mail lub hasło.']);
    exit;
}

// Weryfikacja hasła
$isBcrypt = str_starts_with($user['Password'], '$2y$') || str_starts_with($user['Password'], '$2b$');

if ($isBcrypt) {
    $valid = password_verify($password, $user['Password']);
} else {
    $valid = ($password === $user['Password']);

    if ($valid) {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE users SET Password = ? WHERE UserId = ?')
            ->execute([$hash, $user['UserId']]);
    }
}

if (!$valid) {
    http_response_code(401);
    echo json_encode(['error' => 'Nieprawidłowa nazwa użytkownika/e-mail lub hasło.']);
    exit;
}


$_SESSION['user_id']  = $user['UserId'];
$_SESSION['username'] = $user['UserName'];

// Ciasteczko
if (($_POST['remember'] ?? '0') === '1') {
    setcookie('remember_username', $user['UserName'], time() + 30 * 24 * 3600, '/');
} else {
    setcookie('remember_username', '', time() - 1, '/');
}

echo json_encode(['ok' => true, 'username' => $user['UserName']]);
