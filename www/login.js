// Ikony
const EYE_OPEN = './visibility_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';
const EYE_LOCK = './visibility_lock_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';

// Elementy
const passwordInput  = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const loginError     = document.getElementById('loginError');
const usernameInput  = document.getElementById('username');
const rememberCheck  = document.getElementById('remember');

// Ciasteczko — pomocnicze
function getCookie(name) {
	const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
	return match ? decodeURIComponent(match[1]) : null;
}

// Widoczność
togglePassword.addEventListener('click', () => {
	const isPassword = passwordInput.type === 'password';
	passwordInput.type = isPassword ? 'text' : 'password';
	togglePassword.src = isPassword ? EYE_LOCK : EYE_OPEN;
});

// Wczytaj zapisaną nazwę użytkownika
const saved = getCookie('remember_username');
if (saved) {
	usernameInput.value = saved;
	rememberCheck.checked = true;
}

// Formularz
document.querySelector('form').addEventListener('submit', async e => {
	e.preventDefault();
	loginError.textContent = '';

	const username = usernameInput.value.trim();
	const password = passwordInput.value;
	const remember = rememberCheck.checked ? '1' : '0';

	const res  = await fetch('./api/login.php', {
		method: 'POST',
		body: new URLSearchParams({ username, password, remember }),
	});
	const data = await res.json();

	if (res.ok) {
		sessionStorage.setItem('username', data.username);
		window.location.href = './mainPage.html';
	} else {
		loginError.textContent = data.error;
	}
});
