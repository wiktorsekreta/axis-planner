<?php
// Ten plik obsługuje rejestrację nowego użytkownika.
// Odbiera dane z formularza, sprawdza je, hashuje hasło i zapisuje konto do bazy.

// Mówimy przeglądarce, że odpowiedź jest w formacie JSON
header('Content-Type: application/json');

// Dołączamy plik z połączeniem do bazy danych
try {
    require __DIR__ . '/db.php';
} catch (Exception $e) {
    // Jeśli baza jest niedostępna, zwracamy błąd 503
    http_response_code(503);
    echo json_encode(['error' => 'Błąd połączenia z bazą danych.']);
    exit;
}

// Pobieramy dane z formularza rejestracji
// trim() usuwa przypadkowe spacje z początku i końca wpisanego tekstu
$username = trim($_POST['username'] ?? '');  // nazwa użytkownika
$email    = trim($_POST['email']   ?? '');  // adres e-mail
$password =      $_POST['password'] ?? ''; // hasło (bez trim — spacje mogą być celowe)

// Sprawdzamy, czy wszystkie pola są wypełnione
if (!$username || !$email || !$password) {
    http_response_code(400); // 400 = błąd użytkownika
    echo json_encode(['error' => 'Wypełnij wszystkie pola.']);
    exit;
}

// Sprawdzamy, czy podany e-mail ma prawidłowy format (np. czy zawiera "@" i domenę)
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Nieprawidłowy adres e-mail.']);
    exit;
}

try {
    // Sprawdzamy, czy w bazie już nie ma konta z taką samą nazwą użytkownika LUB e-mailem
    $stmt = $pdo->prepare('SELECT UserId FROM users WHERE UserName = ? OR Email = ?');
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        // fetch() zwróciło wiersz — konto już istnieje
        http_response_code(409); // 409 = konflikt (zasób już istnieje)
        echo json_encode(['error' => 'Użytkownik lub e-mail już istnieje.']);
        exit;
    }

    // Hashujemy hasło algorytmem bcrypt — nigdy nie przechowujemy haseł w postaci jawnej!
    // password_hash() generuje losowy "sól" i tworzy bezpieczny hash
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Zapisujemy nowe konto do bazy danych
    $pdo->prepare('INSERT INTO users (UserName, Email, Password) VALUES (?, ?, ?)')
        ->execute([$username, $email, $hash]);

    // Zwracamy sukces
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    // Nieoczekiwany błąd bazy danych
    http_response_code(500);
    echo json_encode(['error' => 'Błąd serwera: ' . $e->getMessage()]);
}
