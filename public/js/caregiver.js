// Caregiver Portal - Family Patient Management

// ============================================
// Global State
// ============================================
let familyPatients = [];
let selectedPatient = null;
let selectedPatientSchedule = [];
let selectedPatientPrescriptions = [];
let selectedPatientAllergies = [];
let selectedPatientNotes = [];
let currentUserId = null;

// Modals
let addPrescriptionModal = null;
let addNoteModal = null;

// Medication search state
let medicationSearchTimeout = null;
let prescriptionItems = [];

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Require caregiver role
    const userData = await requireRole(['caregiver']);
    currentUserId = userData.user_id || userData.id;

    // Update user name in navbar
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = `${userData.first_name} ${userData.last_name}`;
    }

    // Initialize modals
    addPrescriptionModal = new bootstrap.Modal(document.getElementById('addPrescriptionModal'));
    addNoteModal = new bootstrap.Modal(document.getElementById('addNoteModal'));

    // Load caregiver families + patients
    await loadCaregiverFamilies();

    // Setup event listeners
    setupEventListeners();

  } catch (error) {
    console.error('Caregiver portal initialization error:', error);
    showToast('Failed to load caregiver portal', 'danger');
  }
});

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
  // Sidebar navigation
  document.getElementById('navPatients').addEventListener('click', (e) => {
    e.preventDefault();
    showPatientsListView();
  });

  // Back to patients button
  document.getElementById('backToPatients').addEventListener('click', () => {
    showPatientsListView();
  });

  // Back to families button
  const backToFamiliesBtn = document.getElementById('backToFamilies');
  if (backToFamiliesBtn) {
    backToFamiliesBtn.addEventListener('click', () => {
      showFamilyCardsView();
    });
  }

  // Refresh patient data button
  const refreshBtn = document.getElementById('refreshPatientData');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      if (selectedPatient) {
        loadPatientDetails(selectedPatient.id);
      }
    });
  }

  // Add medication item button
  document.getElementById('addMedicationItemBtn').addEventListener('click', () => {
    addMedicationItem();
  });

  // Submit prescription button
  document.getElementById('submitPrescriptionBtn').addEventListener('click', () => {
    submitPrescription();
  });

  // Submit note button
  document.getElementById('submitNoteBtn').addEventListener('click', () => {
    submitNote();
  });

  // Adherence cards
  const card7d = document.getElementById('adherence7dCard');
  if (card7d) card7d.addEventListener('click', () => openDoseLog('7d'));
  const card30d = document.getElementById('adherence30dCard');
  if (card30d) card30d.addEventListener('click', () => openDoseLog('30d'));

  // Join family button
  const joinBtn = document.getElementById('joinFamilyBtn');
  if (joinBtn) joinBtn.addEventListener('click', () => joinNewFamily());

  // Global event delegation for dynamic content
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const familyId = btn.dataset.familyId;
    const prescriptionId = btn.dataset.prescriptionId;
    const itemIndex = btn.dataset.itemIndex;

    if (action === 'view-family') { e.preventDefault(); switchFamily(familyId); }
    else if (action === 'cancel-prescription') { e.preventDefault(); cancelPrescription(prescriptionId); }
    else if (action === 'remove-med-item') { e.preventDefault(); removeMedicationItem(parseInt(itemIndex, 10)); }
    else if (action === 'confirm-leave') { e.preventDefault(); confirmLeaveFamily(familyId); }
    else if (action === 'leave-family') { e.preventDefault(); leaveFamily(familyId); }
    else if (action === 'cancel-leave') { e.preventDefault(); cancelLeaveFamily(familyId); }
  });

  // Reset prescription form when modal closes
  document.getElementById('addPrescriptionModal').addEventListener('hidden.bs.modal', () => {
    resetPrescriptionForm();
  });

  // Reset note form when modal closes
  document.getElementById('addNoteModal').addEventListener('hidden.bs.modal', () => {
    resetNoteForm();
  });

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('noteDate').value = today;

  // Setup allergy modal
  setupAllergyModal();
}

// ============================================
// View Management
// ============================================
function showPatientsListView() {
  document.getElementById('patientsListSection').style.display = 'block';
  document.getElementById('patientDetailSection').style.display = 'none';
  selectedPatient = null;

  // Restore correct inner view
  if (caregiverFamilies.length > 1) {
    // Multi-family: show cards grid
    document.getElementById('familyCardsContainer').style.display = '';
    document.getElementById('patientsContainer').style.display = 'none';
    activeFamilyId = null;
  } else if (activeFamilyId) {
    // Single family: show patients list
    document.getElementById('familyCardsContainer').style.display = 'none';
    document.getElementById('patientsContainer').style.display = '';
  }

  document.getElementById('navPatients').classList.add('active');
}

function showPatientDetailView() {
  document.getElementById('patientsListSection').style.display = 'none';
  document.getElementById('patientDetailSection').style.display = 'block';

  // Update sidebar active state
  document.getElementById('navPatients').classList.remove('active');
}

// ============================================
// Multi-Family State
// ============================================
let caregiverFamilies = [];
let activeFamilyId = null;

async function loadCaregiverFamilies() {
  try {
    caregiverFamilies = await apiFetch('/families/my-families');
  } catch (err) {
    console.error('Failed to load caregiver families:', err);
    caregiverFamilies = [];
  }

  const cardsContainer = document.getElementById('familyCardsContainer');
  const cardsGrid = document.getElementById('familyCards');
  const emptyState = document.getElementById('noFamiliesEmptyState');
  const patientsContainer = document.getElementById('patientsContainer');

  if (!caregiverFamilies || caregiverFamilies.length === 0) {
    if (cardsContainer) cardsContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = '';
    if (patientsContainer) patientsContainer.style.display = 'none';
    activeFamilyId = null;
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // If we already have an active family selected, show patients view
  if (activeFamilyId) {
    cardsContainer.style.display = 'none';
    patientsContainer.style.display = '';
    const activeFamily = caregiverFamilies.find(f => f.id === activeFamilyId);
    if (activeFamily) {
      document.getElementById('activeFamilyName').textContent = activeFamily.name;
    }
    await loadFamilyPatients(activeFamilyId);
    return;
  }

  // Single family → skip cards, go straight to patients
  if (caregiverFamilies.length === 1) {
    activeFamilyId = caregiverFamilies[0].id;
    cardsContainer.style.display = 'none';
    patientsContainer.style.display = '';
    document.getElementById('activeFamilyName').textContent = caregiverFamilies[0].name;
    document.getElementById('backToFamilies').style.display = 'none';
    await loadFamilyPatients(activeFamilyId);
    return;
  }

  // Multiple families → show cards grid
  patientsContainer.style.display = 'none';
  cardsContainer.style.display = '';
  renderFamilyCards();
}

function renderFamilyCards() {
  const cardsGrid = document.getElementById('familyCards');
  cardsGrid.innerHTML = caregiverFamilies.map(f => `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 family-select-card" data-action="view-family" data-family-id="${f.id}" style="cursor:pointer; transition: transform 0.15s, box-shadow 0.15s;">
        <div class="card-body d-flex flex-column">
          <div class="d-flex align-items-center mb-3">
            <div class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style="width:48px;height:48px;">
              <i class="bi bi-people-fill text-primary fs-4"></i>
            </div>
            <div class="ms-3">
              <h5 class="card-title mb-0">${escapeHtml(f.name)}</h5>
              <small class="text-muted">Joined ${formatDate(f.joined_at)}</small>
            </div>
          </div>
          <div class="mt-auto">
            <button class="btn btn-primary btn-sm w-100" data-action="view-family" data-family-id="${f.id}">
              <i class="bi bi-eye me-1"></i>View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function showFamilyCardsView() {
  document.getElementById('patientsListSection').style.display = 'block';
  document.getElementById('patientDetailSection').style.display = 'none';
  document.getElementById('familyCardsContainer').style.display = '';
  document.getElementById('patientsContainer').style.display = 'none';
  activeFamilyId = null;
  selectedPatient = null;
  renderFamilyCards();
}

async function switchFamily(familyId) {
  activeFamilyId = familyId;
  const family = caregiverFamilies.find(f => f.id === familyId);

  // Hide cards, show patients view
  document.getElementById('familyCardsContainer').style.display = 'none';
  const patientsContainer = document.getElementById('patientsContainer');
  patientsContainer.style.display = '';
  document.getElementById('activeFamilyName').textContent = family ? family.name : 'Family';
  document.getElementById('backToFamilies').style.display = caregiverFamilies.length > 1 ? '' : 'none';

  // Show loading state
  document.getElementById('patientsContent').innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Loading patients...</p>
    </div>`;

  await loadFamilyPatients(familyId);
}

// ============================================
// Load Family Patients
// ============================================
async function loadFamilyPatients(familyId) {
  const container = document.getElementById('patientsContent');
  const fid = familyId || activeFamilyId;

  if (!fid) {
    container.innerHTML = '';
    return;
  }

  try {
    const patients = await apiFetch(`/patients/family?family_id=${fid}`);
    familyPatients = patients;

    if (!patients || patients.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-people text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-3">No patients found in your family</p>
        </div>
      `;
      return;
    }

    // Render patient cards
    container.innerHTML = `
      <div class="row">
        ${patients.map(patient => renderPatientCard(patient)).join('')}
      </div>
    `;

    // Attach click handlers
    patients.forEach(patient => {
      const card = document.getElementById(`patient-card-${patient.id}`);
      if (card) {
        card.addEventListener('click', () => {
          selectPatient(patient);
        });
      }
    });

    // Single patient → auto-select, go straight to details
    if (patients.length === 1) {
      selectPatient(patients[0]);
    }

  } catch (error) {
    console.error('Failed to load family patients:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load patients. Please try again.
      </div>
    `;
  }
}

// ============================================
// Render Patient Card
// ============================================
function renderPatientCard(patient) {
  const firstName = patient.users?.first_name || '';
  const lastName = patient.users?.last_name || '';
  return `
    <div class="col-md-6 col-lg-4 mb-3">
      <div class="card h-100 patient-card border-start border-4 border-primary" id="patient-card-${patient.id}" style="cursor: pointer;">
        <div class="card-body">
          <h5 class="card-title">
            <i class="bi bi-person-circle text-primary me-2"></i>
            ${escapeHtml(firstName)} ${escapeHtml(lastName)}
          </h5>
          ${patient.chronic_conditions && patient.chronic_conditions.length > 0 ? `
            <div class="mb-2">
              <small><strong>Conditions:</strong></small>
              <div class="mt-1">
                ${patient.chronic_conditions.map(condition =>
                  `<span class="badge bg-info text-dark me-1">${escapeHtml(condition)}</span>`
                ).join('')}
              </div>
            </div>
          ` : ''}
          <div class="mt-3">
            <button class="btn btn-sm btn-outline-primary w-100">
              <i class="bi bi-clipboard2-pulse me-1"></i>
              View Schedule & Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// Select Patient
// ============================================
async function selectPatient(patient) {
  selectedPatient = patient;
  showPatientDetailView();

  // Update patient name in header
  const firstName = patient.users?.first_name || '';
  const lastName = patient.users?.last_name || '';
  document.getElementById('patientDetailName').textContent =
    `${firstName} ${lastName}`;

  // Load patient details
  await loadPatientDetails(patient.id);
}

// ============================================
// Load Patient Details
// ============================================
async function loadPatientDetails(patientId) {
  try {
    // Load all patient data in parallel
    await Promise.all([
      loadPatientSchedule(patientId),
      loadPatientPrescriptions(patientId),
      loadPatientAllergies(patientId),
      loadPatientNotes(patientId),
      loadPatientAdherence(patientId)
    ]);

  } catch (error) {
    console.error('Failed to load patient details:', error);
    showToast('Failed to load patient details', 'danger');
  }
}

// ============================================
// Load Patient Schedule
// ============================================
async function loadPatientSchedule(patientId) {
  const container = document.getElementById('patientScheduleContainer');

  try {
    const today = new Date().toISOString().split('T')[0];
    const schedule = await apiFetch(`/patients/${patientId}/schedules?date=${today}`);
    selectedPatientSchedule = schedule;

    if (!schedule || schedule.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-calendar-x text-muted" style="font-size: 2rem;"></i>
          <p class="text-muted mt-2">No medications scheduled for today</p>
        </div>
      `;
      return;
    }

    container.innerHTML = schedule.map(item => renderScheduleItem(item)).join('');

    schedule.forEach(item => {
      if (item.status === 'pending') {
        const takeBtn = document.getElementById(`take-${item.id}`);
        const skipBtn = document.getElementById(`skip-${item.id}`);

        if (takeBtn) takeBtn.addEventListener('click', () => logDose(item.id, 'taken'));
        if (skipBtn) skipBtn.addEventListener('click', () => logDose(item.id, 'skipped'));
      }
    });

  } catch (error) {
    console.error('Failed to load patient schedule:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load schedule
      </div>
    `;
  }
}

// ============================================
// Render Schedule Item
// ============================================
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

// ============================================
// Log Dose
// ============================================
async function logDose(scheduleId, status) {
  const takeBtn = document.getElementById(`take-${scheduleId}`);
  const skipBtn = document.getElementById(`skip-${scheduleId}`);
  const card = document.getElementById(`schedule-${scheduleId}`);

  try {
    if (takeBtn) setButtonLoading(takeBtn, true);
    if (skipBtn) skipBtn.disabled = true;

    await apiFetch('/administration-records', {
      method: 'POST',
      body: JSON.stringify({
        schedule_id: scheduleId,
        status: status
      })
    });

    const statusBadges = {
      taken: '<span class="badge bg-success">Taken</span>',
      skipped: '<span class="badge bg-secondary">Skipped</span>'
    };

    const statusCol = card.querySelector('.col-md-2.text-center');
    if (statusCol) {
      statusCol.innerHTML = statusBadges[status];
    }

    const buttonCol = card.querySelector('.col-md-2.text-end');
    if (buttonCol) {
      buttonCol.innerHTML = '';
    }

    showToast(`Dose ${status} successfully`, 'success');
    await loadPatientAdherence(selectedPatient.id);

  } catch (error) {
    console.error('Failed to log dose:', error);
    showToast(error.message || 'Failed to log dose', 'danger');

    if (takeBtn) setButtonLoading(takeBtn, false);
    if (skipBtn) skipBtn.disabled = false;
  }
}

// ============================================
// Load Patient Prescriptions
// ============================================
async function loadPatientPrescriptions(patientId) {
  const container = document.getElementById('patientPrescriptionsContainer');

  try {
    const prescriptions = await apiFetch(`/prescriptions/patient/${patientId}`);
    selectedPatientPrescriptions = prescriptions.filter(p => p.status === 'active');

    if (selectedPatientPrescriptions.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-capsule text-muted" style="font-size: 2rem;"></i>
          <p class="text-muted mt-2">No active prescriptions</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="accordion" id="prescriptionsAccordion">
        ${selectedPatientPrescriptions.map((prescription, index) => renderPrescriptionCard(prescription, index)).join('')}
      </div>
    `;

  } catch (error) {
    console.error('Failed to load patient prescriptions:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load prescriptions
      </div>
    `;
  }
}

// ============================================
// Render Prescription Card
// ============================================
function renderPrescriptionCard(prescription, index) {
  const collapseId = `prescription-collapse-${index}`;

  return `
    <div class="accordion-item">
      <h2 class="accordion-header" id="heading-${index}">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
          <div class="d-flex justify-content-between align-items-center w-100 me-3">
            <div>
              <strong>Prescription #${prescription.id.substring(0, 8)}</strong>
              <span class="text-muted ms-2">• Prescribed by ${escapeHtml(prescription.prescribed_by)}</span>
            </div>
          </div>
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#prescriptionsAccordion">
        <div class="accordion-body">
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
                ${prescription.prescription_items ? prescription.prescription_items.map(item => {
                  let duration = '-';
                  if (item.duration_days) {
                    duration = item.duration_days + ' days';
                  } else if (prescription.start_date && prescription.end_date) {
                    const days = Math.round((new Date(prescription.end_date) - new Date(prescription.start_date)) / 86400000);
                    if (days > 0) duration = days + ' days';
                  }
                  return `
                  <tr>
                    <td>${escapeHtml(item.medications?.generic_name || item.medications?.brand_name || 'N/A')}</td>
                    <td>${escapeHtml(item.dosage)}</td>
                    <td>${formatFrequency(item.frequency)}</td>
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

async function cancelPrescription(id) {
  if (!confirm('Cancel this prescription?')) return;
  try {
    await apiFetch(`/prescriptions/${id}/cancel`, { method: 'PUT' });
    showToast('Prescription cancelled', 'success');
    if (selectedPatient) await loadPatientDetails(selectedPatient.id);
  } catch (err) {
    showToast('Failed to cancel prescription', 'danger');
  }
}

// ============================================
// Load Patient Allergies
// ============================================
async function loadPatientAllergies(patientId) {
  const container = document.getElementById('patientAllergiesContainer');

  try {
    const allergies = await apiFetch(`/patients/${patientId}/allergies`);
    selectedPatientAllergies = allergies;

    if (!allergies || allergies.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-shield-check text-muted" style="font-size: 2rem;"></i>
          <p class="text-muted mt-2">No known allergies</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="row">
        ${allergies.map(allergy => renderAllergyCard(allergy)).join('')}
      </div>
    `;

    allergies.forEach(allergy => {
      const deleteBtn = document.getElementById(`delete-allergy-${allergy.id}`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteAllergy(allergy.id));
      }
    });

  } catch (error) {
    console.error('Failed to load patient allergies:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load allergies
      </div>
    `;
  }
}

// ============================================
// Render Allergy Card
// ============================================
function renderAllergyCard(allergy) {
  const severityBadges = {
    mild: '<span class="badge bg-warning text-dark">Mild</span>',
    moderate: '<span class="badge bg-orange text-white" style="background-color: #fd7e14;">Moderate</span>',
    severe: '<span class="badge bg-danger">Severe</span>'
  };

  return `
    <div class="col-md-6 mb-3">
      <div class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="card-title mb-0">
              <i class="bi bi-exclamation-triangle-fill text-danger me-2"></i>
              ${escapeHtml(allergy.allergen_name)}
            </h6>
            ${severityBadges[allergy.severity] || severityBadges.mild}
          </div>
          <p class="card-text mb-1">
            <strong>Reaction:</strong> ${escapeHtml(allergy.reaction)}
          </p>
          ${allergy.notes ? `
            <p class="card-text text-muted mb-0">
              <small><strong>Notes:</strong> ${escapeHtml(allergy.notes)}</small>
            </p>
          ` : ''}
        </div>
        <div class="card-footer bg-transparent">
          <button class="btn btn-sm btn-outline-danger w-100" id="delete-allergy-${allergy.id}">
            <i class="bi bi-trash me-1"></i>Remove
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// Allergy CRUD
// ============================================
let allergyMedCache = [];
let addAllergyModal = null;

async function deleteAllergy(allergyId) {
  if (!confirm('Remove this allergy?')) return;
  try {
    await apiFetch(`/allergies/${allergyId}`, { method: 'DELETE' });
    showToast('Allergy removed', 'success');
    if (selectedPatient) await loadPatientAllergies(selectedPatient.id);
  } catch (err) {
    showToast('Failed to remove allergy', 'danger');
  }
}

function setupAllergyModal() {
  const modalEl = document.getElementById('addAllergyModal');
  if (!modalEl) return;
  addAllergyModal = new bootstrap.Modal(modalEl);

  const searchInput = document.getElementById('allergyMedSearch');
  const resultsDiv = document.getElementById('allergyMedResults');
  const hiddenInput = document.getElementById('allergyMedId');

  modalEl.addEventListener('show.bs.modal', async () => {
    if (allergyMedCache.length === 0) {
      try { allergyMedCache = await apiFetch('/medications'); } catch (e) { /* ignore */ }
    }
  });

  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length < 2) { resultsDiv.style.display = 'none'; return; }

    const matches = allergyMedCache.filter(m =>
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
        searchInput.value = btn.dataset.medName;
        hiddenInput.value = btn.dataset.medId;
        resultsDiv.style.display = 'none';
      });
    });
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.style.display = 'none';
    }
  });

  const form = document.getElementById('addAllergyForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

    const medicationId = hiddenInput.value;
    if (!medicationId) { showToast('Please select a medication', 'warning'); return; }
    if (!selectedPatient) { showToast('No patient selected', 'danger'); return; }

    const submitBtn = document.getElementById('submitAllergyBtn');
    try {
      setButtonLoading(submitBtn, true);
      await apiFetch(`/patients/${selectedPatient.id}/allergies`, {
        method: 'POST',
        body: JSON.stringify({
          medication_id: medicationId,
          allergen_name: searchInput.value.trim(),
          severity: document.getElementById('allergySeverity').value,
          reaction: document.getElementById('allergyReaction').value.trim(),
          notes: document.getElementById('allergyNotes').value.trim() || null
        })
      });
      showToast('Allergy added', 'success');
      addAllergyModal.hide();
      await loadPatientAllergies(selectedPatient.id);
    } catch (err) {
      showToast(err.message || 'Failed to add allergy', 'danger');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  modalEl.addEventListener('hidden.bs.modal', () => {
    form.reset();
    form.classList.remove('was-validated');
    hiddenInput.value = '';
    resultsDiv.style.display = 'none';
  });
}

// ============================================
// Load Patient Adherence
// ============================================
async function loadPatientAdherence(patientId) {
  try {
    const [adherence7d, adherence30d] = await Promise.all([
      apiFetch(`/patients/${patientId}/schedules/adherence?period=7d`),
      apiFetch(`/patients/${patientId}/schedules/adherence?period=30d`)
    ]);

    updateAdherenceDisplay('7d', adherence7d);
    updateAdherenceDisplay('30d', adherence30d);

  } catch (error) {
    console.error('Failed to load patient adherence:', error);
    document.getElementById('patientAdherence7dText').textContent = 'Failed to load';
    document.getElementById('patientAdherence30dText').textContent = 'Failed to load';
  }
}

// ============================================
// Update Adherence Display
// ============================================
function updateAdherenceDisplay(period, data) {
  const percentage = Math.round(data.adherence_percentage || 0);
  const progressBar = document.getElementById(`patientAdherence${period}`);
  const text = document.getElementById(`patientAdherence${period}Text`);

  progressBar.style.width = `${percentage}%`;
  progressBar.setAttribute('aria-valuenow', percentage);
  progressBar.textContent = `${percentage}%`;

  progressBar.className = 'progress-bar';
  if (percentage >= 80) {
    progressBar.classList.add('bg-success');
  } else if (percentage >= 60) {
    progressBar.classList.add('bg-warning');
  } else {
    progressBar.classList.add('bg-danger');
  }

  text.textContent = `${data.taken_doses || 0} of ${data.total_doses || 0} doses taken`;

  // Animate percentage count
  if (window.MedFamily && window.MedFamily.animateCountUp) {
    window.MedFamily.animateCountUp(progressBar, 0, percentage, 800);
  }
}

// ============================================
// Load Patient Notes
// ============================================
async function loadPatientNotes(patientId) {
  const container = document.getElementById('patientNotesContainer');

  try {
    const response = await apiFetch(`/patients/${patientId}/notes`);
    const notes = response.notes || [];
    selectedPatientNotes = notes;

    if (!notes || notes.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-journal-text text-muted" style="font-size: 2rem;"></i>
          <p class="text-muted mt-2">No caregiver notes</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notes.map(note => renderNoteCard(note)).join('');

    notes.forEach(note => {
      if (note.caregiver_user_id === currentUserId) {
        const editBtn = document.getElementById(`edit-note-${note.id}`);
        const deleteBtn = document.getElementById(`delete-note-${note.id}`);

        if (editBtn) editBtn.addEventListener('click', () => editNote(note));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteNote(note.id));
      }
    });

  } catch (error) {
    console.error('Failed to load patient notes:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load notes
      </div>
    `;
  }
}

// ============================================
// Render Note Card
// ============================================
function renderNoteCard(note) {
  const isAuthor = note.caregiver_user_id === currentUserId;
  const authorName = note.users
    ? `${note.users.first_name || ''} ${note.users.last_name || ''}`.trim()
    : 'Unknown';

  return `
    <div class="card mb-3 border-start border-4 border-success">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 class="card-title mb-1">
              <i class="bi bi-person-circle text-primary me-2"></i>
              ${escapeHtml(authorName)}
              ${isAuthor ? '<span class="badge bg-primary ms-2">You</span>' : ''}
            </h6>
            <small class="text-muted">
              <i class="bi bi-calendar3 me-1"></i>${formatDate(note.note_date)}
            </small>
          </div>
          ${isAuthor ? `
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" id="edit-note-${note.id}" title="Edit note">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-danger" id="delete-note-${note.id}" title="Delete note">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
        <p class="card-text mt-2 mb-0">${escapeHtml(note.content || '')}</p>
      </div>
    </div>
  `;
}

// ============================================
// Add Prescription Functions
// ============================================
function addMedicationItem() {
  const itemIndex = prescriptionItems.length;
  prescriptionItems.push({ id: itemIndex, medication_id: null, medication_name: '' });

  const container = document.getElementById('prescriptionItemsContainer');
  const itemHtml = `
    <div class="card mb-3" id="prescription-item-${itemIndex}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <h6 class="mb-0">Medication ${itemIndex + 1}</h6>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="remove-med-item" data-item-index="${itemIndex}">
            <i class="bi bi-trash"></i>
          </button>
        </div>

        <div class="mb-3">
          <label class="form-label">Search Medication</label>
          <input type="text" class="form-control medication-search" id="med-search-${itemIndex}" placeholder="Type to search..." autocomplete="off">
          <input type="hidden" id="med-id-${itemIndex}">
          <div class="list-group mt-1" id="med-results-${itemIndex}" style="display: none; position: absolute; z-index: 1000; max-height: 200px; overflow-y: auto;"></div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Dosage</label>
            <input type="text" class="form-control" id="dosage-${itemIndex}" placeholder="e.g., 500mg" required>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Frequency</label>
            <select class="form-select" id="frequency-${itemIndex}" required>
              <option value="">Select frequency</option>
              <option value="once_daily">Once daily</option>
              <option value="twice_daily">Twice daily</option>
              <option value="three_times_daily">Three times daily</option>
              <option value="four_times_daily">Four times daily</option>
              <option value="every_other_day">Every other day</option>
              <option value="weekly">Weekly</option>
              <option value="as_needed">As needed</option>
            </select>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label">Duration (days)</label>
            <input type="number" class="form-control" id="duration-${itemIndex}" min="1" value="30" required>
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label">Instructions (Optional)</label>
            <input type="text" class="form-control" id="instructions-${itemIndex}" placeholder="e.g., Take with food">
          </div>
        </div>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', itemHtml);
  setupMedicationSearch(itemIndex);
}

function removeMedicationItem(itemIndex) {
  const item = document.getElementById(`prescription-item-${itemIndex}`);
  if (item) {
    item.remove();
    prescriptionItems = prescriptionItems.filter(i => i.id !== itemIndex);
  }
}

function setupMedicationSearch(itemIndex) {
  const searchInput = document.getElementById(`med-search-${itemIndex}`);
  const resultsDiv = document.getElementById(`med-results-${itemIndex}`);
  const hiddenInput = document.getElementById(`med-id-${itemIndex}`);

  let searchTimeout;

  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();

    clearTimeout(searchTimeout);

    if (query.length < 2) {
      resultsDiv.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const medications = await apiFetch(`/medications?search=${encodeURIComponent(query)}`);

        if (medications.length === 0) {
          resultsDiv.innerHTML = '<div class="list-group-item text-muted">No medications found</div>';
          resultsDiv.style.display = 'block';
          return;
        }

        resultsDiv.innerHTML = medications.slice(0, 10).map(med => `
          <button type="button" class="list-group-item list-group-item-action" data-med-id="${med.id}" data-med-name="${escapeHtml(med.brand_name || med.generic_name)}">
            ${escapeHtml(med.brand_name || med.generic_name)}
            ${med.generic_name && med.brand_name && med.brand_name !== med.generic_name ? `<small class="text-muted d-block">${escapeHtml(med.generic_name)}</small>` : ''}
          </button>
        `).join('');

        resultsDiv.style.display = 'block';

        resultsDiv.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            const medId = btn.dataset.medId;
            const medName = btn.dataset.medName;

            prescriptionItems.find(i => i.id === itemIndex).medication_id = medId;
            prescriptionItems.find(i => i.id === itemIndex).medication_name = medName;

            searchInput.value = medName;
            hiddenInput.value = medId;
            resultsDiv.style.display = 'none';
          });
        });

      } catch (error) {
        console.error('Medication search error:', error);
        resultsDiv.innerHTML = '<div class="list-group-item text-danger">Search failed</div>';
        resultsDiv.style.display = 'block';
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !resultsDiv.contains(e.target)) {
      resultsDiv.style.display = 'none';
    }
  });
}

async function submitPrescription() {
  if (!selectedPatient) {
    showToast('No patient selected', 'danger');
    return;
  }

  const prescribedBy = document.getElementById('prescribedBy').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const notes = document.getElementById('prescriptionNotes').value.trim();

  if (!prescribedBy || !startDate) {
    showToast('Please fill in required fields', 'warning');
    return;
  }

  if (prescriptionItems.length === 0) {
    showToast('Please add at least one medication', 'warning');
    return;
  }

  const items = [];
  for (const item of prescriptionItems) {
    const medId = document.getElementById(`med-id-${item.id}`).value;
    const dosage = document.getElementById(`dosage-${item.id}`).value.trim();
    const frequency = document.getElementById(`frequency-${item.id}`).value;
    const duration = document.getElementById(`duration-${item.id}`).value;
    const instructions = document.getElementById(`instructions-${item.id}`).value.trim();

    if (!medId || !dosage || !frequency || !duration) {
      showToast(`Please complete all fields for Medication ${item.id + 1}`, 'warning');
      return;
    }

    items.push({
      medication_id: medId,
      dosage,
      frequency,
      duration_days: parseInt(duration),
      instructions: instructions || null
    });
  }

  const submitBtn = document.getElementById('submitPrescriptionBtn');

  try {
    setButtonLoading(submitBtn, true);

    const response = await apiFetch('/prescriptions', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: selectedPatient.id,
        prescribed_by: prescribedBy,
        start_date: startDate,
        end_date: endDate || null,
        notes: notes || null,
        items
      })
    });

    showToast('Prescription created successfully', 'success');
    addPrescriptionModal.hide();
    resetPrescriptionForm();

    await loadPatientDetails(selectedPatient.id);

  } catch (error) {
    console.error('Failed to create prescription:', error);

    if (error.message.includes('safety') || error.message.includes('interaction') || error.message.includes('allergy')) {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.warnings) {
          showSafetyWarningModal(errorData.warnings, async () => {
            try {
              setButtonLoading(submitBtn, true);

              await apiFetch('/prescriptions?override_safety=true', {
                method: 'POST',
                body: JSON.stringify({
                  patient_id: selectedPatient.id,
                  prescribed_by: prescribedBy,
                  start_date: startDate,
                  end_date: endDate || null,
                  notes: notes || null,
                  items
                })
              });

              showToast('Prescription created with safety override', 'success');
              addPrescriptionModal.hide();
              resetPrescriptionForm();

              await loadPatientDetails(selectedPatient.id);

            } catch (overrideError) {
              console.error('Failed to create prescription with override:', overrideError);
              showToast(overrideError.message || 'Failed to create prescription', 'danger');
            } finally {
              setButtonLoading(submitBtn, false);
            }
          });
          return;
        }
      } catch (parseError) {
        // Not a safety warning, show regular error
      }
    }

    showToast(error.message || 'Failed to create prescription', 'danger');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function resetPrescriptionForm() {
  document.getElementById('addPrescriptionForm').reset();
  document.getElementById('prescriptionItemsContainer').innerHTML = '';
  prescriptionItems = [];

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
}

// ============================================
// Note Functions
// ============================================
async function submitNote() {
  if (!selectedPatient) {
    showToast('No patient selected', 'danger');
    return;
  }

  const noteDate = document.getElementById('noteDate').value;
  const noteContent = document.getElementById('noteContent').value.trim();
  const editNoteId = document.getElementById('editNoteId').value;

  if (!noteDate || !noteContent) {
    showToast('Please fill in all fields', 'warning');
    return;
  }

  const submitBtn = document.getElementById('submitNoteBtn');

  try {
    setButtonLoading(submitBtn, true);

    if (editNoteId) {
      await apiFetch(`/patients/${selectedPatient.id}/notes/${editNoteId}`, {
        method: 'PUT',
        body: JSON.stringify({
          note_date: noteDate,
          content: noteContent
        })
      });

      showToast('Note updated successfully', 'success');
    } else {
      await apiFetch(`/patients/${selectedPatient.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          note_date: noteDate,
          content: noteContent
        })
      });

      showToast('Note added successfully', 'success');
    }

    addNoteModal.hide();
    resetNoteForm();

    await loadPatientNotes(selectedPatient.id);

  } catch (error) {
    console.error('Failed to save note:', error);
    showToast(error.message || 'Failed to save note', 'danger');
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function editNote(note) {
  document.getElementById('noteModalTitle').textContent = 'Edit Caregiver Note';
  document.getElementById('editNoteId').value = note.id;
  document.getElementById('noteDate').value = note.note_date;
  document.getElementById('noteContent').value = note.content;

  addNoteModal.show();
}

async function deleteNote(noteId) {
  const confirmed = confirm('Are you sure you want to delete this note?');
  if (!confirmed) return;

  try {
    await apiFetch(`/patients/${selectedPatient.id}/notes/${noteId}`, {
      method: 'DELETE'
    });

    showToast('Note deleted successfully', 'success');
    await loadPatientNotes(selectedPatient.id);

  } catch (error) {
    console.error('Failed to delete note:', error);
    showToast(error.message || 'Failed to delete note', 'danger');
  }
}

function resetNoteForm() {
  document.getElementById('noteModalTitle').textContent = 'Add Caregiver Note';
  document.getElementById('addNoteForm').reset();
  document.getElementById('editNoteId').value = '';

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('noteDate').value = today;
}

// Open dose history log modal for selected patient
async function openDoseLog(period) {
  if (!selectedPatient) return;
  const days = period === '7d' ? 7 : 30;
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - (days - 1) * 86400000).toISOString().split('T')[0];

  document.getElementById('doseLogTitle').textContent = `Dose History — Last ${days} Days`;
  document.getElementById('doseLogContent').innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';
  new bootstrap.Modal(document.getElementById('doseLogModal')).show();

  try {
    const schedules = await apiFetch(`/patients/${selectedPatient.id}/schedules/range?start_date=${start}&end_date=${end}`);

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

// ============================================
// Family Management Functions
// ============================================
let pendingLeaveId = null;

async function loadModalFamilies() {
  const listEl = document.getElementById('myFamiliesList');
  const noFamilyState = document.getElementById('noFamilyState');
  pendingLeaveId = null;

  if (!caregiverFamilies || caregiverFamilies.length === 0) {
    listEl.innerHTML = '';
    noFamilyState.style.display = '';
    return;
  }

  noFamilyState.style.display = 'none';
  listEl.innerHTML = caregiverFamilies.map(f => `
    <div class="card mb-2 family-modal-card" id="family-card-${f.id}">
      <div class="card-body py-2 px-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <span class="fw-semibold">${escapeHtml(f.name)}</span>
          </div>
          <button class="btn btn-outline-danger btn-sm" data-action="confirm-leave" data-family-id="${f.id}">
            <i class="bi bi-box-arrow-left me-1"></i>Leave
          </button>
        </div>
        <div id="leave-confirm-${f.id}" style="display:none;" class="mt-2">
          <div class="alert alert-danger py-2 mb-2">
            <small><i class="bi bi-exclamation-triangle-fill me-1"></i>You will lose access to all patients in <strong>${escapeHtml(f.name)}</strong>.</small>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-danger btn-sm flex-fill" data-action="leave-family" data-family-id="${f.id}">
              Confirm Leave
            </button>
            <button class="btn btn-outline-secondary btn-sm flex-fill" data-action="cancel-leave" data-family-id="${f.id}">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function confirmLeaveFamily(familyId) {
  if (pendingLeaveId && pendingLeaveId !== familyId) {
    cancelLeaveFamily(pendingLeaveId);
  }
  pendingLeaveId = familyId;
  const el = document.getElementById(`leave-confirm-${familyId}`);
  if (el) el.style.display = '';
}

function cancelLeaveFamily(familyId) {
  pendingLeaveId = null;
  const el = document.getElementById(`leave-confirm-${familyId}`);
  if (el) el.style.display = 'none';
}

async function leaveFamily(familyId) {
  try {
    const result = await apiFetch('/families/leave', {
      method: 'POST',
      body: JSON.stringify({ family_id: familyId })
    });
    if (result.token) {
      setAuthToken(result.token);
      localStorage.removeItem(USER_DATA_KEY);
    }

    caregiverFamilies = caregiverFamilies.filter(f => f.id !== familyId);

    if (activeFamilyId === familyId) {
      activeFamilyId = caregiverFamilies.length > 0 ? caregiverFamilies[0].id : null;
    }

    loadModalFamilies();
    await loadCaregiverFamilies();
    showToast('Left family', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to leave family', 'danger');
  }
}

async function joinNewFamily() {
  const code = document.getElementById('newFamilyCode').value.trim();
  if (!code) {
    showToast('Enter invite code', 'warning');
    return;
  }

  try {
    const result = await apiFetch('/families/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code: code })
    });
    if (result.token) {
      setAuthToken(result.token);
      localStorage.removeItem(USER_DATA_KEY);
    }
    document.getElementById('newFamilyCode').value = '';
    showToast('Joined family successfully', 'success');

    await loadCaregiverFamilies();
    loadModalFamilies();
  } catch (error) {
    showToast(error.message || 'Failed to join family', 'danger');
  }
}

// Load family info when modal opens
document.addEventListener('DOMContentLoaded', () => {
  const manageFamiliesModal = document.getElementById('manageFamiliesModal');
  if (manageFamiliesModal) {
    manageFamiliesModal.addEventListener('show.bs.modal', loadModalFamilies);
  }
});

