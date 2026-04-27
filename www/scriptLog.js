// Ten plik obsługuje logikę strony logowania (index.html).
// Odpowiada za: pokazywanie/ukrywanie hasła oraz wysyłanie formularza do serwera.

// Ścieżki do dwóch ikon oka (otwarte = widoczne hasło, zamknięte = ukryte hasło)
const EYE_OPEN = './visibility_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';
const EYE_LOCK = './visibility_lock_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';

// Pobieramy elementy ze strony po ich ID
const passwordInput  = document.getElementById('password');       // pole hasła
const togglePassword = document.getElementById('togglePassword'); // ikona oka
const loginError     = document.getElementById('loginError');     // miejsce na komunikat błędu

// Obsługa kliknięcia w ikonę oka — przełącza widoczność hasła
togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password'; // czy aktualnie ukryte?
    passwordInput.type = isPassword ? 'text' : 'password'; // zmień typ pola
    togglePassword.src = isPassword ? EYE_LOCK : EYE_OPEN; // zmień ikonę
});

// Obsługa wysłania formularza (kliknięcie "Zaloguj")
document.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault(); // blokujemy domyślne zachowanie przeglądarki (przeładowanie strony)
    loginError.textContent = ''; // czyścimy poprzedni komunikat błędu

    // Pobieramy wartości wpisane przez użytkownika
    const username = document.getElementById('username').value.trim(); // trim() usuwa spacje
    const password = passwordInput.value;

    // Wysyłamy dane do serwera metodą POST jako application/x-www-form-urlencoded
    // PHP odczytuje te dane przez $_POST
    const res  = await fetch('./api/login.php', {
        method: 'POST',
        body: new URLSearchParams({ username, password }),
    });
    const data = await res.json(); // parsujemy odpowiedź JSON z serwera

    if (res.ok) {
        // Logowanie udane — zapamiętujemy nazwę użytkownika w sessionStorage
        // (sessionStorage ginie po zamknięciu zakładki, w przeciwieństwie do localStorage)
        sessionStorage.setItem('username', data.username);
        // Przechodzimy do głównej strony aplikacji
        window.location.href = './MainPage.html';
    } else {
        // Serwer zwrócił błąd (np. złe hasło) — wyświetlamy komunikat pod formularzem
        loginError.textContent = data.error;
    }
});
