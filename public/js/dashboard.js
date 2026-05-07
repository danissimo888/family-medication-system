// Dashboard Page - Patient Medication Schedule

let patientId = null;

// Initialize Dashboard

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

    // Load all dashboard data
    await Promise.all([
      loadTodaySchedule(),
      loadAdherence(),
      loadNotifications(),
      loadFamilyCode()
    ]);

    // Bind buttons
    const copyBtn = document.getElementById('copyFamilyCodeBtn');
    if (copyBtn) copyBtn.addEventListener('click', () => copyFamilyCode());
    const card7d = document.getElementById('adherence7dCard');
    if (card7d) card7d.addEventListener('click', () => openDoseLog('7d'));
    const card30d = document.getElementById('adherence30dCard');
    if (card30d) card30d.addEventListener('click', () => openDoseLog('30d'));

  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showToast('Failed to load dashboard', 'danger');
  }
});

async function getPatientId() {
  // Check both sessionStorage and localStorage so it survives page refreshes
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

// Load today's schedule

async function loadTodaySchedule() {
  const container = document.getElementById('scheduleContainer');

  try {
    const today = new Date().toISOString().split('T')[0];
    const schedule = await apiFetch(`/patients/${patientId}/schedules?date=${today}`);

    if (!schedule || schedule.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-2">No medications scheduled for today</p>
        </div>
      `;
      return;
    }

    // Render schedule items
    container.innerHTML = schedule.map(item => renderScheduleItem(item)).join('');

    // Attach event listeners to buttons
    schedule.forEach(item => {
      if (item.status === 'pending') {
        const takeBtn = document.getElementById(`take-${item.id}`);
        const skipBtn = document.getElementById(`skip-${item.id}`);

        if (takeBtn) takeBtn.addEventListener('click', () => logDose(item.id, 'taken'));
        if (skipBtn) skipBtn.addEventListener('click', () => logDose(item.id, 'skipped'));
      }
    });

  } catch (error) {
    console.error('Failed to load schedule:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load schedule. Please try again.
      </div>
    `;
  }
}

// Render schedule item card

function renderScheduleItem(item) {
  const statusBadges = {
    pending: '<span class="badge bg-warning text-dark">Pending</span>',
    taken: '<span class="badge bg-success">Taken</span>',
    skipped: '<span class="badge bg-secondary">Skipped</span>',
    missed: '<span class="badge bg-danger">Missed</span>'
  };

  const showButtons = item.status === 'pending';

  const med = item.prescription_items?.medications;
  const medName = med?.generic_name || med?.brand_name || 'Unknown';
  const dosage = item.prescription_items?.dosage || '';
  const instructions = item.prescription_items?.instructions || '';

  return `
    <div class="card mb-3" id="schedule-${item.id}">
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-md-2">
            <div class="text-center">
              <i class="bi bi-clock text-primary" style="font-size: 2rem;"></i>
              <p class="mb-0 fw-bold">${formatTime(item.scheduled_time)}</p>
            </div>
          </div>
          <div class="col-md-6">
            <h5 class="mb-1">${escapeHtml(medName)}</h5>
            <p class="text-muted mb-1">
              <strong>Dosage:</strong> ${escapeHtml(dosage)}
            </p>
            ${instructions ? `<p class="text-muted mb-0"><small>${escapeHtml(instructions)}</small></p>` : ''}
          </div>
          <div class="col-md-2 text-center">
            ${statusBadges[item.status] || statusBadges.pending}
          </div>
          <div class="col-md-2 text-end">
            ${showButtons ? `
              <button class="btn btn-success btn-sm mb-1" id="take-${item.id}">
                <i class="bi bi-check-circle me-1"></i>Take
              </button>
              <button class="btn btn-secondary btn-sm" id="skip-${item.id}">
                <i class="bi bi-x-circle me-1"></i>Skip
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Log dose (take/skip)

async function logDose(scheduleId, status) {
  const takeBtn = document.getElementById(`take-${scheduleId}`);
  const skipBtn = document.getElementById(`skip-${scheduleId}`);
  const card = document.getElementById(`schedule-${scheduleId}`);

  try {
    // Disable buttons
    if (takeBtn) setButtonLoading(takeBtn, true);
    if (skipBtn) skipBtn.disabled = true;

    // Call API
    await apiFetch('/administration-records', {
      method: 'POST',
      body: JSON.stringify({
        schedule_id: scheduleId,
        status: status
      })
    });

    // Update UI
    const statusBadges = {
      taken: '<span class="badge bg-success">Taken</span>',
      skipped: '<span class="badge bg-secondary">Skipped</span>'
    };

    const statusCol = card.querySelector('.col-md-2.text-center');
    if (statusCol) {
      statusCol.innerHTML = statusBadges[status];
    }

    // Remove buttons
    const buttonCol = card.querySelector('.col-md-2.text-end');
    if (buttonCol) {
      buttonCol.innerHTML = '';
    }

    showToast(`Dose ${status} successfully`, 'success');

    // Reload adherence stats
    await loadAdherence();

  } catch (error) {
    console.error('Failed to log dose:', error);
    showToast(error.message || 'Failed to log dose', 'danger');

    // Re-enable buttons
    if (takeBtn) setButtonLoading(takeBtn, false);
    if (skipBtn) skipBtn.disabled = false;
  }
}

// Open dose history log modal
async function openDoseLog(period) {
  const days = period === '7d' ? 7 : 30;
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - (days - 1) * 86400000).toISOString().split('T')[0];

  document.getElementById('doseLogTitle').textContent = `Dose History — Last ${days} Days`;
  document.getElementById('doseLogContent').innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';
  new bootstrap.Modal(document.getElementById('doseLogModal')).show();

  try {
    const schedules = await apiFetch(`/patients/${patientId}/schedules/range?start_date=${start}&end_date=${end}`);

    if (!schedules || schedules.length === 0) {
      document.getElementById('doseLogContent').innerHTML = '<p class="text-muted text-center py-3">No doses in this period.</p>';
      return;
    }

    const statusBadge = {
      taken:   '<span class="badge bg-success">Taken</span>',
      skipped: '<span class="badge bg-secondary">Skipped</span>',
      missed:  '<span class="badge bg-danger">Missed</span>',
      pending: '<span class="badge bg-warning text-dark">Pending</span>'
    };

    const rows = schedules.map(s => {
      const med = s.prescription_items?.medications;
      const name = escapeHtml(med?.generic_name || med?.brand_name || 'Unknown');
      const dosage = escapeHtml(s.prescription_items?.dosage || '');
      const badge = statusBadge[s.status] || statusBadge.pending;
      return `<tr>
        <td>${s.scheduled_date}</td>
        <td>${formatTime(s.scheduled_time)}</td>
        <td>${name}</td>
        <td>${dosage}</td>
        <td>${badge}</td>
      </tr>`;
    }).join('');

    document.getElementById('doseLogContent').innerHTML = `
      <table class="table table-sm table-hover">
        <thead><tr><th>Date</th><th>Time</th><th>Medication</th><th>Dosage</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  } catch (error) {
    document.getElementById('doseLogContent').innerHTML = '<p class="text-danger text-center py-3">Failed to load dose history.</p>';
  }
}



async function loadAdherence() {
  try {
    const [adherence7d, adherence30d] = await Promise.all([
      apiFetch(`/patients/${patientId}/schedules/adherence?period=7d`),
      apiFetch(`/patients/${patientId}/schedules/adherence?period=30d`)
    ]);

    // Update 7-day adherence
    updateAdherenceDisplay('7d', adherence7d);

    // Update 30-day adherence
    updateAdherenceDisplay('30d', adherence30d);

  } catch (error) {
    console.error('Failed to load adherence:', error);
    document.getElementById('adherence7dText').textContent = 'Failed to load';
    document.getElementById('adherence30dText').textContent = 'Failed to load';
  }
}

// Update adherence display with progress ring

function updateAdherenceDisplay(period, data) {
  const percentage = Math.round(data.adherence_percentage || 0);
  const progressBar = document.getElementById(`adherence${period}`);
  const text = document.getElementById(`adherence${period}Text`);

  // Update progress bar
  progressBar.style.width = `${percentage}%`;
  progressBar.setAttribute('aria-valuenow', percentage);
  progressBar.textContent = data.taken_doses || 0;

  // Color based on percentage
  progressBar.className = 'progress-bar';
  if (percentage >= 80) {
    progressBar.classList.add('bg-success');
  } else if (percentage >= 60) {
    progressBar.classList.add('bg-warning');
  } else {
    progressBar.classList.add('bg-danger');
  }

  // Update text with animation
  text.textContent = `${data.taken_doses || 0} of ${data.total_doses || 0} doses taken`;
}

// Load notifications

async function loadNotifications() {
  try {
    const data = await apiFetch('/notifications');
    const notifications = data.notifications || [];

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationList');

    // Update badge
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Update list
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

// Mark notification as read

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

// Mark all notifications as read

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

