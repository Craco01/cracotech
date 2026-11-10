(function () {
  const CARDS = [
    { id: 'maq1', titulo: 'Maquinarias · 1° Semestre', periodo: 'Semestral' },
    { id: 'maq2', titulo: 'Maquinarias · 2° Semestre', periodo: 'Semestral' },
    { id: 'infra', titulo: 'Infraestructura', periodo: 'Anual' }
  ];

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const txt = (id) => (document.getElementById(id)?.textContent || '').trim();

  function fechaLarga() {
    const f = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    return f.charAt(0).toUpperCase() + f.slice(1);
  }

  function construirHtml() {
    const logo = new URL('../../img/Logo%20MV%20Vertical%20SAE.png', document.baseURI).href;
    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const tarjetas = CARDS.map((c) => {
      const pill = document.getElementById('pill-' + c.id);
      const fuera = pill && !pill.classList.contains('status-ok');
      const color = fuera ? '#b42318' : '#067647';
      return `<section class="card">
        <div class="top"><h2>${esc(c.titulo)}</h2><span class="badge">${c.periodo}</span></div>
        <div class="pct" style="color:${color}">${esc(txt('pct-' + c.id))}</div>
        <div class="estado" style="color:${color}">${esc(txt('pill-' + c.id))}</div>
        <p><strong>${esc(txt('txt-' + c.id + '-frac'))}</strong> mantenimientos reprogramados</p>
        <p class="muted">Meta: menor o igual a 10%</p>
      </section>`;
    }).join('');

    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Indicadores MPP</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; padding: 24px; }
  .membrete { display: grid; grid-template-columns: 28mm 1fr auto; align-items: center; gap: 4mm; padding-bottom: 3mm; border-bottom: 2px solid #374151; margin-bottom: 5mm; }
  .membrete img { display: block; width: 26mm; height: 18mm; object-fit: contain; }
  .empresa strong, .empresa span, .documento strong, .documento span { display: block; }
  .empresa strong { color: #12317f; font-size: 18pt; line-height: 1.2; }
  .empresa span { margin-top: 1.5mm; color: #4b5563; font-size: 9pt; }
  .documento { padding-left: 5mm; border-left: 1px solid #9ca3af; text-align: right; }
  .documento strong { color: #12317f; font-size: 10pt; letter-spacing: .5px; }
  .documento span { margin-top: 1mm; font-size: 9pt; font-weight: 700; }
  header.titulo { border-bottom: 4px solid #0f172a; padding-bottom: 14px; margin-bottom: 22px; }
  .eyebrow { margin: 0; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #475569; }
  h1 { margin: 4px 0 12px; font-size: 26px; }
  .fecha { display: inline-block; background: #0f172a; color: #fff; padding: 10px 18px; border-radius: 8px; font-size: 22px; font-weight: 700; }
  .hora { margin-left: 10px; font-size: 14px; color: #475569; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .card { border: 2px solid #cbd5e1; border-radius: 10px; padding: 16px; break-inside: avoid; }
  .card:last-child { grid-column: 1 / -1; }
  .top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  h2 { margin: 0; font-size: 17px; }
  .badge { font-size: 12px; border: 1px solid #94a3b8; border-radius: 99px; padding: 2px 10px; color: #334155; }
  .pct { font-size: 52px; font-weight: 800; margin-top: 10px; line-height: 1.1; }
  .estado { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
  p { margin: 4px 0; font-size: 14px; }
  .muted { color: #64748b; font-size: 12px; }
  footer { margin-top: 24px; font-size: 11px; color: #64748b; text-align: right; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body>
  <header class="membrete">
    <img src="${logo}" alt="Logotipo de Metalúrgica Vera S.A.E.">
    <div class="empresa"><strong>Metalúrgica Vera S.A.E.</strong><span>Confiabilidad, disponibilidad y eficiencia de los equipos e instalaciones industriales.</span></div>
    <div class="documento"><strong>GESTIÓN OPERATIVA</strong><span>INDICADORES MPP</span></div>
  </header>
  <header class="titulo">
    <p class="eyebrow">Mediciones e indicadores</p>
    <h1>Indicadores de Mantenimiento Preventivo</h1>
    <span class="fecha">${esc(fechaLarga())}</span><span class="hora">${hora} hs</span>
  </header>
  <div class="grid">${tarjetas}</div>
  <footer>Emitido el ${esc(fechaLarga())} · ${hora} hs</footer>
</body></html>`;
  }

  function crearModal() {
    const dlg = document.createElement('dialog');
    dlg.id = 'previewIndicadores';
    dlg.innerHTML = `
      <div class="preview-bar">
        <strong>Vista previa de impresión</strong>
        <div>
          <button type="button" class="preview-btn primary" id="previewImprimir">Imprimir</button>
          <button type="button" class="preview-btn" id="previewCerrar">Cerrar</button>
        </div>
      </div>
      <iframe id="previewFrame" title="Vista previa de indicadores"></iframe>`;
    document.body.appendChild(dlg);
    dlg.querySelector('#previewCerrar').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.querySelector('#previewImprimir').addEventListener('click', () => {
      const w = dlg.querySelector('#previewFrame').contentWindow;
      w.focus();
      w.print();
    });
    return dlg;
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btnImprimirIndicadores')) return;
    const dlg = document.getElementById('previewIndicadores') || crearModal();
    dlg.querySelector('#previewFrame').srcdoc = construirHtml();
    if (!dlg.open) dlg.showModal();
  });
})();
