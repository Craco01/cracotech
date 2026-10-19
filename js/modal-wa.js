const waButton = document.getElementById('waButton');
const waModal = document.getElementById('waModal');
const closeWaModal = () => {
  waModal.style.display = 'none';
  waModal.setAttribute('aria-hidden', 'true');
  waButton.setAttribute('aria-expanded', 'false');
  waButton.focus();
};

waButton.addEventListener('click', () => {
  waModal.style.display = 'flex';
  waModal.setAttribute('aria-hidden', 'false');
  waButton.setAttribute('aria-expanded', 'true');
  waModal.querySelector('a')?.focus();
});

// Cerrar modal con botón
document.getElementById("closeBtn").addEventListener("click", function() {
  closeWaModal();
});

// Cerrar modal clicando fuera del contenido
document.getElementById("waModal").addEventListener("click", function(event) {
  if (event.target === this) closeWaModal();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && waModal.style.display === 'flex') closeWaModal();
});

waModal.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const items = [...waModal.querySelectorAll('a[href], button:not(:disabled)')];
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
