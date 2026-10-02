const state = { token: '', selected: null };
const $ = (id) => document.getElementById(id);
$('apiBase').value = API_BASE_URL;
const api = (path) => `${$('apiBase').value.trim().replace(/\/$/, '')}${path}`;
const setStatus = (id, message, type = '') => { const element = $(id); element.textContent = message; element.className = `status ${type}`; };
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` });

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...authHeaders(), ...(options.headers || {}) };
  if (method !== 'GET') headers['X-Master-Password'] = $('masterPassword').value;
  let response;
  try {
    response = await fetch(api(path), { ...options, headers });
  } catch {
    throw new Error('No se pudo conectar con la API. Comprueba la URL, la conexión y que el backend esté disponible.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Error HTTP ${response.status}`);
  if (method !== 'GET') $('masterPassword').value = '';
  return data;
}

function setFormMode() {
  const hasAccount = Boolean(state.selected?.userId);
  $('password').required = !hasAccount;
  $('passwordConfirm').required = !hasAccount;
  $('passwordHint').textContent = hasAccount ? 'Opcional al editar; 3 a 9 caracteres alfanuméricos' : 'Obligatoria; 3 a 9 caracteres alfanuméricos';
  $('saveButton').textContent = state.selected ? (hasAccount ? 'Actualizar cuenta y empleado' : 'Crear cuenta vinculada') : 'Crear cuenta y empleado';
  $('deleteButton').disabled = !state.selected;
  $('resetPasswordOpen').disabled = !hasAccount;
}

function clearForm() {
  state.selected = null;
  $('accountForm').reset();
  $('password').value = '';
  $('passwordConfirm').value = '';
  $('accountSelection').classList.add('hidden');
  $('accountSelectionName').textContent = '';
  $('resetPasswordPanel').classList.add('hidden');
  $('resetPasswordForm').reset();
  document.querySelectorAll('#accountsBody tr').forEach(row => row.classList.remove('selected'));
  setFormMode();
}

function renderAccount(account) {
  const userId = account.userId ?? '';
  const employeeId = account.employeeId ?? '';
  const conflict = Boolean(account.linkConflict);
  const userLabel = account.userId ? escapeHtml(account.username) : '<span class="badge">Sin cuenta</span>';
  const employeeLabel = account.employeeId ? escapeHtml(account.nombre_apellido || '') : '<span class="subtle">Sin empleado</span>';
  const linkLabel = conflict ? 'Vínculo duplicado' : account.userId && account.employeeId ? 'Vinculados' : account.userId ? 'Sin empleado' : 'Sin cuenta';
  const rowClass = conflict ? ' class="conflict-row"' : '';
  const title = conflict ? 'Varios empleados comparten este usuario; corrige la relación en la base de datos.' : '';
  return `<tr${rowClass} data-user-id="${userId}" data-employee-id="${employeeId}" data-username="${escapeHtml(account.username || '')}" data-ci="${escapeHtml(account.ci ?? '')}" data-legajo="${escapeHtml(account.legajo ?? '')}" data-salary="${escapeHtml(account.salario ?? '')}" data-link-conflict="${conflict}" title="${title}"><td>${userLabel}</td><td>${escapeHtml(account.role || '—')}</td><td>${employeeLabel}</td><td>${escapeHtml(account.cargo || '—')}</td><td>${escapeHtml(linkLabel)}</td><td>${conflict ? 'Revisar vínculo' : 'Seleccionar'}</td></tr>`;
}

async function loadAccounts() {
  try {
    const accounts = await request('/api/admin-accounts');
    $('accountsBody').innerHTML = accounts.length ? accounts.map(renderAccount).join('') : '<tr><td colspan="6">No hay cuentas ni empleados.</td></tr>';
    const conflicts = accounts.filter(account => account.linkConflict).length;
    setStatus('adminStatus', `${accounts.length} registro(s) cargado(s).${conflicts ? ` ${conflicts} vínculo(s) duplicado(s) requieren revisión.` : ''}`, conflicts ? '' : 'ok');
    bindRows();
  } catch (error) {
    setStatus('adminStatus', error.message, 'error');
  }
}

function bindRows() {
  document.querySelectorAll('#accountsBody tr[data-user-id]').forEach(row => row.addEventListener('click', () => {
    if (row.dataset.linkConflict === 'true') {
      setStatus('adminStatus', 'Vínculo duplicado: corrige la relación en la base de datos antes de editar o eliminar.', 'error');
      return;
    }
    state.selected = {
      userId: row.dataset.userId ? Number(row.dataset.userId) : null,
      employeeId: row.dataset.employeeId ? Number(row.dataset.employeeId) : null
    };
    document.querySelectorAll('#accountsBody tr').forEach(item => item.classList.remove('selected'));
    row.classList.add('selected');
    $('username').value = row.dataset.username;
    const role = row.children[1].textContent.trim();
    $('role').value = ['viewer', 'editor', 'administrador'].includes(role) ? role : 'viewer';
    $('employeeName').value = row.children[2].querySelector('.badge') ? '' : row.children[2].textContent.trim();
    $('employeeCi').value = row.dataset.ci;
    $('employeeLegajo').value = row.dataset.legajo;
    $('employeeCargo').value = row.children[3].textContent.trim() === '—' ? '' : row.children[3].textContent.trim();
    $('employeeSalary').value = row.dataset.salary;
    $('password').value = '';
    $('passwordConfirm').value = '';
    $('accountSelectionName').textContent = row.dataset.username || 'Empleado sin cuenta';
    $('accountSelection').classList.remove('hidden');
    $('resetPasswordPanel').classList.add('hidden');
    $('resetPasswordForm').reset();
    setFormMode();
  }));
}

$('loginButton').addEventListener('click', async () => {
  setStatus('loginStatus', '');
  try {
    let response;
    try {
      response = await fetch(api('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('loginUser').value.trim(), password: $('loginPassword').value }) });
    } catch {
      throw new Error('No se pudo conectar con la API. Comprueba la URL, la conexión y que el backend esté disponible.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'No fue posible iniciar sesión');
    if (data.role !== 'administrador') throw new Error('La cuenta debe tener rol administrador');
    state.token = data.token;
    $('loginPassword').value = '';
    $('loginPanel').classList.add('hidden');
    $('adminPanel').classList.remove('hidden');
    setStatus('adminStatus', 'Sesión iniciada. Los listados no requieren clave maestra.', 'ok');
    await loadAccounts();
  } catch (error) {
    setStatus('loginStatus', error.message, 'error');
  }
});

$('logoutButton').addEventListener('click', () => {
  state.token = '';
  $('masterPassword').value = '';
  clearForm();
  $('adminPanel').classList.add('hidden');
  $('loginPanel').classList.remove('hidden');
});
$('clearButton').addEventListener('click', clearForm);
$('loadButton').addEventListener('click', loadAccounts);
$('resetPasswordOpen').addEventListener('click', () => {
  if (!state.selected?.userId) return;
  $('resetPasswordForm').reset();
  $('resetPasswordAccount').textContent = `Cuenta: ${$('accountSelectionName').textContent}`;
  $('resetPasswordPanel').classList.remove('hidden');
  $('resetPassword').focus();
});
$('cancelPasswordReset').addEventListener('click', () => {
  $('resetPasswordPanel').classList.add('hidden');
  $('resetPasswordForm').reset();
});
$('resetPasswordForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.selected?.userId) return setStatus('adminStatus', 'Selecciona una cuenta para restablecer la contraseña.', 'error');
  if ($('resetPassword').value !== $('resetPasswordConfirm').value) return setStatus('adminStatus', 'Las contraseñas no coinciden.', 'error');
  try {
    await request(`/api/admin-accounts/${state.selected.userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password: $('resetPassword').value })
    });
    $('resetPasswordPanel').classList.add('hidden');
    $('resetPasswordForm').reset();
    setStatus('adminStatus', 'Contraseña restablecida correctamente.', 'ok');
  } catch (error) {
    setStatus('adminStatus', error.message, 'error');
  }
});
$('accountForm').addEventListener('submit', async event => {
  event.preventDefault();
  if ($('password').value !== $('passwordConfirm').value) return setStatus('adminStatus', 'Las contraseñas no coinciden.', 'error');
  const body = {
    username: $('username').value.trim(),
    role: $('role').value,
    password: $('password').value,
    employeeId: state.selected?.employeeId ?? null,
    employee: {
      nombre_apellido: $('employeeName').value.trim(),
      ci: $('employeeCi').value,
      legajo: $('employeeLegajo').value,
      cargo: $('employeeCargo').value.trim(),
      salario: $('employeeSalary').value
    }
  };
  const userId = state.selected?.userId;
  const method = userId ? 'PUT' : 'POST';
  const path = userId ? `/api/admin-accounts/${userId}` : '/api/admin-accounts';
  try {
    await request(path, { method, body: JSON.stringify(body) });
    setStatus('adminStatus', userId ? 'Cuenta y empleado actualizados.' : 'Cuenta y empleado guardados.', 'ok');
    clearForm();
    await loadAccounts();
  } catch (error) {
    setStatus('adminStatus', error.message, 'error');
  }
});

$('deleteButton').addEventListener('click', async () => {
  if (!state.selected) return;
  const paired = Boolean(state.selected.userId);
  const confirmation = paired ? '¿Eliminar la cuenta y su empleado asociado?' : '¿Eliminar este empleado sin cuenta?';
  if (!await window.siteDialog.confirm(confirmation)) return;
  const path = paired
    ? `/api/admin-accounts/${state.selected.userId}`
    : `/api/admin-accounts/orphan-employees/${state.selected.employeeId}`;
  try {
    await request(path, { method: 'DELETE' });
    setStatus('adminStatus', paired ? 'Cuenta y empleado eliminados.' : 'Empleado eliminado.', 'ok');
    clearForm();
    await loadAccounts();
  } catch (error) {
    setStatus('adminStatus', error.message, 'error');
  }
});

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }
setFormMode();