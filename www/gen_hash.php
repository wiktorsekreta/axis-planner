<?php
// Pomocniczy skrypt do generowania hashy bcrypt dla haseł.
// Używaj go, gdy chcesz ręcznie dodać użytkownika do bazy przez INSERT INTO.
//
// Jak używać:
//   1. Otwórz w przeglądarce: http://localhost:8080/gen_hash.php?p=TWOJE_HASLO
//   2. Skopiuj wyświetlony hash
//   3. Wklej go do zapytania SQL, np.:
//      INSERT INTO users (UserName, Email, Password) VALUES ('jan', 'jan@test.pl', '<WKLEJONY_HASH>');

// Pobieramy hasło z parametru URL (np. ?p=mojehaslo)
$password = $_GET['p'] ?? '';

// Jeśli nie podano hasła — wyświetlamy instrukcję
if (!$password) {
    echo 'Podaj hasło w parametrze ?p=HASLO';
    exit;
}

// password_hash() tworzy bezpieczny hash bcrypt z losową "solą"
// htmlspecialchars() zabezpiecza wyświetlany tekst przed atakami XSS (gdyby ktoś wpisał <script>...)
echo htmlspecialchars(password_hash($password, PASSWORD_BCRYPT));
