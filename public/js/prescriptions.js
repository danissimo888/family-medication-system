// Prescriptions Page - View and Add Patient Prescriptions

let patientId = null;
let allPrescriptions = [];
let currentFilter = 'active';
let selectedMedication = null;
let medicationCache = [];

// Initialize page

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

    await loadPrescriptions();
    setupFilters();
    setupAddPrescriptionModal();
    await loadFamilyCode();
    await loadNotifications();

    // Bind buttons
    const copyBtn = document.getElementById('copyFamilyCodeBtn');
    if (copyBtn) copyBtn.addEventListener('click', () => copyFamilyCode());

    // Event delegation for dynamic content
    document.addEventListener('click', (e) => {
      const cancelBtn = e.target.closest('[data-action="cancel-prescription"]');
      if (cancelBtn) {
        e.preventDefault();
        cancelPrescription(cancelBtn.dataset.prescriptionId);
        return;
      }
      const selectBtn = e.target.closest('[data-action="select-med"]');
      if (selectBtn) {
        e.preventDefault();
        const med = medicationCache.find(m => m.id === selectBtn.dataset.medId);
        if (med) selectMedication(med);
        return;
      }
    });

  } catch (error) {
    console.error('Prescriptions page initialization error:', error);
    showToast('Failed to load prescriptions', 'danger');
  }
});

async function getPatientId() {
  const cached = sessionStorage.getItem('patient_id') || localStorage.getItem('patient_id');
  if (cached) return cached;

  try {
    const patient = await apiFetch('/patients/me');
    sessionStorage.setItem('patient_id', patient.id);
    localStorage.setItem('patient_id', patient.id);
    return patient.id;
  } catch (error) {
    console.error('Failed to get patient ID:', error);
    return null;
  }
}

// Load prescriptions from API

async function loadPrescriptions() {
  const container = document.getElementById('prescriptionsContainer');

  try {
    const prescriptions = await apiFetch(`/prescriptions/patient/${patientId}`);
    allPrescriptions = prescriptions;

    renderPrescriptions();

  } catch (error) {
    console.error('Failed to load prescriptions:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load prescriptions. Please try again.
      </div>
    `;
  }
}

// Render prescriptions list

function renderPrescriptions() {
  const container = document.getElementById('prescriptionsContainer');

  // Filter prescriptions
  let filtered = allPrescriptions;
  if (currentFilter === 'active') {
    filtered = allPrescriptions.filter(p => p.status === 'active');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-capsule text-muted" style="font-size: 3rem;"></i>
        <p class="text-muted mt-3">No ${currentFilter === 'active' ? 'active' : ''} prescriptions found</p>
      </div>
    `;
    return;
  }

  // Render as accordion
  container.innerHTML = `
    <div class="accordion" id="prescriptionsAccordion">
      ${filtered.map((prescription, index) => renderPrescriptionCard(prescription, index)).join('')}
    </div>
  `;
}

// Render single prescription card

const frequencyLabels = {
  once_daily: 'Once a day',
  twice_daily: 'Twice a day',
  three_times_daily: 'Three times a day',
  four_times_daily: 'Four times a day',
  as_needed: 'As needed'
};

function renderPrescriptionCard(prescription, index) {
  const statusBadges = {
    active: '<span class="badge bg-success">Active</span>',
    completed: '<span class="badge bg-secondary">Completed</span>',
    cancelled: '<span class="badge bg-danger">Cancelled</span>'
  };

  const collapseId = `collapse${index}`;

  return `
    <div class="accordion-item">
      <h2 class="accordion-header" id="heading${index}">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
          <div class="d-flex justify-content-between align-items-center w-100 me-3">
            <div>
              <strong>Prescription #${prescription.id.substring(0, 8)}</strong>
              <span class="text-muted ms-2">• Prescribed by ${escapeHtml(prescription.prescribed_by)}</span>
            </div>
            <div>
              ${statusBadges[prescription.status] || statusBadges.active}
            </div>
          </div>
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#prescriptionsAccordion">
        <div class="accordion-body">
          <!-- Prescription Details -->
          <div class="row mb-3">
            <div class="col-md-4">
              <p class="mb-1"><strong>Prescribed Date:</strong></p>
              <p class="text-muted">${formatDate(prescription.prescribed_date)}</p>
            </div>
            <div class="col-md-4">
              <p class="mb-1"><strong>Start Date:</strong></p>
              <p class="text-muted">${formatDate(prescription.start_date)}</p>
            </div>
            <div class="col-md-4">
              <p class="mb-1"><strong>End Date:</strong></p>
              <p class="text-muted">${prescription.end_date ? formatDate(prescription.end_date) : 'Ongoing'}</p>
            </div>
          </div>

          ${prescription.notes ? `
            <div class="alert alert-info">
              <strong>Notes:</strong> ${escapeHtml(prescription.notes)}
            </div>
          ` : ''}

          <!-- Prescription Items -->
          <h6 class="mb-3">Medications:</h6>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${(prescription.prescription_items || prescription.items || []).length ? (prescription.prescription_items || prescription.items).map(item => {
                  let duration = '-';
                  if (item.duration_days) {
                    duration = item.duration_days + ' days';
                  } else if (prescription.start_date && prescription.end_date) {
                    const days = Math.round((new Date(prescription.end_date) - new Date(prescription.start_date)) / 86400000);
                    if (days > 0) duration = days + ' days';
                  }
                  return `
                  <tr>
                    <td>${escapeHtml(item.medications?.brand_name || item.medications?.generic_name || 'N/A')}</td>
                    <td>${escapeHtml(item.dosage)}</td>
                    <td>${escapeHtml(frequencyLabels[item.frequency] || item.frequency)}</td>
                    <td>${duration}</td>
                    <td>${item.instructions ? escapeHtml(item.instructions) : '-'}</td>
                  </tr>
                `}).join('') : '<tr><td colspan="5" class="text-center text-muted">No items</td></tr>'}
              </tbody>
            </table>
          </div>
          ${prescription.status === 'active' ? `
            <div class="mt-3 text-end">
              <button class="btn btn-sm btn-outline-danger" data-action="cancel-prescription" data-prescription-id="${prescription.id}">
                <i class="bi bi-x-circle me-1"></i>Cancel Prescription
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Wire up the "Add Medication" modal - search, select, submit
function setupAddPrescriptionModal() {
  const modal = document.getElementById('addPrescriptionModal');
  if (!modal) return;

  // Set today as default start date
  document.getElementById('startDate').value = new Date().toISOString().split('T')[0];

  // Prefetch medication list on modal open
  document.getElementById('addPrescriptionModal').addEventListener('show.bs.modal', async () => {
    if (medicationCache.length === 0) {
      try { medicationCache = await apiFetch('/medications'); } catch (e) { /* ignore */ }
    }
  });

  // Medication search — client-side filter
  document.getElementById('medSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const results = document.getElementById('medSearchResults');
    if (q.length < 2) { results.innerHTML = ''; return; }
    const matches = medicationCache.filter(m =>
      m.brand_name.toLowerCase().includes(q) || m.generic_name.toLowerCase().includes(q)
    ).slice(0, 20);
    if (!matches.length) {
      results.innerHTML = '<div class="list-group-item text-muted">No medications found</div>';
      return;
    }
    results.innerHTML = matches.map(m => `
      <button type="button" class="list-group-item list-group-item-action" data-action="select-med" data-med-id="${m.id}">
        <strong>${escapeHtml(m.brand_name)}</strong>
        <span class="text-muted ms-2">${escapeHtml(m.generic_name)}</span>
        ${m.strength ? `<small class="text-muted ms-1">· ${escapeHtml(m.strength)}</small>` : ''}
      </button>
    `).join('');
  });

  // Render time inputs when frequency changes
  document.getElementById('frequency').addEventListener('change', renderTimeInputs);
  renderTimeInputs(); // init on load

  // Submit button
  document.getElementById('submitPrescriptionBtn').addEventListener('click', submitPrescription);

  // Clear form when modal closes
  modal.addEventListener('hidden.bs.modal', resetPrescriptionForm);
}

function renderTimeInputs() {
  const freq = document.getElementById('frequency').value;
  const container = document.getElementById('scheduleTimesContainer');
  const defaults = {
    once_daily: ['08:00'],
    twice_daily: ['08:00', '20:00'],
    three_times_daily: ['08:00', '14:00', '20:00'],
    four_times_daily: ['08:00', '12:00', '16:00', '20:00']
  };
  const times = defaults[freq];
  if (!times) { container.innerHTML = ''; return; }
  const labels = ['1st dose', '2nd dose', '3rd dose', '4th dose'];
  container.innerHTML = `
    <label class="form-label">Schedule Times</label>
    <div class="d-flex flex-wrap gap-3">
      ${times.map((t, i) => `
        <div>
          <small class="text-muted d-block mb-1">${labels[i]}</small>
          <input type="time" class="form-control schedule-time-input" value="${t}">
        </div>
      `).join('')}
    </div>
  `;
}


function selectMedication(med) {
  selectedMedication = med;
  document.getElementById('selectedMedId').value = med.id;
  document.getElementById('selectedMedDisplay').textContent = `Selected: ${med.brand_name} (${med.generic_name})`;
  document.getElementById('medSearch').value = '';
  document.getElementById('medSearchResults').innerHTML = '';
}

async function submitPrescription() {
  if (!selectedMedication) {
    showToast('Please select a medication first', 'warning');
    return;
  }

  const dosage = document.getElementById('dosage').value.trim();
  const startDate = document.getElementById('startDate').value;
  if (!dosage || !startDate) {
    showToast('Dosage and start date are required', 'warning');
    return;
  }

  const durationDays = document.getElementById('durationDays').value;
  const overrideWarnings = document.getElementById('overrideWarnings').checked;

  const btn = document.getElementById('submitPrescriptionBtn');
  const spinner = document.getElementById('submitBtnSpinner');
  btn.disabled = true;
  spinner.classList.remove('d-none');

  try {
    const payload = {
      prescribed_by: document.getElementById('prescribedBy').value.trim() || 'Self',
      start_date: startDate,
      end_date: durationDays ? addDays(startDate, parseInt(durationDays)) : null,
      notes: document.getElementById('prescriptionNotes').value.trim() || null,
      override_warnings: overrideWarnings,
      items: [{
        medication_id: selectedMedication.id,
        dosage,
        frequency: document.getElementById('frequency').value,
        duration_days: durationDays ? parseInt(durationDays) : null,
        instructions: document.getElementById('instructions').value.trim() || null,
        schedule_times: [...document.querySelectorAll('.schedule-time-input')].map(i => i.value + ':00')
      }]
    };

    const result = await apiFetch('/prescriptions', { method: 'POST', body: JSON.stringify(payload) });

    if (result.warnings) {
      // Show safety warnings and let user decide
      const warningsDiv = document.getElementById('safetyWarnings');
      const warningsList = document.getElementById('warningsList');
      warningsList.innerHTML = result.warnings.map(w =>
        `<div>• ${escapeHtml(w.message || w.type)}</div>`
      ).join('');
      warningsDiv.classList.remove('d-none');
      btn.disabled = false;
      spinner.classList.add('d-none');
      return;
    }

    showToast('Medication added successfully!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('addPrescriptionModal')).hide();
    await loadPrescriptions();
  } catch (err) {
    if (err.status === 409 && err.data) {
      // Safety check returned warnings
      const warningsDiv = document.getElementById('safetyWarnings');
      const warningsList = document.getElementById('warningsList');
      warningsList.innerHTML = (err.data.warnings || []).map(w =>
        `<div>• ${escapeHtml(w.message || w.type || JSON.stringify(w))}</div>`
      ).join('');
      warningsDiv.classList.remove('d-none');
    } else {
      showToast('Failed to add medication. Please try again.', 'danger');
    }
    btn.disabled = false;
    spinner.classList.add('d-none');
  }
}

async function cancelPrescription(id) {
  if (!confirm('Cancel this prescription?')) return;
  try {
    await apiFetch(`/prescriptions/${id}/cancel`, { method: 'PUT' });
    showToast('Prescription cancelled', 'success');
    await loadPrescriptions();
  } catch (err) {
    showToast('Failed to cancel prescription', 'danger');
  }
}

function resetPrescriptionForm() {
  selectedMedication = null;
  document.getElementById('addPrescriptionForm').reset();
  document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('selectedMedDisplay').textContent = '';
  document.getElementById('medSearchResults').innerHTML = '';
  document.getElementById('safetyWarnings').classList.add('d-none');
  document.getElementById('scheduleTimesContainer').innerHTML = '';
  renderTimeInputs();
  document.getElementById('submitPrescriptionBtn').disabled = false;
  document.getElementById('submitBtnSpinner').classList.add('d-none');
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Setup filter buttons

function setupFilters() {
  const filterAll = document.getElementById('filterAll');
  const filterActive = document.getElementById('filterActive');

  filterAll.addEventListener('click', () => {
    currentFilter = 'all';
    filterAll.classList.add('active');
    filterActive.classList.remove('active');
    renderPrescriptions();
  });

  filterActive.addEventListener('click', () => {
    currentFilter = 'active';
    filterActive.classList.add('active');
    filterAll.classList.remove('active');
    renderPrescriptions();
  });
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
