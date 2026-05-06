const EYE_OPEN = './visibility_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';
const EYE_LOCK = './visibility_lock_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';

// Widoczność
function setupToggle(inputId, toggleId) {
	const input = document.getElementById(inputId);
	const toggle = document.getElementById(toggleId);
	toggle.addEventListener('click', () => {
		const isPassword = input.type === 'password';
		input.type = isPassword ? 'text' : 'password';
		toggle.src = isPassword ? EYE_LOCK : EYE_OPEN;
	});
}

setupToggle('password', 'togglePassword');
setupToggle('confirm-password', 'togglePassword-confirm');

const regError = document.getElementById('regError');

// Formularz
document.querySelector('form').addEventListener('submit', async e => {
	e.preventDefault();
	regError.textContent = '';

	const username = document.getElementById('username').value.trim();
	const email = document.getElementById('email').value.trim();
	const password = document.getElementById('password').value;
	const confirm = document.getElementById('confirm-password').value;

	// Walidacja
	if (password !== confirm) {
		regError.textContent = 'Hasła nie są identyczne.';
		return;
	}

	try {
		const form = new FormData();
		form.append('username', username);
		form.append('email', email);
		form.append('password', password);

		const res = await fetch('./api/register.php', {
			method: 'POST',
			body: form,
		});
		const data = await res.json();

		if (res.ok) {
			window.location.href = './login.html';
		} else {
			regError.textContent = data.error;
		}
	} catch (err) {
		regError.textContent = 'Błąd połączenia z serwerem.';
	}
});
