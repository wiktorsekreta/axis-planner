const EYE_OPEN = './visibility_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';
const EYE_LOCK = './visibility_lock_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';

const passwordInput  = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const loginError     = document.getElementById('loginError');

togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.src = isPassword ? EYE_LOCK : EYE_OPEN;
});

document.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    loginError.textContent = '';

    const username = document.getElementById('username').value.trim();
    const password = passwordInput.value;

    // URLSearchParams wysyła dane jako application/x-www-form-urlencoded
    // → PHP może je odczytać przez $_POST
    const res  = await fetch('./api/login.php', {
        method: 'POST',
        body: new URLSearchParams({ username, password }),
    });
    const data = await res.json();

    if (res.ok) {
        sessionStorage.setItem('username', data.username);
        window.location.href = './MainPage.html';
    } else {
        loginError.textContent = data.error;
    }
});
