<?php

$password = $_GET['p'] ?? '';

if (!$password) {
    echo 'Podaj hasło w parametrze ?p=HASLO';
    exit;
}

echo htmlspecialchars(password_hash($password, PASSWORD_BCRYPT));
