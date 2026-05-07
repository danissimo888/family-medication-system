// Admin Panel - MedFamily

// Global State
let currentTab = 'users';
let users = [];
let medications = [];
let interactions = [];
let auditLogs = [];
let currentPage = 1;
let totalPages = 1;
let filters = {};
let currentUserId = null;

// Modals
let medicationModal = null;
let interactionModal = null;
let confirmModal = null;
let confirmCallback = null;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Require admin role
    const userData = await requireRole(['admin']);
    currentUserId = userData.user_id;

    // Update user name in navbar
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
      userNameEl.textContent = `${userData.first_name} ${userData.last_name}`;
    }

    // Initialize modals
    medicationModal = new bootstrap.Modal(document.getElementById('medicationModal'));
    interactionModal = new bootstrap.Modal(document.getElementById('interactionModal'));
    confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));

    // Setup tab switching
    setupTabSwitching();

    // Setup search handlers
    setupSearchHandlers();

    // Setup static button handlers
    setupButtonHandlers();

    // Setup event delegation for dynamic content
    setupEventDelegation();

    // Load initial tab
    loadUsers();

  } catch (error) {
    console.error('Admin panel initialization error:', error);
    showToast('Failed to load admin panel', 'danger');
  }
});

// ============================================
// Tab Switching
// ============================================
function setupTabSwitching() {
  document.querySelectorAll('.admin-tabs .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tab) {
  // Update active state
  document.querySelectorAll('.admin-tabs .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(content => {
    content.style.display = 'none';
  });

  // Show selected tab
  currentTab = tab;

  switch(tab) {
    case 'users':
      document.getElementById('usersTab').style.display = 'block';
      loadUsers();
      break;
    case 'medications':
      document.getElementById('medicationsTab').style.display = 'block';
      loadMedications();
      break;
    case 'interactions':
      document.getElementById('interactionsTab').style.display = 'block';
      loadInteractions();
      break;
    case 'audit':
      document.getElementById('auditTab').style.display = 'block';
      loadAuditLogs();
      break;
  }
}

// ============================================
// Search Handlers
// ============================================
function setupSearchHandlers() {
  // User search
  const userSearch = document.getElementById('userSearch');
  if (userSearch) {
    userSearch.addEventListener('input', (e) => {
      filterUsers(e.target.value);
    });
  }

  // Medication search
  const medSearch = document.getElementById('medicationSearch');
  if (medSearch) {
    medSearch.addEventListener('input', () => {
      filterMedications();
    });
  }

  // Medication category filter
  const categoryFilter = document.getElementById('medicationCategoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      filterMedications();
    });
  }
}

// ============================================
// Static Button Handlers
// ============================================
function setupButtonHandlers() {
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', (e) => { e.preventDefault(); fn(); });
  };

  bind('logoutBtn', logout);
  bind('refreshUsersBtn', loadUsers);
  bind('addMedicationBtn', openAddMedicationModal);
  bind('refreshMedicationsBtn', loadMedications);
  bind('addInteractionBtn', openAddInteractionModal);
  bind('refreshInteractionsBtn', loadInteractions);
  bind('exportAuditBtn', exportAuditLogs);
  bind('refreshAuditBtn', loadAuditLogs);
  bind('saveMedicationBtn', saveMedication);
  bind('saveInteractionBtn', saveInteraction);
  bind('applyFiltersBtn', applyAuditFilters);
  bind('clearFiltersBtn', clearAuditFilters);
}

// ============================================
// Event Delegation for Dynamic Content
// ============================================
function setupEventDelegation() {
  // Users table
  document.getElementById('usersTableContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    const action = btn.dataset.action;
    const userId = btn.dataset.userId;
    if (action === 'toggle-status') {
      toggleUserStatus(userId, btn.dataset.newStatus === 'true');
    }
  });

  document.getElementById('usersTableContainer').addEventListener('change', (e) => {
    const select = e.target.closest('[data-action="change-role"]');
    if (!select) return;
    changeUserRole(select.dataset.userId, select.value);
  });

  // Medications table
  document.getElementById('medicationsTableContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    const medId = btn.dataset.medId;
    if (btn.dataset.action === 'edit-med') openEditMedicationModal(medId);
    if (btn.dataset.action === 'delete-med') deleteMedication(medId);
  });

  // Interactions table
  document.getElementById('interactionsTableContainer').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    const intId = btn.dataset.intId;
    if (btn.dataset.action === 'edit-int') openEditInteractionModal(intId);
    if (btn.dataset.action === 'delete-int') deleteInteraction(intId);
  });

  // Audit pagination
  document.getElementById('auditPagination').addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    loadAuditLogs(parseInt(link.dataset.page, 10));
  });
}

// ============================================
// User Management
// ============================================
async function loadUsers() {
  const container = document.getElementById('usersTableContainer');

  try {
    const data = await apiFetch('/users');
    users = data.users || [];

    // Update stats
    updateUserStats();

    // Render table
    renderUsersTable(users);

  } catch (error) {
    console.error('Failed to load users:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load users
      </div>
    `;
  }
}

function updateUserStats() {
  const total = users.length;
  const active = users.filter(u => u.is_active).length;
  const admins = users.filter(u => u.roles && u.roles.name === 'admin').length;

  document.getElementById('totalUsers').textContent = total;
  document.getElementById('activeUsers').textContent = active;
  document.getElementById('adminCount').textContent = admins;
}

function renderUsersTable(userList) {
  const container = document.getElementById('usersTableContainer');

  if (userList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-people text-muted" style="font-size: 3rem;"></i>
        <p class="text-muted mt-3">No users found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${userList.map(user => `
            <tr>
              <td>${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}</td>
              <td>${escapeHtml(user.email)}</td>
              <td>
                <select class="form-select form-select-sm" data-action="change-role" data-user-id="${user.id}" ${user.id === currentUserId ? 'disabled' : ''}>
                  <option value="patient" ${user.roles && user.roles.name === 'patient' ? 'selected' : ''}>Patient</option>
                  <option value="caregiver" ${user.roles && user.roles.name === 'caregiver' ? 'selected' : ''}>Caregiver</option>
                  <option value="admin" ${user.roles && user.roles.name === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
              </td>
              <td>
                ${user.is_active
                  ? '<span class="badge badge-success">Active</span>'
                  : '<span class="badge badge-danger">Inactive</span>'}
              </td>
              <td>${user.last_login ? formatDate(user.last_login) : 'Never'}</td>
              <td>
                <button class="btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}"
                        data-action="toggle-status" data-user-id="${user.id}" data-new-status="${!user.is_active}"
                        ${user.id === currentUserId ? 'disabled' : ''}>
                  <i class="bi bi-${user.is_active ? 'x-circle' : 'check-circle'}"></i>
                  ${user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterUsers(query) {
  const filtered = users.filter(user => {
    const searchStr = `${user.first_name} ${user.last_name} ${user.email}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });
  renderUsersTable(filtered);
}

async function toggleUserStatus(userId, newStatus) {
  try {
    await apiFetch(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: newStatus })
    });

    showToast(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
    loadUsers();
  } catch (error) {
    console.error('Failed to toggle user status:', error);
    showToast(error.message || 'Failed to update user status', 'danger');
  }
}

async function changeUserRole(userId, newRole) {
  try {
    // Get role ID
    const roleMap = { patient: 1, caregiver: 2, admin: 3 }; // Adjust based on your DB
    const roleId = roleMap[newRole];

    await apiFetch(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_id: roleId })
    });

    showToast('User role updated successfully', 'success');
    loadUsers();
  } catch (error) {
    console.error('Failed to change user role:', error);
    showToast(error.message || 'Failed to update user role', 'danger');
    loadUsers(); // Reload to reset dropdown
  }
}

// ============================================
// Medication Management
// ============================================
async function loadMedications() {
  const container = document.getElementById('medicationsTableContainer');

  try {
    medications = await apiFetch('/medications');
    populateCategoryFilter();
    renderMedicationsTable(medications);
  } catch (error) {
    console.error('Failed to load medications:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load medications
      </div>
    `;
  }
}

function populateCategoryFilter() {
  const categories = [...new Set(medications.map(m => m.category).filter(Boolean))].sort();
  const filterSelect = document.getElementById('medicationCategoryFilter');

  filterSelect.innerHTML = '<option value="">All Categories</option>' +
    categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
}

function renderMedicationsTable(medList) {
  const container = document.getElementById('medicationsTableContainer');

  if (medList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-capsule text-muted" style="font-size: 3rem;"></i>
        <p class="text-muted mt-3">No medications found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover admin-table">
        <thead>
          <tr>
            <th>Brand Name</th>
            <th>Generic Name</th>
            <th>Description</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${medList.map(med => `
            <tr>
              <td>${escapeHtml(med.brand_name || '-')}</td>
              <td>${escapeHtml(med.generic_name || '-')}</td>
              <td>${escapeHtml(med.description || '-')}</td>
              <td>${escapeHtml(med.category || '-')}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" data-action="edit-med" data-med-id="${med.id}">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete-med" data-med-id="${med.id}">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterMedications() {
  const query = document.getElementById('medicationSearch').value.toLowerCase();
  const category = document.getElementById('medicationCategoryFilter').value;

  const filtered = medications.filter(med => {
    const searchStr = `${med.brand_name || ''} ${med.generic_name || ''} ${med.category || ''} ${med.description || ''}`.toLowerCase();
    const matchesSearch = !query || searchStr.includes(query);
    const matchesCategory = !category || med.category === category;
    return matchesSearch && matchesCategory;
  });

  renderMedicationsTable(filtered);
}

function openAddMedicationModal() {
  document.getElementById('medicationModalTitle').innerHTML = '<i class="bi bi-capsule-pill me-2"></i>Add Medication';
  document.getElementById('medicationForm').reset();
  document.getElementById('medicationId').value = '';
}

function openEditMedicationModal(medId) {
  const med = medications.find(m => m.id === medId);
  if (!med) return;

  document.getElementById('medicationModalTitle').innerHTML = '<i class="bi bi-capsule-pill me-2"></i>Edit Medication';
  document.getElementById('medicationId').value = med.id;
  document.getElementById('brandName').value = med.brand_name || '';
  document.getElementById('genericName').value = med.generic_name || '';
  document.getElementById('dosageForm').value = med.dosage_form || '';
  document.getElementById('strength').value = med.strength || '';
  document.getElementById('manufacturer').value = med.manufacturer || '';
  document.getElementById('category').value = med.category || '';
  document.getElementById('description').value = med.description || '';
  document.getElementById('sideEffects').value = med.side_effects || '';

  medicationModal.show();
}

async function saveMedication() {
  const medId = document.getElementById('medicationId').value;
  const data = {
    brand_name: document.getElementById('brandName').value.trim(),
    generic_name: document.getElementById('genericName').value.trim(),
    dosage_form: document.getElementById('dosageForm').value,
    strength: document.getElementById('strength').value.trim(),
    manufacturer: document.getElementById('manufacturer').value.trim(),
    category: document.getElementById('category').value.trim(),
    description: document.getElementById('description').value.trim(),
    side_effects: document.getElementById('sideEffects').value.trim()
  };

  if (!data.brand_name || !data.generic_name || !data.dosage_form || !data.strength) {
    showToast('Brand name, generic name, dosage form, and strength are required', 'warning');
    return;
  }

  try {
    if (medId) {
      await apiFetch(`/medications/${medId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showToast('Medication updated successfully', 'success');
    } else {
      await apiFetch('/medications', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      showToast('Medication added successfully', 'success');
    }

    medicationModal.hide();
    loadMedications();
  } catch (error) {
    console.error('Failed to save medication:', error);
    showToast(error.message || 'Failed to save medication', 'danger');
  }
}

function deleteMedication(medId) {
  showConfirmDialog('Are you sure you want to delete this medication? This action cannot be undone.', async () => {
    try {
      await apiFetch(`/medications/${medId}`, {
        method: 'DELETE'
      });
      showToast('Medication deleted successfully', 'success');
      loadMedications();
    } catch (error) {
      console.error('Failed to delete medication:', error);
      showToast(error.message || 'Failed to delete medication', 'danger');
    }
  });
}

// ============================================
// Drug Interactions Management
// ============================================
async function loadInteractions() {
  const container = document.getElementById('interactionsTableContainer');

  try {
    interactions = await apiFetch('/interactions');
    // Transform nested med1/med2 to flat medication_1_name/medication_2_name
    interactions = interactions.map(int => ({
      ...int,
      medication_1_name: int.med1?.brand_name || int.med1?.generic_name || 'Unknown',
      medication_2_name: int.med2?.brand_name || int.med2?.generic_name || 'Unknown'
    }));
    renderInteractionsTable(interactions);
  } catch (error) {
    console.error('Failed to load interactions:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load interactions
      </div>
    `;
  }
}

function renderInteractionsTable(intList) {
  const container = document.getElementById('interactionsTableContainer');

  if (intList.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-exclamation-triangle text-muted" style="font-size: 3rem;"></i>
        <p class="text-muted mt-3">No drug interactions found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover admin-table">
        <thead>
          <tr>
            <th>Medication 1</th>
            <th>Medication 2</th>
            <th>Severity</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${intList.map(int => `
            <tr>
              <td>${escapeHtml(int.medication_1_name || 'Unknown')}</td>
              <td>${escapeHtml(int.medication_2_name || 'Unknown')}</td>
              <td>
                <span class="badge ${getSeverityBadgeClass(int.severity)}">
                  ${escapeHtml(int.severity || 'Unknown')}
                </span>
              </td>
              <td>${escapeHtml(int.description || '-')}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" data-action="edit-int" data-int-id="${int.id}">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" data-action="delete-int" data-int-id="${int.id}">
                  <i class="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getSeverityBadgeClass(severity) {
  switch(severity?.toLowerCase()) {
    case 'minor': return 'badge-warning';
    case 'moderate': return 'badge-warning';
    case 'major': return 'badge-danger';
    default: return 'badge-info';
  }
}

function openAddInteractionModal() {
  document.getElementById('interactionModalTitle').innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Add Drug Interaction';
  document.getElementById('interactionForm').reset();
  document.getElementById('interactionId').value = '';
  document.getElementById('medication1').value = '';
  document.getElementById('medication2').value = '';
  document.getElementById('medication1Search').value = '';
  document.getElementById('medication2Search').value = '';

  setupMedicationSearch();
}

function openEditInteractionModal(intId) {
  const int = interactions.find(i => i.id === intId);
  if (!int) return;

  document.getElementById('interactionModalTitle').innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Edit Drug Interaction';
  document.getElementById('interactionId').value = int.id;
  document.getElementById('medication1').value = int.medication_id_1;
  document.getElementById('medication2').value = int.medication_id_2;
  document.getElementById('medication1Search').value = int.medication_1_name || '';
  document.getElementById('medication2Search').value = int.medication_2_name || '';
  document.getElementById('severity').value = int.severity || '';
  document.getElementById('interactionDescription').value = int.description || '';

  setupMedicationSearch();
  interactionModal.show();
}

function setupMedicationSearch() {
  setupMedicationSearchField('medication1');
  setupMedicationSearchField('medication2');
}

function setupMedicationSearchField(fieldPrefix) {
  const searchInput = document.getElementById(`${fieldPrefix}Search`);
  const resultsDiv = document.getElementById(`${fieldPrefix}Results`);
  const hiddenInput = document.getElementById(fieldPrefix);

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
        const meds = await apiFetch(`/medications?search=${encodeURIComponent(query)}`);

        if (meds.length === 0) {
          resultsDiv.innerHTML = '<div class="list-group-item text-muted">No medications found</div>';
          resultsDiv.style.display = 'block';
          return;
        }

        resultsDiv.innerHTML = meds.slice(0, 10).map(med => `
          <button type="button" class="list-group-item list-group-item-action" data-med-id="${med.id}" data-med-name="${escapeHtml(med.brand_name || med.generic_name)}">
            ${escapeHtml(med.brand_name || med.generic_name)}
          </button>
        `).join('');

        resultsDiv.style.display = 'block';

        resultsDiv.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            hiddenInput.value = btn.dataset.medId;
            searchInput.value = btn.dataset.medName;
            resultsDiv.style.display = 'none';
          });
        });

      } catch (error) {
        console.error('Medication search error:', error);
      }
    }, 300);
  });
}

async function saveInteraction() {
  const intId = document.getElementById('interactionId').value;
  const med1 = document.getElementById('medication1').value;
  const med2 = document.getElementById('medication2').value;
  const severity = document.getElementById('severity').value;
  const description = document.getElementById('interactionDescription').value.trim();

  if (!med1 || !med2 || !severity || !description) {
    showToast('All fields are required', 'warning');
    return;
  }

  if (med1 === med2) {
    showToast('Please select two different medications', 'warning');
    return;
  }

  const data = {
    medication_id_1: med1,
    medication_id_2: med2,
    severity,
    description
  };

  try {
    if (intId) {
      await apiFetch(`/interactions/${intId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showToast('Interaction updated successfully', 'success');
    } else {
      await apiFetch('/interactions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      showToast('Interaction added successfully', 'success');
    }

    interactionModal.hide();
    loadInteractions();
  } catch (error) {
    console.error('Failed to save interaction:', error);
    showToast(error.message || 'Failed to save interaction', 'danger');
  }
}

function deleteInteraction(intId) {
  showConfirmDialog('Are you sure you want to delete this drug interaction?', async () => {
    try {
      await apiFetch(`/interactions/${intId}`, {
        method: 'DELETE'
      });
      showToast('Interaction deleted successfully', 'success');
      loadInteractions();
    } catch (error) {
      console.error('Failed to delete interaction:', error);
      showToast(error.message || 'Failed to delete interaction', 'danger');
    }
  });
}

// ============================================
// Audit Logs
// ============================================
async function loadAuditLogs(page = 1) {
  const container = document.getElementById('auditLogsTableContainer');
  currentPage = page;

  try {
    const params = new URLSearchParams({
      page: page,
      limit: 50,
      ...filters
    });

    const data = await apiFetch(`/audit-logs?${params}`);
    auditLogs = data.logs || [];
    totalPages = data.pagination?.totalPages || 1;

    renderAuditLogsTable(auditLogs);
    renderPagination();
  } catch (error) {
    console.error('Failed to load audit logs:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load audit logs
      </div>
    `;
  }
}

function renderAuditLogsTable(logs) {
  const container = document.getElementById('auditLogsTableContainer');

  if (logs.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-journal-text text-muted" style="font-size: 3rem;"></i>
        <p class="text-muted mt-3">No audit logs found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover admin-table table-sm">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Table</th>
            <th>Record ID</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td>${formatTimestamp(log.created_at)}</td>
              <td>${escapeHtml(log.user_email || 'System')}</td>
              <td>
                <span class="badge ${getActionBadgeClass(log.action)}">
                  ${escapeHtml(log.action)}
                </span>
              </td>
              <td>${escapeHtml(log.table_name)}</td>
              <td><code>${escapeHtml(log.record_id || '-')}</code></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getActionBadgeClass(action) {
  switch(action?.toUpperCase()) {
    case 'INSERT': return 'badge-success';
    case 'UPDATE': return 'badge-warning';
    case 'DELETE': return 'badge-danger';
    default: return 'badge-info';
  }
}

function renderPagination() {
  const container = document.getElementById('auditPagination');

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let pages = '';

  // Previous button
  pages += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    pages += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }

  // Next button
  pages += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
    </li>
  `;

  container.innerHTML = pages;
}

function applyAuditFilters() {
  filters = {};

  const action = document.getElementById('filterAction').value;
  const table = document.getElementById('filterTable').value.trim();
  const fromDate = document.getElementById('filterFromDate').value;
  const toDate = document.getElementById('filterToDate').value;

  if (action) filters.action = action;
  if (table) filters.table_name = table;
  if (fromDate) filters.from_date = fromDate;
  if (toDate) filters.to_date = toDate;

  loadAuditLogs(1);
}

function clearAuditFilters() {
  filters = {};
  document.getElementById('filterAction').value = '';
  document.getElementById('filterTable').value = '';
  document.getElementById('filterFromDate').value = '';
  document.getElementById('filterToDate').value = '';
  loadAuditLogs(1);
}

function exportAuditLogs() {
  const csvEscape = (val) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const csv = [
    ['Timestamp', 'User', 'Action', 'Table', 'Record ID'],
    ...auditLogs.map(log => [
      log.created_at,
      log.user_email || 'System',
      log.action,
      log.table_name,
      log.record_id || ''
    ])
  ].map(row => row.map(csvEscape).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// Helpers
// ============================================
function showConfirmDialog(message, onConfirm) {
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = onConfirm;

  document.getElementById('confirmButton').onclick = () => {
    confirmModal.hide();
    if (confirmCallback) confirmCallback();
  };

  confirmModal.show();
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
