const bajaForm = document.getElementById('bajaForm');
const masterKeyModal = document.getElementById('masterKeyModal');
const masterKeyForm = document.getElementById('masterKeyForm');
const masterKeyInput = document.getElementById('masterKey');
const masterKeyMessage = document.getElementById('masterKeyMensaje');
const closeMasterKeyModal = document.getElementById('closeMasterKeyModal');
const cancelMasterKey = document.getElementById('cancelMasterKey');
let masterKeyAttempts = 0;
const maxMasterKeyAttempts = 3;

function cerrarModalClave() {
  masterKeyModal.classList.remove('is-visible');
  masterKeyModal.setAttribute('aria-hidden', 'true');
  masterKeyForm.reset();
  masterKeyMessage.textContent = '';
  masterKeyAttempts = 0;
}

function abrirModalClave() {
  masterKeyAttempts = 0;
  masterKeyMessage.textContent = '';
  masterKeyModal.classList.add('is-visible');
  masterKeyModal.setAttribute('aria-hidden', 'false');
  masterKeyInput.focus();
}

bajaForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!bajaForm.reportValidity()) return;
  abrirModalClave();
});

closeMasterKeyModal.addEventListener('click', cerrarModalClave);
cancelMasterKey.addEventListener('click', cerrarModalClave);
masterKeyModal.addEventListener('click', event => {
  if (event.target === masterKeyModal) cerrarModalClave();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && masterKeyModal.classList.contains('is-visible')) cerrarModalClave();
});

masterKeyForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submitButton = masterKeyForm.querySelector('button[type="submit"]');
  const payload = {
    id: document.getElementById('maquina').value,
    notas: document.getElementById('notas').value.trim(),
    password: masterKeyInput.value
  };

  if (!payload.id) {
    masterKeyMessage.textContent = 'Seleccione una solicitud.';
    return;
  }

  submitButton.disabled = true;
  masterKeyMessage.textContent = '';

  try {
    const response = await fetch(API_URL('/api/ordenes/baja'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      masterKeyAttempts += 1;
      const remainingAttempts = maxMasterKeyAttempts - masterKeyAttempts;
      masterKeyMessage.style.color = 'red';
      masterKeyMessage.textContent = remainingAttempts > 0
        ? `Clave maestra incorrecta. Intentos restantes: ${remainingAttempts}.`
        : 'Se agotaron los intentos. La sesión se cerrará.';
      masterKeyInput.value = '';
      if (remainingAttempts <= 0) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        cerrarModalClave();
        window.location.reload();
      }
      return;
    }
    alert(data.message || 'Orden dada de baja.');
    window.location.href = '../pages/lista_solicitudes.html';
  } catch (error) {
    masterKeyMessage.style.color = 'red';
    masterKeyMessage.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});