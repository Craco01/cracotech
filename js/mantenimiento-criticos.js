document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('mantenimientoCriticosForm');
  if (!form) return;

  const steps = Array.from(form.querySelectorAll('.form-step'));
  const progressItems = Array.from(form.querySelectorAll('.form-progress li'));
  const progressBar = document.getElementById('formProgressBar');
  let currentStep = 0;
  let idempotencyKey = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  function showStep(index) {
    currentStep = index;
    steps.forEach((step, stepIndex) => {
      const isCurrent = stepIndex === index;
      step.hidden = !isCurrent;
      step.classList.toggle('is-active', isCurrent);
    });

    progressItems.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === index);
      item.classList.toggle('is-complete', itemIndex < index);
    });

    progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
  }

  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-next]')) showStep(currentStep + 1);
    if (event.target.closest('[data-previous]')) showStep(currentStep - 1);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = Array.from(form.querySelectorAll('[required]'));
    const invalidField = fields.find((field) => !field.checkValidity());
    if (invalidField) {
      const invalidStep = steps.findIndex((step) => step.contains(invalidField));
      if (invalidStep >= 0) showStep(invalidStep);
      invalidField.reportValidity();
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await API_FETCH('/api/mantenimientos-criticos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo registrar el mantenimiento crítico.');

      form.reset();
      idempotencyKey = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      showStep(0);
      window.alert(data.duplicate ? 'Este registro ya había sido recibido.' : 'Mantenimiento crítico registrado correctamente.');
    } catch (error) {
      window.alert(error.message || 'No se pudo registrar el mantenimiento crítico.');
    } finally {
      submitButton.disabled = false;
    }
  });

  showStep(0);
});
