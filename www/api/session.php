<?php
header('Content-Type: application/json');
session_start();


if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Nie zalogowano.']);
    exit;
}

echo json_encode([
    'ok'       => true,
    'user_id'  => (int) $_SESSION['user_id'],
    'username' => $_SESSION['username'],
]);
