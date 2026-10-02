/* ===== CONFIGURACIÓN: editá esta parte ===== */
const txt = (name, max, required) => ({ name, type: "text", max, required });
const fec = (name, required) => ({ name, type: "date", required });
const dec = (name, p, s, required, defecto) => ({ name, type: "decimal", dec: [p, s], required, defecto });

const CONFIG = {
  batchSize: 500,            // filas por POST
  enteros: "redondear",      // "redondear" o "truncar" cuando llega un decimal a un campo INT
  armarBody: rows => ({ rows }),   // cuerpo del POST de inserción
  tablas: {
    mantenimientos: {
      nombre: "mantenimientos_preventivos",
      insertUrl: "/api/mantenimientos-preventivos/bulk",
      truncate: false,
      columnas: [
        txt("maquina_equipo", 150, true),
        txt("codigo", 30, true),
        txt("sector", 100),
        fec("programacion_inicio", true),
        txt("tipo_activo", 100)
      ]
    },
    inventario: {
      nombre: "inventario",
      insertUrl: "/api/inventario/bulk",
      truncateUrl: "/api/inventario/truncate",
      truncate: true,
      columnas: [
        { name: "Codigo", type: "text", max: 50, required: true, clave: true },
        { ...txt("Producto", 255), header: "Descripción de Producto" }, txt("UM", 20),
        dec("Unidades", 18, 2), { ...dec("StockF9", 18, 2), header: "Stock F9" },
        { ...dec("CantidadFisica", 18, 2), header: "Cantidad Física" },
        { ...txt("Ubicacion", 100), header: "Ubicación" }
      ]
    }
  }
};
/* ============================================ */

const $ = id => document.getElementById(id);
const p2 = n => String(n).padStart(2, "0");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const state = { rows: [], malas: 0, faltan: [], data: null };
const destinoId = new URLSearchParams(window.location.search).get("tabla");
const destino = Object.prototype.hasOwnProperty.call(CONFIG.tablas, destinoId) ? CONFIG.tablas[destinoId] : null;
const tabla = () => destino;
const inventoryAdminRequired = Boolean(destino?.truncate && localStorage.getItem('role') !== 'administrador');

if (inventoryAdminRequired) {
  $("destino").textContent = "La carga completa de inventario requiere una cuenta administrador.";
  $("destino").className = "bad";
  $("file-section").hidden = true;
  $("res").hidden = true;
} else if (destinoId === "mantenimientos" && destino) {
  $("destino").textContent = "Mantenimientos preventivos. Agrega filas sin borrar los datos existentes.";
} else if (destinoId === "inventario" && destino) {
  $("destino").textContent = "Inventario. Vacía la tabla antes de volver a cargarla completa.";
} else {
  $("destino").textContent = "Destino no válido. Abrí esta página desde el módulo de mantenimiento preventivo o inventario.";
  $("destino").className = "bad";
  $("file-section").hidden = true;
}

$("campos-detalle").hidden = !destino || inventoryAdminRequired;
if (destino && !inventoryAdminRequired) {
  const lista = document.createElement("ul");
  destino.columnas.forEach(c => {
    const item = document.createElement("li");
    const regla = c.defecto !== undefined
      ? ` (usa ${c.defecto} si queda vacío)`
      : c.required ? " (obligatorio)" : " (opcional)";
    item.textContent = (c.header || c.name) + regla;
    lista.append(item);
  });
  $("campos").replaceChildren(lista);
}

/* --- Selección de archivo --- */
$("file").addEventListener("change", e => e.target.files[0] && leer(e.target.files[0]));
const drop = $("drop");
["dragover", "dragenter"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("on"); }));
["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("on"); }));
drop.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; if (f) leer(f); });
$("skip").addEventListener("change", actualizar);

async function leer(f) {
  $("fname").textContent = f.name + " (leyendo...)";
  await new Promise(r => setTimeout(r, 30));
  try {
    const wb = XLSX.read(await f.arrayBuffer(), { type: "array", cellDates: true });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: "", blankrows: false });
    procesar(data);
    $("fname").textContent = f.name;
  } catch (err) {
    $("fname").textContent = "No se pudo leer el archivo: " + err.message;
  }
}

/* --- Conversión de valores --- */
const norm = s => String(s).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");

function aNumero(v) {
  if (typeof v === "number") return v;
  let s = String(v).replace(/[\s\u00a0]/g, "");
  if (s === "") return NaN;
  const c = s.lastIndexOf(","), d = s.lastIndexOf(".");
  if (c > -1 && d > -1) s = c > d ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (c > -1) s = s.replace(",", ".");
  return Number(s);
}

function convertir(v, c) {
  const vacio = { err: "campo obligatorio vacío" };
  if (v === "" || v == null || (typeof v === "string" && v.trim() === "")) {
    if (c.defecto !== undefined) return { v: c.defecto };
    return c.required ? vacio : { v: null };
  }
  if (c.type === "text") {
    const s = String(v).trim();
    if (!s) return c.required ? vacio : { v: null };
    return c.max && s.length > c.max ? { err: `supera los ${c.max} caracteres` } : { v: s };
  }
  if (c.type === "date") {
    if (v instanceof Date && !isNaN(v)) return { v: `${v.getFullYear()}-${p2(v.getMonth() + 1)}-${p2(v.getDate())}` };
    const s = String(v).trim(), m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (m) return { v: `${m[3]}-${p2(m[2])}-${p2(m[1])}` };
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { v: s };
    return { err: `fecha no válida (${s})` };
  }
  let n = aNumero(v), adj = 0;
  if (Number.isNaN(n)) return { err: `"${v}" no es un número` };
  if (c.type === "int" && !Number.isInteger(n)) { n = CONFIG.enteros === "truncar" ? Math.trunc(n) : Math.round(n); adj = 1; }
  if (c.type === "decimal") {
    const [p, sc] = c.dec;
    n = Math.round(n * 10 ** sc) / 10 ** sc;
    if (Math.abs(n) >= 10 ** (p - sc)) return { err: `${n} excede el rango del campo (${p},${sc})` };
  }
  if ((c.min !== undefined && n < c.min) || (c.max !== undefined && n > c.max)) return { err: `${n} fuera de rango` };
  return { v: n, adj };
}

/* --- Validación contra la plantilla --- */
function procesar(data) {
  if (!destino) return;
  state.data = data;
  const T = tabla(), cols = T.columnas, h0 = data[0] || [];
  const head = h0.map(norm);
  const idx = cols.map(c => head.indexOf(norm(c.header || c.name)));
  const faltan = cols.filter((c, i) => idx[i] < 0).map(c => c.header || c.name);
  const sobran = h0.filter(h => h !== "" && !cols.some(c => norm(c.header || c.name) === norm(h)));
  const vistos = cols.map(c => c.clave ? new Set() : null);
  const rows = [], errores = [];
  let malas = 0, ajust = 0;

  if (!faltan.length) {
    for (let r = 1; r < data.length; r++) {
      const o = {}; let mala = false;
      cols.forEach((c, i) => {
        const res = convertir(data[r][idx[i]], c);
        let err = res.err;
        if (!err && vistos[i]) {
          if (vistos[i].has(res.v)) err = `"${res.v}" está repetido en el archivo`;
          else vistos[i].add(res.v);
        }
        if (err) { mala = true; if (errores.length < 200) errores.push(`Fila ${r + 1}, ${c.header || c.name}: ${err}`); }
        if (res.adj) ajust++;
        if (c.enviar !== false) o[c.name] = res.v;
      });
      mala ? malas++ : rows.push(o);
    }
  }
  Object.assign(state, { rows, malas, faltan });

  $("res").hidden = false;
  $("stats").innerHTML =
    `<div><b>${Math.max(data.length - 1, 0)}</b><span>filas leídas</span></div>` +
    `<div><b class="ok">${rows.length}</b><span>filas listas</span></div>` +
    `<div><b class="${malas ? "bad" : ""}">${malas}</b><span>con errores</span></div>` +
    `<div><b>${ajust}</b><span>decimales ajustados en campos enteros</span></div>`;

  let m = `<p>Destino: <b>${esc(T.nombre)}</b></p>`;
  if (T.truncate) m += `<p class="warn">Al cargar se vaciará la tabla ${esc(T.nombre)} antes de insertar.</p>`;
  if (faltan.length) m += `<p class="bad">El archivo no coincide con la plantilla. Faltan las columnas: ${esc(faltan.join(", "))}.<br>
    Encabezados esperados: ${esc(cols.map(c => c.header || c.name).join(", "))}.</p>`;
  if (sobran.length) m += `<p class="warn">Se ignoran columnas que no están en la plantilla: ${esc(sobran.join(", "))}.</p>`;
  if (errores.length) m += `<p class="bad">Errores encontrados:</p><ul>${errores.slice(0, 20).map(e => `<li>${esc(e)}</li>`).join("")}</ul>` +
    (malas > 20 ? `<p>Y ${malas - 20} filas más con errores.</p>` : "");
  $("msgs").innerHTML = m;
  $("skiprow").hidden = !malas || !!faltan.length;
  $("skip").checked = false;
  $("prog").hidden = true; $("log").textContent = ""; $("bar").value = 0;
  actualizar();
}

function actualizar() {
  $("go").disabled = !!state.faltan.length || !state.rows.length || (state.malas > 0 && !$("skip").checked);
}

/* --- Envío a la API --- */
async function api(path, body, masterKey) {
  const headers = { "Content-Type": "application/json" };
  if (masterKey) headers["X-Master-Password"] = masterKey;
  const r = await API_FETCH(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {})
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
}

function pedirClaveMaestra() {
  return new Promise(resolve => {
    const modal = $("masterKeyModal"), form = $("masterKeyForm"), input = $("masterKey");
    const message = $("masterKeyMensaje");
    const closeButton = $("closeMasterKeyModal"), cancelButton = $("cancelMasterKey");
    const finish = value => {
      modal.classList.remove("is-visible");
      modal.setAttribute("aria-hidden", "true");
      form.removeEventListener("submit", onSubmit);
      closeButton.removeEventListener("click", onCancel);
      cancelButton.removeEventListener("click", onCancel);
      input.value = "";
      resolve(value);
    };
    const onSubmit = event => {
      event.preventDefault();
      if (!input.value.trim()) {
        message.textContent = "La clave maestra es obligatoria.";
        return;
      }
      finish(input.value);
    };
    const onCancel = () => finish(null);

    message.textContent = "";
    input.value = "";
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
    form.addEventListener("submit", onSubmit);
    closeButton.addEventListener("click", onCancel);
    cancelButton.addEventListener("click", onCancel);
    input.focus();
  });
}
const log = t => { const l = $("log"); l.textContent += t + "\n"; l.scrollTop = l.scrollHeight; };
const espera = ms => new Promise(r => setTimeout(r, ms));

async function enviar(T, lote) {
  for (let t = 1; ; t++) {
    try { return await api(T.insertUrl, CONFIG.armarBody(lote)); }
    catch (e) { if (t >= 3) throw e; log(`Reintentando lote (${t}/2)...`); await espera(1000 * t); }
  }
}

$("go").addEventListener("click", async () => {
  const T = tabla(), rows = state.rows;
  if (T.truncate && !await window.siteDialog.confirm(`Se vaciará la tabla ${T.nombre} y se cargarán ${rows.length} filas. ¿Continuar?`)) return;
  const masterKey = T.truncate ? await pedirClaveMaestra() : null;
  if (T.truncate && !masterKey) return;
  $("go").disabled = true; $("prog").hidden = false; $("log").textContent = ""; $("bar").value = 0;
  let hechas = 0;
  try {
    if (T.truncate) { log("Vaciando tabla..."); await api(T.truncateUrl, {}, masterKey); log("Tabla vaciada."); }
    for (let i = 0; i < rows.length; i += CONFIG.batchSize) {
      const lote = rows.slice(i, i + CONFIG.batchSize);
      await enviar(T, lote);
      hechas += lote.length;
      $("bar").value = hechas / rows.length * 100;
      $("pct").textContent = `${hechas} de ${rows.length} filas`;
    }
    log(`Carga terminada: ${hechas} filas insertadas.`);
  } catch (e) {
    log(`ERROR: ${e.message}\nSe insertaron ${hechas} filas antes de fallar.`);
    $("go").disabled = false;
  }
});
