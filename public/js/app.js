// ============================================
// MedFamily - Shared Frontend Utilities
// ============================================

// API Base URL (adjust for production)
const API_BASE_URL = window.location.origin + '/api';

// ============================================
// Local Storage Keys
// ============================================
const AUTH_TOKEN_KEY = 'medfamily_auth_token';
const USER_DATA_KEY = 'medfamily_user_data';

// ============================================
// Auth Token Management
// ============================================

/**
 * Get the authentication token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Set the authentication token in localStorage
 * @param {string} token - JWT token
 */
function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem('patient_id');
  sessionStorage.removeItem('patient_id');
}

/**
 * Get stored user data from localStorage
 * @returns {object|null} User data or null
 */
function getUserData() {
  const data = localStorage.getItem(USER_DATA_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Set user data in localStorage
 * @param {object} userData - User data object
 */
function setUserData(userData) {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

// ============================================
// API Fetch Wrapper
// ============================================

/**
 * Wrapper around fetch that automatically attaches JWT token
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Attach JWT token if available (except for public endpoints)
  const token = getAuthToken();
  if (token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Attach status and data to error for better handling
      const error = new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = data;

      if (response.status === 401) {
        clearAuthToken();
        if (!window.location.pathname.includes('login')) {
          window.location.href = '/pages/login.html';
        }
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}

// ============================================
// Auth Check
// ============================================

// Check if user is authenticated. Uses cached data if token is still valid.
async function checkAuth() {
  const token = getAuthToken();
  if (!token) return null;

  // Use cached user data if available — avoids a round trip on every page load
  const cached = getUserData();
  if (cached) return cached;

  try {
    const userData = await apiFetch('/auth/me');
    setUserData(userData);
    return userData;
  } catch (error) {
    console.error('Auth check failed:', error);
    clearAuthToken();
    return null;
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 * @returns {Promise<object>} User data
 */
async function requireAuth() {
  const userData = await checkAuth();
  if (!userData) {
    window.location.href = '/pages/login.html';
    throw new Error('Authentication required');
  }
  return userData;
}

/**
 * Require specific role - redirect if user doesn't have required role
 * @param {string|string[]} allowedRoles - Role or array of roles
 * @returns {Promise<object>} User data
 */
async function requireRole(allowedRoles) {
  const userData = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(userData.role)) {
    showToast('You do not have permission to access this page.', 'danger');
    redirectByRole(userData);
    throw new Error('Insufficient permissions');
  }

  return userData;
}

// ============================================
// Logout
// ============================================

/**
 * Log out the current user
 */
function logout() {
  clearAuthToken();
  showToast('You have been logged out successfully.', 'success');
  setTimeout(() => {
    window.location.href = '/pages/login.html';
  }, 1000);
}

// ============================================
// Role-Based Redirect
// ============================================

/**
 * Redirect user to appropriate page based on their role
 * @param {object} user - User object with role property
 */
function redirectByRole(user) {
  const roleRoutes = {
    patient: '/pages/dashboard.html',
    caregiver: '/pages/caregiver.html',
    admin: '/pages/admin.html',
  };

  const route = roleRoutes[user.role] || '/pages/dashboard.html';
  window.location.href = route;
}

// ============================================
// Toast Notifications
// ============================================

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, danger, warning, info)
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  // Remove any existing toasts
  const existingToast = document.querySelector('.toast-container');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast container
  const container = document.createElement('div');
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '9999';

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${escapeHtml(message)}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  container.appendChild(toast);
  document.body.appendChild(container);

  // Initialize and show Bootstrap toast
  const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: duration });
  bsToast.show();

  // Remove container after toast is hidden
  toast.addEventListener('hidden.bs.toast', () => {
    container.remove();
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time to readable string
 * @param {string} time - Time string (HH:MM:SS)
 * @returns {string} Formatted time (h:mm AM/PM)
 */
function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatFrequency(freq) {
  const map = {
    once_daily: 'Once a day',
    twice_daily: 'Twice a day',
    three_times_daily: 'Three times a day',
    four_times_daily: 'Four times a day',
    every_6_hours: 'Every 6 hours',
    every_8_hours: 'Every 8 hours',
    every_12_hours: 'Every 12 hours',
    once_weekly: 'Once a week',
    as_needed: 'As needed'
  };
  return map[freq] || freq;
}

/**
 * Show loading spinner on button
 * @param {HTMLElement} button - Button element
 * @param {boolean} loading - Whether to show loading state
 */
function setButtonLoading(button, loading) {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Loading...
    `;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {object} { strength: 'weak'|'medium'|'strong', score: 0-3 }
 */
function checkPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { strength: 'weak', score };
  if (score === 2) return { strength: 'medium', score };
  return { strength: 'strong', score };
}

/**
 * Update password strength indicator
 * @param {string} password - Password to check
 * @param {HTMLElement} indicatorBar - Progress bar element
 * @param {HTMLElement} indicatorText - Text element
 */
function updatePasswordStrength(password, indicatorBar, indicatorText) {
  const { strength } = checkPasswordStrength(password);

  // Remove all strength classes
  indicatorBar.classList.remove('weak', 'medium', 'strong');
  indicatorText.classList.remove('weak', 'medium', 'strong');

  // Add current strength class
  if (password.length > 0) {
    indicatorBar.classList.add(strength);
    indicatorText.classList.add(strength);
    indicatorText.textContent = `Password strength: ${strength}`;
  } else {
    indicatorText.textContent = '';
  }
}

// ============================================
// Navbar Management
// ============================================

/**
 * Update navbar based on auth state
 */
async function updateNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const userData = getUserData();
  const navbarNav = navbar.querySelector('.navbar-nav');

  if (!navbarNav) return;

  if (userData) {
    // User is logged in - show user menu
    navbarNav.innerHTML = `
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          ${escapeHtml(userData.first_name)} ${escapeHtml(userData.last_name)}
        </a>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
          <li><a class="dropdown-item" href="/pages/dashboard.html">Dashboard</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
        </ul>
      </li>
    `;
    const dynLogoutBtn = document.getElementById('logoutBtn');
    if (dynLogoutBtn) dynLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  } else {
    // User is not logged in - show login/register buttons
    navbarNav.innerHTML = `
      <li class="nav-item">
        <a class="nav-link" href="/pages/login.html">Login</a>
      </li>
      <li class="nav-item">
        <a class="btn btn-primary btn-sm ms-2" href="/pages/register.html">Sign Up</a>
      </li>
    `;
  }
}

// ============================================
// Scroll Effects
// ============================================

/**
 * Add scroll effect to navbar
 */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ============================================
// Initialize on DOM Load
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize navbar scroll effect
  initNavbarScroll();

  // Update navbar based on auth state
  updateNavbar();

  // Bind shared buttons (CSP-safe, no inline handlers)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });

  const refreshPageBtn = document.getElementById('refreshPageBtn');
  if (refreshPageBtn) refreshPageBtn.addEventListener('click', () => location.reload());
});

// ============================================
// Safety Warning Modal
// ============================================

/**
 * Show safety warning modal for drug interactions/allergies
 * @param {Array} warnings - Array of warning objects
 * @param {Function} onProceed - Callback when user clicks "Proceed Anyway"
 */
function showSafetyWarningModal(warnings, onProceed) {
  // Remove existing modal if any
  const existingModal = document.getElementById('safetyWarningModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHtml = `
    <div class="modal fade" id="safetyWarningModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              Safety Warning
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <strong>Warning:</strong> Potential safety issues have been detected. Please review carefully before proceeding.
            </div>
            <div class="list-group">
              ${warnings.map(warning => `
                <div class="list-group-item">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">${escapeHtml(warning.type || 'Safety Issue')}</h6>
                    <span class="badge ${warning.severity === 'high' || warning.severity === 'major' ? 'bg-danger' : 'bg-warning text-dark'}">
                      ${escapeHtml(warning.severity || 'moderate')}
                    </span>
                  </div>
                  ${warning.medication_1 && warning.medication_2 ? `
                    <p class="mb-1">
                      <strong>Medications:</strong> ${escapeHtml(warning.medication_1)} + ${escapeHtml(warning.medication_2)}
                    </p>
                  ` : ''}
                  <p class="mb-0 text-muted">${escapeHtml(warning.description || warning.message || 'No description available')}</p>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="proceedAnywayBtn">
              <i class="bi bi-exclamation-triangle me-1"></i>
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Initialize Bootstrap modal
  const modalElement = document.getElementById('safetyWarningModal');
  const modal = new bootstrap.Modal(modalElement);

  // Attach proceed handler
  document.getElementById('proceedAnywayBtn').addEventListener('click', () => {
    modal.hide();
    if (onProceed) onProceed();
  });

  // Remove modal from DOM after it's hidden
  modalElement.addEventListener('hidden.bs.modal', () => {
    modalElement.remove();
  });

  // Show modal
  modal.show();
}

// ============================================
// Export functions for use in other scripts
// ============================================
window.MedFamily = {
  // Auth
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getUserData,
  setUserData,
  checkAuth,
  requireAuth,
  requireRole,
  logout,
  redirectByRole,

  // API
  apiFetch,

  // UI
  showToast,
  setButtonLoading,
  updateNavbar,
  showSafetyWarningModal,

  // Utilities
  escapeHtml,
  formatDate,
  formatTime,
  isValidEmail,
  checkPasswordStrength,
  updatePasswordStrength,
};

// ============================================
// Progress Ring Helper
// ============================================
function renderProgressRing(percentage, size = 120) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  let colorClass = 'progress-ring-success';
  if (percentage < 60) colorClass = 'progress-ring-danger';
  else if (percentage < 80) colorClass = 'progress-ring-warning';
  
  return `
    <div class="progress-ring ${colorClass}">
      <svg width="${size}" height="${size}" class="progress-ring-circle">
        <circle class="progress-ring-bg" cx="${size/2}" cy="${size/2}" r="${radius}"></circle>
        <circle 
          class="progress-ring-progress" 
          cx="${size/2}" 
          cy="${size/2}" 
          r="${radius}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
        ></circle>
      </svg>
      <div class="progress-ring-text">${Math.round(percentage)}%</div>
    </div>
  `;
}

// ============================================
// Count Up Animation
// ============================================
function animateCountUp(element, start, end, duration = 1000) {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current);
  }, 16);
}

// ============================================
// Skeleton Loader Helper
// ============================================
function renderSkeleton(type = 'card') {
  const skeletons = {
    card: '<div class="skeleton skeleton-card"></div>',
    text: '<div class="skeleton skeleton-text"></div>',
    title: '<div class="skeleton skeleton-title"></div>',
    avatar: '<div class="skeleton skeleton-avatar"></div>'
  };
  return skeletons[type] || skeletons.card;
}

// ============================================
// Scroll Animation Observer
// ============================================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-slide-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.feature-icon, .step-badge, .stat-card').forEach(el => {
    observer.observe(el);
  });
}

// Initialize scroll animations on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
  initScrollAnimations();
}

// Export new helpers
window.MedFamily = {
  ...window.MedFamily,
  renderProgressRing,
  animateCountUp,
  renderSkeleton,
  initScrollAnimations
};

