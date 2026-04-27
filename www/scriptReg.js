// Ten plik obsługuje logikę strony rejestracji (index1.html).
// Odpowiada za: pokazywanie/ukrywanie haseł, walidację i wysyłanie formularza.

// Ścieżki do dwóch ikon oka
const EYE_OPEN = './visibility_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';
const EYE_LOCK = './visibility_lock_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';

// Funkcja do obsługi przycisku pokazywania/ukrywania hasła.
// Przyjmuje ID pola hasła i ID ikony, żeby można jej użyć wielokrotnie
// (jest dwa pola hasła: "hasło" i "potwierdź hasło").
function setupToggle(inputId, toggleId) {
    const input  = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    toggle.addEventListener('click', () => {
        const isPassword = input.type === 'password'; // czy aktualnie ukryte?
        input.type = isPassword ? 'text' : 'password'; // przełącz widoczność
        toggle.src = isPassword ? EYE_LOCK : EYE_OPEN; // zmień ikonę
    });
}

// Ustawiamy obsługę oka dla obu pól hasła
setupToggle('password', 'togglePassword');
setupToggle('confirm-password', 'togglePassword-confirm');

// Element do wyświetlania błędów rejestracji
const regError = document.getElementById('regError');

// Obsługa wysłania formularza (kliknięcie "Zarejestruj się")
document.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault(); // blokujemy domyślne przeładowanie strony
    regError.textContent = ''; // czyścimy poprzedni błąd

    // Pobieramy wartości ze wszystkich pól formularza
    const username = document.getElementById('username').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirm-password').value;

    // Sprawdzamy po stronie klienta (przed wysłaniem do serwera), czy hasła są identyczne
    if (password !== confirm) {
        regError.textContent = 'Hasła nie są identyczne.';
        return; // przerywamy — nie wysyłamy formularza
    }

    try {
        // Tworzymy obiekt FormData i ręcznie dodajemy pola
        // FormData wysyła dane jako multipart/form-data — PHP odczytuje je przez $_POST
        const form = new FormData();
        form.append('username', username);
        form.append('email',    email);
        form.append('password', password);

        // Wysyłamy żądanie POST do serwera
        const res  = await fetch('./api/register.php', {
            method: 'POST',
            body: form,
        });
        const data = await res.json(); // parsujemy odpowiedź JSON

        if (res.ok) {
            // Rejestracja udana — przekierowujemy na stronę logowania
            window.location.href = './index.html';
        } else {
            // Serwer zwrócił błąd (np. użytkownik już istnieje) — wyświetlamy komunikat
            regError.textContent = data.error;
        }
    } catch (err) {
        // Błąd sieci (np. brak połączenia z serwerem)
        regError.textContent = 'Błąd połączenia z serwerem.';
    }
});
