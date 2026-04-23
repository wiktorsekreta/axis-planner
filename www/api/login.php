<?php
header('Content-Type: application/json');
session_start();

try {
    require __DIR__ . '/db.php';
} catch (Exception $e) {
    http_response_code(503);
    echo json_encode(['error' => 'Błąd połączenia z bazą danych.']);
    exit;
}

$username = trim($_POST['username'] ?? '');
$password =      $_POST['password'] ?? '';

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Wypełnij wszystkie pola.']);
    exit;
}

$stmt = $pdo->prepare('SELECT UserId, Password FROM users WHERE UserName = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['Password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Nieprawidłowa nazwa użytkownika lub hasło.']);
    exit;
}

$_SESSION['user_id']  = $user['UserId'];
$_SESSION['username'] = $username;

echo json_encode(['ok' => true, 'username' => $username]);
