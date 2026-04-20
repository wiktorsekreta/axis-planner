const EYE_OPEN = './visibility_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';
const EYE_LOCK = './visibility_lock_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';

const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePassword.src = isPassword ? EYE_LOCK : EYE_OPEN;
});
