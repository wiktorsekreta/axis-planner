<?php
// Ten plik odpowiada za połączenie z bazą danych.
// Jest dołączany przez inne pliki za pomocą require — nie wywołuje się go bezpośrednio.

// Pobieramy dane do połączenia ze zmiennych środowiskowych (ustawionych np. w Docker Compose).
// Jeśli zmienna nie istnieje, używamy wartości domyślnych po prawej stronie "?:".
$host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'db';         // adres serwera bazy danych
$user = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'user';       // nazwa użytkownika bazy
$pass = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: 'haslo123';   // hasło do bazy
$name = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'axis';       // nazwa bazy danych

// Tworzymy obiekt PDO — to jest "most" między PHP a bazą danych MySQL.
// charset=utf8mb4 zapewnia obsługę polskich znaków i emoji.
$pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
    // ERRMODE_EXCEPTION — jeśli coś pójdzie nie tak z bazą, PHP rzuci wyjątek (zamiast cicho zignorować błąd)
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    // FETCH_ASSOC — wyniki zapytań zwracane jako tablice z nazwami kolumn (np. $row['Email'])
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
