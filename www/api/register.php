<?php
header('Content-Type: application/json');
require __DIR__ . '/db.php';

$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$email    = trim($data['email']    ?? '');
$password =      $data['password'] ?? '';

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

$stmt = $pdo->prepare('SELECT UserId FROM users WHERE UserName = ? OR Email = ?');
$stmt->execute([$username, $email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Użytkownik lub e-mail już istnieje.']);
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$pdo->prepare('INSERT INTO users (UserName, Email, Password) VALUES (?, ?, ?)')
    ->execute([$username, $email, $hash]);

echo json_encode(['ok' => true]);
