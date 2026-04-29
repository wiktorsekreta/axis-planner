<?php
// Ten plik obsługuje logowanie użytkownika.
// Odbiera login i hasło, sprawdza je w bazie, a jeśli są poprawne — tworzy sesję.

// Mówimy przeglądarce, że odpowiedź jest w formacie JSON (nie HTML)
header('Content-Type: application/json');

// Uruchamiamy mechanizm sesji PHP — dzięki temu możemy zapamiętać, kto jest zalogowany
session_start();

// Dołączamy plik z połączeniem do bazy danych (zmienna $pdo staje się dostępna)
try {
    require __DIR__ . '/db.php';
} catch (Exception $e) {
    // Jeśli baza jest niedostępna, zwracamy błąd 503 (serwis niedostępny)
    http_response_code(503);
    echo json_encode(['error' => 'Błąd połączenia z bazą danych.']);
    exit;
}

// Pobieramy dane z formularza logowania wysłanego metodą POST
// trim() usuwa zbędne spacje z początku i końca
$username = trim($_POST['username'] ?? '');  // login lub e-mail
$password = $_POST['password'] ?? '';  // hasło (nie trimmujemy — spacje mogą być celowe)

// Sprawdzamy, czy oba pola zostały wypełnione
if (!$username || !$password) {
    http_response_code(400); // 400 = błąd po stronie użytkownika (złe zapytanie)
    echo json_encode(['error' => 'Wypełnij wszystkie pola.']);
    exit;
}

// Szukamy użytkownika w bazie — może się logować zarówno loginem, jak i adresem e-mail
$stmt = $pdo->prepare('SELECT UserId, UserName, Password FROM users WHERE UserName = ? OR Email = ?');
$stmt->execute([$username, $username]); // ten sam $username sprawdzamy w obu kolumnach
$user = $stmt->fetch(); // fetch() zwraca jeden wiersz lub false, gdy nic nie znaleziono

// Sprawdzamy, czy użytkownik istnieje
if (!$user) {
    http_response_code(401); // 401 = brak autoryzacji
    echo json_encode(['error' => 'Nieprawidłowa nazwa użytkownika/e-mail lub hasło.']);
    exit;
}

// Sprawdzamy, czy hasło w bazie to hash bcrypt (hashe bcrypt zaczynają się od "$2y$" lub "$2b$")
$isBcrypt = str_starts_with($user['Password'], '$2y$') || str_starts_with($user['Password'], '$2b$');

if ($isBcrypt) {
    // Hasło jest zahashowane — używamy password_verify(), która porównuje hasło z hashem
    $valid = password_verify($password, $user['Password']);
} else {
    // Hasło jest zwykłym tekstem (dodane ręcznie przez INSERT INTO)
    // Porównujemy bezpośrednio
    $valid = ($password === $user['Password']);

    if ($valid) {
        // Przy pierwszym udanym logowaniu automatycznie zamieniamy plaintext na bezpieczny hash bcrypt
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE users SET Password = ? WHERE UserId = ?')
            ->execute([$hash, $user['UserId']]);
    }
}

// Jeśli hasło było złe — odmawiamy dostępu
if (!$valid) {
    http_response_code(401);
    echo json_encode(['error' => 'Nieprawidłowa nazwa użytkownika/e-mail lub hasło.']);
    exit;
}

// Logowanie udane — zapisujemy dane użytkownika w sesji
// Sesja działa jak "naklejka" na przeglądarce — inne pliki PHP też ją odczytają
$_SESSION['user_id']  = $user['UserId'];
$_SESSION['username'] = $user['UserName'];

// Zwracamy sukces i nazwę użytkownika do JavaScript
echo json_encode(['ok' => true, 'username' => $user['UserName']]);
