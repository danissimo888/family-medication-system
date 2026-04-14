// ============================================
// MedFamily - Login Page
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  checkExistingAuth();

  // Get form elements
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.getElementById('loginButton');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');

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

      // Show error message
      let errorText = 'An error occurred during login. Please try again.';

      if (error.message.includes('Invalid email or password')) {
        errorText = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('deactivated')) {
        errorText = 'Your account has been deactivated. Please contact an administrator.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorText = 'Network error. Please check your internet connection and try again.';
      }

      showError(errorText);
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

  // Helper function to show error
  function showError(message) {
    errorMessage.textContent = message;
    errorAlert.classList.remove('d-none');
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Helper function to hide error
  function hideError() {
    errorAlert.classList.add('d-none');
    errorMessage.textContent = '';
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
