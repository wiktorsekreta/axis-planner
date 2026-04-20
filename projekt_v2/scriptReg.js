const EYE_OPEN = './visibility_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';
const EYE_LOCK = './visibility_lock_16dp_000000_FILL0_wght400_GRAD0_opsz20.svg';

function setupToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    toggle.addEventListener('click', () => {
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        toggle.src = isPassword ? EYE_LOCK : EYE_OPEN;
    });
}

setupToggle('password', 'togglePassword');
setupToggle('confirm-password', 'togglePassword-confirm');
