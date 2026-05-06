<?php
// Konfiguracja
$host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'db';
$user = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'user';
$pass = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: 'haslo123';
$name = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'axis';


$pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
