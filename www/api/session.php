<?php
// Ten plik sprawdza, czy użytkownik jest aktualnie zalogowany.
// Używany przez JavaScript przy ładowaniu strony — żeby wiedzieć, czy pokazać panel czy ekran logowania.

// Mówimy przeglądarce, że odpowiedź jest w formacie JSON
header('Content-Type: application/json');

// Uruchamiamy sesję PHP — to pozwala odczytać dane zapisane podczas logowania
session_start();

// Sprawdzamy, czy w sesji istnieje user_id (zapisywane podczas udanego logowania w login.php)
if (empty($_SESSION['user_id'])) {
    // Brak user_id w sesji = użytkownik nie jest zalogowany
    http_response_code(401); // 401 = brak autoryzacji
    echo json_encode(['error' => 'Nie zalogowano.']);
    exit;
}

// Użytkownik jest zalogowany — zwracamy jego dane
echo json_encode([
    'ok'       => true,
    'user_id'  => (int) $_SESSION['user_id'],   // ID użytkownika z bazy danych
    'username' => $_SESSION['username'],         // nazwa użytkownika do wyświetlenia
]);
