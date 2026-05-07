// ============================================
// MedFamily - Login Page
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  checkExistingAuth();

  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('loginButton');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');

  let countdownInterval = null;

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;

    if (type === 'text') {
      togglePasswordIcon.classList.remove('bi-eye');
      togglePasswordIcon.classList.add('bi-eye-slash');
    } else {
      togglePasswordIcon.classList.remove('bi-eye-slash');
      togglePasswordIcon.classList.add('bi-eye');
    }
  });

  // Form validation
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Hide previous errors
    hideError();

    // Validate form
    if (!loginForm.checkValidity()) {
      loginForm.classList.add('was-validated');
      return;
    }

    // Get form data
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate email format
    if (!MedFamily.isValidEmail(email)) {
      showError('Please enter a valid email address.');
      emailInput.classList.add('is-invalid');
      return;
    }

    // Show loading state
    MedFamily.setButtonLoading(loginButton, true);

    try {
      // Call login API
      const response = await MedFamily.apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store token and user data
      MedFamily.setAuthToken(response.token);
      MedFamily.setUserData(response.user);

      // Show success message
      MedFamily.showToast('Login successful! Redirecting...', 'success');

      // Redirect based on role after a short delay
      setTimeout(() => {
        MedFamily.redirectByRole(response.user);
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);

      const data = error.data || {};

      if (data.locked) {
        showLockoutCountdown(data.seconds_remaining, data.locked_until);
      } else if (error.message.includes('Invalid email or password')) {
        let errorText = 'Invalid email or password.';
        if (data.attempts_remaining !== undefined) {
          const r = data.attempts_remaining;
          errorText += ` ${r} attempt${r === 1 ? '' : 's'} remaining before lockout.`;
        }
        showError(errorText);
      } else if (error.message.includes('deactivated')) {
        showError('Your account has been deactivated. Please contact an administrator.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        showError('Network error. Please check your internet connection and try again.');
      } else {
        showError('An error occurred during login. Please try again.');
      }

      MedFamily.setButtonLoading(loginButton, false);
    }
  });

  // Real-time email validation
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !MedFamily.isValidEmail(email)) {
      emailInput.classList.add('is-invalid');
    } else {
      emailInput.classList.remove('is-invalid');
    }
  });

  // Clear validation on input
  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('is-invalid');
    hideError();
  });

  passwordInput.addEventListener('input', () => {
    passwordInput.classList.remove('is-invalid');
    hideError();
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideError() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    loginButton.disabled = false;
    errorAlert.classList.add('d-none');
    errorMessage.textContent = '';
  }

  function showLockoutCountdown(secondsRemaining, lockedUntil) {
    loginButton.disabled = true;
    const until = new Date(lockedUntil).getTime();

    function tick() {
      const secs = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      const mins = Math.floor(secs / 60);
      const s = secs % 60;
      const timeStr = mins + ':' + String(s).padStart(2, '0');

      errorMessage.textContent =
        'Account temporarily locked. Too many failed attempts. Try again in ' + timeStr + '.';
      errorAlert.classList.remove('d-none');

      if (secs <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        loginButton.disabled = false;
        errorMessage.textContent = 'Account unlocked. You may try again.';
      }
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // Check if user is already logged in
  async function checkExistingAuth() {
    const userData = await MedFamily.checkAuth();
    if (userData) {
      // User is already logged in - redirect to appropriate page
      MedFamily.showToast('You are already logged in. Redirecting...', 'info');
      setTimeout(() => {
        MedFamily.redirectByRole(userData);
      }, 1000);
    }
  }
});
