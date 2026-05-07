// Allergies Page - Manage Patient Allergies

let patientId = null;
let selectedMedicationId = null;
let addAllergyModal = null;
let medicationCache = [];

// Initialize allergies page

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Require patient role
    const userData = await requireRole(['patient']);

    // Update user name in navbar
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = `${userData.first_name} ${userData.last_name}`;
    }

    // Get patient ID
    patientId = await getPatientId();
    if (!patientId) {
      showToast('Unable to load patient profile', 'danger');
      return;
    }

    // Initialize modal
    addAllergyModal = new bootstrap.Modal(document.getElementById('addAllergyModal'));

    // Load allergies
    await loadAllergies();

    // Setup form handlers
    setupMedicationSearch();
    setupAllergyForm();

    // Load family code and notifications
    await loadFamilyCode();
    await loadNotifications();

    // Bind buttons
    const copyBtn = document.getElementById('copyFamilyCodeBtn');
    if (copyBtn) copyBtn.addEventListener('click', () => copyFamilyCode());

  } catch (error) {
    console.error('Allergies page initialization error:', error);
    showToast('Failed to load allergies', 'danger');
  }
});

// Get patient ID from API or cache

async function getPatientId() {
  // Check sessionStorage first
  const cached = sessionStorage.getItem('patient_id');
  if (cached) return cached;

  try {
    const patient = await apiFetch('/patients/me');
    sessionStorage.setItem('patient_id', patient.id);
    return patient.id;
  } catch (error) {
    console.error('Failed to get patient ID:', error);
    return null;
  }
}

// Load allergies from API

async function loadAllergies() {
  const container = document.getElementById('allergiesContainer');

  try {
    const allergies = await apiFetch(`/patients/${patientId}/allergies`);

    if (!allergies || allergies.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-shield-check text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-3">No allergies recorded</p>
          <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addAllergyModal">
            <i class="bi bi-plus-circle me-1"></i>
            Add Your First Allergy
          </button>
        </div>
      `;
      return;
    }

    // Render allergies as cards
    container.innerHTML = `
      <div class="row">
        ${allergies.map(allergy => renderAllergyCard(allergy)).join('')}
      </div>
    `;

    // Attach delete handlers
    allergies.forEach(allergy => {
      const deleteBtn = document.getElementById(`delete-${allergy.id}`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteAllergy(allergy.id, allergy.allergen_name));
      }
    });

  } catch (error) {
    console.error('Failed to load allergies:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load allergies. Please try again.
      </div>
    `;
  }
}

// Render allergy card

function renderAllergyCard(allergy) {
  const severityBadges = {
    mild: '<span class="badge bg-warning text-dark">Mild</span>',
    moderate: '<span class="badge bg-orange text-white" style="background-color: #fd7e14;">Moderate</span>',
    severe: '<span class="badge bg-danger">Severe</span>'
  };

  return `
    <div class="col-md-6 col-lg-4 mb-3">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title mb-0">
              <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
              ${escapeHtml(allergy.allergen_name)}
            </h5>
            ${severityBadges[allergy.severity] || severityBadges.mild}
          </div>

          <p class="card-text">
            <strong>Reaction:</strong> ${escapeHtml(allergy.reaction)}
          </p>

          ${allergy.notes ? `
            <p class="card-text text-muted">
              <small><strong>Notes:</strong> ${escapeHtml(allergy.notes)}</small>
            </p>
          ` : ''}

          <p class="card-text">
            <small class="text-muted">Recorded: ${formatDate(allergy.created_at)}</small>
          </p>
        </div>
        <div class="card-footer bg-transparent">
          <button class="btn btn-sm btn-outline-danger w-100" id="delete-${allergy.id}">
            <i class="bi bi-trash me-1"></i>
            Remove
          </button>
        </div>
      </div>
    </div>
  `;
}

// Setup medication search with client-side cache

function setupMedicationSearch() {
  const searchInput = document.getElementById('medicationSearch');
  const resultsDiv = document.getElementById('medicationResults');
  const hiddenInput = document.getElementById('selectedMedicationId');

  // Prefetch on modal open
  document.getElementById('addAllergyModal').addEventListener('show.bs.modal', async () => {
    if (medicationCache.length === 0) {
      try { medicationCache = await apiFetch('/medications'); } catch (e) { /* ignore */ }
    }
  });

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length < 2) { resultsDiv.style.display = 'none'; return; }

    const matches = medicationCache.filter(m =>
      (m.brand_name || '').toLowerCase().includes(q) || (m.generic_name || '').toLowerCase().includes(q)
    ).slice(0, 10);

    if (!matches.length) {
      resultsDiv.innerHTML = '<div class="list-group-item text-muted">No medications found</div>';
    } else {
      resultsDiv.innerHTML = matches.map(med => `
        <button type="button" class="list-group-item list-group-item-action" data-med-id="${med.id}" data-med-name="${escapeHtml(med.brand_name || med.generic_name)}">
          ${escapeHtml(med.brand_name || med.generic_name)}
          ${med.generic_name && med.brand_name && med.brand_name !== med.generic_name ? `<small class="text-muted d-block">${escapeHtml(med.generic_name)}</small>` : ''}
        </button>
      `).join('');
    }
    resultsDiv.style.display = 'block';

    resultsDiv.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMedicationId = btn.dataset.medId;
        searchInput.value = btn.dataset.medName;
        hiddenInput.value = selectedMedicationId;
        resultsDiv.style.display = 'none';
      });
    });
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.style.display = 'none';
    }
  });
}

// Setup allergy form submission

function setupAllergyForm() {
  const form = document.getElementById('addAllergyForm');
  const submitBtn = document.getElementById('submitAllergyBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate form
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const medicationId = document.getElementById('selectedMedicationId').value;
    if (!medicationId) {
      showToast('Please select a medication', 'warning');
      return;
    }

    const medicationName = document.getElementById('medicationSearch').value.trim();
    const severity = document.getElementById('severity').value;
    const reaction = document.getElementById('reaction').value;
    const notes = document.getElementById('notes').value;

    try {
      setButtonLoading(submitBtn, true);

      await apiFetch(`/patients/${patientId}/allergies`, {
        method: 'POST',
        body: JSON.stringify({
          medication_id: medicationId,
          allergen_name: medicationName,
          severity,
          reaction,
          notes: notes || null
        })
      });

      showToast('Allergy added successfully', 'success');
      addAllergyModal.hide();
      form.reset();
      form.classList.remove('was-validated');
      selectedMedicationId = null;
      document.getElementById('selectedMedicationId').value = '';

      // Reload allergies
      await loadAllergies();

    } catch (error) {
      console.error('Failed to add allergy:', error);
      showToast(error.message || 'Failed to add allergy', 'danger');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Reset form when modal closes
  document.getElementById('addAllergyModal').addEventListener('hidden.bs.modal', () => {
    form.reset();
    form.classList.remove('was-validated');
    selectedMedicationId = null;
    document.getElementById('selectedMedicationId').value = '';
    document.getElementById('medicationResults').style.display = 'none';
  });
}

// Delete allergy with confirmation

async function deleteAllergy(allergyId, allergenName) {
  const confirmed = confirm('Are you sure you want to remove the allergy?');
  if (!confirmed) return;

  try {
    await apiFetch(`/allergies/${allergyId}`, {
      method: 'DELETE'
    });

    showToast('Allergy removed successfully', 'success');
    await loadAllergies();

  } catch (error) {
    console.error('Failed to delete allergy:', error);
    showToast(error.message || 'Failed to remove allergy', 'danger');
  }
}

// ============================================
// Family Code Management
// ============================================
async function loadFamilyCode() {
  const codeDisplay = document.getElementById('familyCodeDisplay');
  if (!codeDisplay) return;

  try {
    const data = await apiFetch('/families/my-code');
    codeDisplay.value = data.invite_code;
  } catch (error) {
    console.error('Failed to load family code:', error);
    codeDisplay.value = 'Error loading code';
  }
}

function copyFamilyCode() {
  const input = document.getElementById('familyCodeDisplay');
  if (!input) return;

  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    showToast('Family code copied!', 'success');
  }).catch(() => {
    showToast('Failed to copy code', 'danger');
  });
}

// ============================================
// Notifications
// ============================================
async function loadNotifications() {
  try {
    const data = await apiFetch('/notifications');
    const notifications = data.notifications || [];

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationList');

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    if (!list) return;
    if (notifications.length === 0) {
      list.innerHTML = '<li class="dropdown-item text-muted text-center py-3">No notifications</li>';
      return;
    }

    list.innerHTML = notifications.slice(0, 10).map(n => `
      <li>
        <a class="dropdown-item ${n.is_read ? 'text-muted' : 'fw-bold'}" href="#" data-notification-id="${n.id}">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <p class="mb-0">${escapeHtml(n.message)}</p>
              <small class="text-muted">${formatDate(n.created_at)}</small>
            </div>
            ${!n.is_read ? '<span class="badge bg-primary ms-2">New</span>' : ''}
          </div>
        </a>
      </li>
    `).join('');

    list.addEventListener('click', (e) => {
      const link = e.target.closest('[data-notification-id]');
      if (!link) return;
      e.preventDefault();
      markNotificationRead(link.dataset.notificationId);
    });

  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
}

async function markNotificationRead(notificationId) {
  try {
    await apiFetch(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    await loadNotifications();
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const markAllBtn = document.getElementById('markAllReadBtn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      try {
        await apiFetch('/notifications/read-all', {
          method: 'PUT'
        });
        await loadNotifications();
        showToast('All notifications marked as read', 'success');
      } catch (error) {
        console.error('Failed to mark all as read:', error);
        showToast('Failed to mark notifications as read', 'danger');
      }
    });
  }
});
