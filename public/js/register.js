// ============================================
// MedFamily - Registration Page
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  checkExistingAuth();

  // Get form elements
  const registerForm = document.getElementById('registerForm');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const roleSelect = document.getElementById('role');
  const inviteCodeInput = document.getElementById('inviteCode');
  const agreeTermsCheckbox = document.getElementById('agreeTerms');

  // Role-based family code validation
  roleSelect.addEventListener('change', (e) => {
    const inviteInput = document.getElementById('inviteCode');
    const inviteLabel = document.getElementById('inviteCodeLabel');
    const inviteHelp = document.getElementById('inviteCodeHelp');

    if (e.target.value === 'caregiver') {
      inviteInput.required = true;
      inviteLabel.innerHTML = 'Family Invite Code <span class="text-danger">*</span>';
      inviteHelp.textContent = 'Required: Get this code from a patient in your family';
      inviteHelp.classList.remove('text-muted');
      inviteHelp.classList.add('text-danger');
    } else {
      inviteInput.required = false;
      inviteLabel.innerHTML = 'Family Invite Code <span class="text-muted">(Optional)</span>';
      inviteHelp.textContent = 'Optional: Join an existing family account';
      inviteHelp.classList.remove('text-danger');
      inviteHelp.classList.add('text-muted');
    }
  });
  const registerButton = document.getElementById('registerButton');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');
  const passwordStrengthBar = document.getElementById('passwordStrengthBar');
  const passwordStrengthText = document.getElementById('passwordStrengthText');

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    confirmPasswordInput.type = type;

    if (type === 'text') {
      togglePasswordIcon.classList.remove('bi-eye');
      togglePasswordIcon.classList.add('bi-eye-slash');
    } else {
      togglePasswordIcon.classList.remove('bi-eye-slash');
      togglePasswordIcon.classList.add('bi-eye');
    }
  });

  // Password strength indicator
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    MedFamily.updatePasswordStrength(password, passwordStrengthBar, passwordStrengthText);

    // Clear validation state
    passwordInput.classList.remove('is-invalid', 'is-valid');
    hideError();
  });

  // Confirm password validation
  confirmPasswordInput.addEventListener('input', () => {
    validatePasswordMatch();
    hideError();
  });

  passwordInput.addEventListener('blur', () => {
    validatePasswordMatch();
  });

  // Email validation
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !MedFamily.isValidEmail(email)) {
      emailInput.classList.add('is-invalid');
    } else {
      emailInput.classList.remove('is-invalid');
    }
  });

  emailInput.addEventListener('input', () => {
    emailInput.classList.remove('is-invalid');
    hideError();
  });

  // Form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Hide previous errors
    hideError();

    // Validate form
    if (!registerForm.checkValidity()) {
      registerForm.classList.add('was-validated');
      return;
    }

    // Get form data
    const formData = {
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim() || undefined,
      password: passwordInput.value,
      role: roleSelect.value,
      family_invite_code: inviteCodeInput.value.trim() || undefined,
    };

    // Additional validation
    if (!MedFamily.isValidEmail(formData.email)) {
      showError('Please enter a valid email address.');
      emailInput.classList.add('is-invalid');
      return;
    }

    if (!validatePassword(formData.password)) {
      return;
    }

    if (formData.password !== confirmPasswordInput.value) {
      showError('Passwords do not match.');
      confirmPasswordInput.classList.add('is-invalid');
      return;
    }

    if (!agreeTermsCheckbox.checked) {
      showError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    // Show loading state
    MedFamily.setButtonLoading(registerButton, true);

    try {
      // Call registration API
      const response = await MedFamily.apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      // Store token and user data
      MedFamily.setAuthToken(response.token);
      MedFamily.setUserData(response.user);

      // Show success message
      MedFamily.showToast('Account created successfully! Redirecting...', 'success');

      // Redirect based on role after a short delay
      setTimeout(() => {
        MedFamily.redirectByRole(response.user);
      }, 1500);

    } catch (error) {
      console.error('Registration error:', error);

      // Show error message
      let errorText = 'An error occurred during registration. Please try again.';

      if (error.message.includes('email already exists') || error.message.includes('already exists')) {
        errorText = 'An account with this email already exists. Please log in instead.';
      } else if (error.message.includes('Invalid family invite code')) {
        errorText = 'Invalid family invite code. Please check the code and try again.';
        inviteCodeInput.classList.add('is-invalid');
      } else if (error.message.includes('Password must')) {
        errorText = error.message;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorText = 'Network error. Please check your internet connection and try again.';
      }

      showError(errorText);
      MedFamily.setButtonLoading(registerButton, false);
    }
  });

  // Helper function to validate password
  function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('one number');
    }

    if (errors.length > 0) {
      showError(`Password must contain ${errors.join(', ')}.`);
      passwordInput.classList.add('is-invalid');
      return false;
    }

    passwordInput.classList.remove('is-invalid');
    return true;
  }

  // Helper function to validate password match
  function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (confirmPassword && password !== confirmPassword) {
      confirmPasswordInput.classList.add('is-invalid');
      return false;
    } else if (confirmPassword) {
      confirmPasswordInput.classList.remove('is-invalid');
      confirmPasswordInput.classList.add('is-valid');
      return true;
    }

    confirmPasswordInput.classList.remove('is-invalid', 'is-valid');
    return true;
  }

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
