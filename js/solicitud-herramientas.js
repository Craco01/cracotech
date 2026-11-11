const HORAS_ANTICIPACION = 10;
const modoReprogramar = new URLSearchParams(window.location.search).get("modo") === "reprogramar";
const fechaNecesidad = document.getElementById(modoReprogramar ? "fechaNecesidadNueva" : "fechaNecesidad");
const fechaNecesidadVista = document.getElementById(modoReprogramar ? "fechaNecesidadNuevaVista" : "fechaNecesidadVista");
const modalSeleccionFecha = document.getElementById("modalSeleccionFecha");
const mesCalendario = document.getElementById("mesCalendario");
const diasCalendario = document.getElementById("diasCalendario");
const opcionesHora = document.getElementById("opcionesHora");
const opcionesMinuto = document.getElementById("opcionesMinuto");
const errorSeleccionFecha = document.getElementById("errorSeleccionFecha");
const mensajeError = document.getElementById(modoReprogramar ? "mensajeErrorReprogramacion" : "mensajeError");
const formulario = document.getElementById("formSolicitud");
const tabla = document.querySelector("#tablaHerramientas tbody");
const btnAgregar = document.getElementById("btnAgregar");
const btnEnviar = document.getElementById("btnEnviar");
const modalSolicitudCreada = document.getElementById("modalSolicitudCreada");
const formReprogramarPedido = document.getElementById("formReprogramarPedido");
const pedidoReprogramar = document.getElementById("pedidoReprogramar");
const fechaNecesidadNueva = fechaNecesidad;
const motivoReprogramacion = document.getElementById("motivoReprogramacion");
const mensajeErrorReprogramacion = document.getElementById("mensajeErrorReprogramacion");
const btnReprogramarPedido = document.getElementById("btnReprogramarPedido");
let claveReprogramacionPendiente = null;
let claveSolicitudPendiente = null;
let fechaSeleccionada = "";
let fechaMesMostrado = null;
let horaSeleccionada = "";
let minutoSeleccionado = "";

window.addEventListener("DOMContentLoaded", () => {
    if (modoReprogramar) {
        document.title = "Reprogramar pedido | Herramientas";
        document.querySelector(".header h1").textContent = "Reprogramar pedido";
        document.querySelector(".header p").textContent = "Selecciona un pedido activo, indica la nueva fecha de necesidad y explica el motivo.";
        formulario.querySelectorAll(":scope > .card:not(#formReprogramarPedido), :scope > .actions").forEach(element => {
            element.hidden = true;
            element.querySelectorAll("input, select, textarea, button").forEach(control => { control.disabled = true; });
        });
        formReprogramarPedido.hidden = false;
        configurarFechaMinima();
        actualizarAccesoReprogramacion();
        return;
    }
    configurarFechaMinima();
    agregarFilaHerramienta();
});

document.addEventListener("herramientas:auth-change", () => {
    if (modoReprogramar) actualizarAccesoReprogramacion();
});

function actualizarAccesoReprogramacion() {
    const rol = sessionStorage.getItem(AUTH_ROLE_KEY);
    const controles = formReprogramarPedido.querySelectorAll("input, select, textarea, button");
    if (rol === "observador") {
        controles.forEach(control => { control.disabled = true; });
        mostrarErrorReprogramacion("Tu perfil de observador no tiene permiso para reprogramar pedidos.");
        return;
    }

    controles.forEach(control => { control.disabled = false; });
    if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) {
        pedidoReprogramar.replaceChildren(new Option("Inicia sesión para cargar pedidos", ""));
        mostrarErrorReprogramacion("Inicia sesión con un perfil solicitante, gestor o administrador.");
        return;
    }
    mostrarErrorReprogramacion("");
    cargarPedidosReprogramables();
}

function mostrarErrorReprogramacion(texto, tipo = "error") {
    mensajeErrorReprogramacion.textContent = texto;
    mensajeErrorReprogramacion.className = tipo;
}

async function cargarPedidosReprogramables() {
    pedidoReprogramar.replaceChildren(new Option("Cargando pedidos...", ""));
    try {
        const response = await API_FETCH("/api/pedidos/reprogramables");
        const pedidos = await response.json();
        if (!response.ok) throw new Error(pedidos.error || "No se pudieron cargar los pedidos.");

        pedidoReprogramar.replaceChildren(new Option("Selecciona un pedido", ""));
        for (const pedido of pedidos) {
            const fecha = pedido.fecha_necesidad
                ? new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "short" })
                    .format(new Date(String(pedido.fecha_necesidad).replace(" ", "T")))
                : "Sin fecha";
            const opcion = new Option(
                `Pedido ${pedido.id} · OT ${pedido.ot_obra} · ${pedido.nombre_obra || "Obra sin nombre"} · Puntero: ${pedido.puntero_asignado} · Necesidad: ${fecha}`,
                String(pedido.id)
            );
            pedidoReprogramar.add(opcion);
        }
        if (!pedidos.length) {
            pedidoReprogramar.replaceChildren(new Option("No hay pedidos activos para reprogramar", ""));
        }
    } catch (error) {
        pedidoReprogramar.replaceChildren(new Option("No se pudieron cargar los pedidos", ""));
        mostrarErrorReprogramacion(error.message || "No se pudieron cargar los pedidos.");
    }
}

function ventanaDelDia(fecha) {
    const dia = fecha.getDay();
    if (dia === 0) return null;
    return [7 * 60, (dia === 6 ? 12 : 17) * 60];
}

function horasHabilesEntre(desde, hasta) {
    if (hasta <= desde) return 0;

    let minutos = 0;
    const dia = new Date(desde);
    dia.setHours(0, 0, 0, 0);

    while (dia < hasta) {
        const ventana = ventanaDelDia(dia);
        if (ventana) {
            const inicio = new Date(dia.getTime() + ventana[0] * 60000);
            const fin = new Date(dia.getTime() + ventana[1] * 60000);
            const desdeVentana = Math.max(inicio, desde);
            const hastaVentana = Math.min(fin, hasta);
            if (hastaVentana > desdeVentana) minutos += (hastaVentana - desdeVentana) / 60000;
        }
        dia.setDate(dia.getDate() + 1);
    }

    return minutos / 60;
}

function sumarHorasHabiles(desde, horas) {
    let restante = horas * 60;
    const dia = new Date(desde);
    dia.setHours(0, 0, 0, 0);

    while (true) {
        const ventana = ventanaDelDia(dia);
        if (ventana) {
            const inicio = Math.max(dia.getTime() + ventana[0] * 60000, desde.getTime());
            const fin = dia.getTime() + ventana[1] * 60000;
            const disponible = (fin - inicio) / 60000;
            if (disponible > 0) {
                if (disponible >= restante) return new Date(inicio + restante * 60000);
                restante -= disponible;
            }
        }
        dia.setDate(dia.getDate() + 1);
    }
}

function dentroDeHorario(fecha) {
    const dia = fecha.getDay();
    const minutos = fecha.getHours() * 60 + fecha.getMinutes();
    if (dia === 0) return false;
    const cierre = dia === 6 ? 12 * 60 : 17 * 60;
    return minutos >= 7 * 60 && minutos <= cierre;
}

function configurarFechaMinima() {
    const minimo = sumarHorasHabiles(new Date(), HORAS_ANTICIPACION);
    const minutoValido = Math.ceil(minimo.getMinutes() / 30) * 30;
    if (minutoValido === 60) {
        minimo.setHours(minimo.getHours() + 1, 0, 0, 0);
    } else {
        minimo.setMinutes(minutoValido, 0, 0);
    }

    const predeterminada = new Date(minimo);
    predeterminada.setHours(7, 0, 0, 0);
    while (predeterminada < minimo || predeterminada.getDay() === 0) {
        predeterminada.setDate(predeterminada.getDate() + 1);
        predeterminada.setHours(7, 0, 0, 0);
    }

    const dosDigitos = numero => String(numero).padStart(2, "0");
    const formatoFecha = fecha =>
        `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}` +
        `T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
    fechaNecesidad.min = formatoFecha(minimo);
    fechaNecesidad.value = formatoFecha(predeterminada);
    actualizarFechaVisible();
}

function actualizarFechaVisible() {
    if (!fechaNecesidad.value) {
        fechaNecesidadVista.value = "";
        return;
    }

    const [fecha, hora] = fechaNecesidad.value.split("T");
    const [anio, mes, dia] = fecha.split("-");
    fechaNecesidadVista.value = `${dia}/${mes}/${anio} ${hora}`;
}

function abrirSelectorFecha() {
    fechaSeleccionada = fechaNecesidad.value.slice(0, 10);
    const [hora, minuto] = fechaNecesidad.value.slice(11, 16).split(":");
    const [anio, mes] = fechaSeleccionada.split("-").map(Number);
    fechaMesMostrado = new Date(anio, mes - 1, 1);
    errorSeleccionFecha.textContent = "";
    errorSeleccionFecha.hidden = true;
    renderizarCalendario();
    actualizarOpcionesHora(hora, minuto);
    modalSeleccionFecha.show();
    posicionarSelectorFecha();
    diasCalendario.querySelector('[aria-pressed="true"]')?.focus();
}

function posicionarSelectorFecha() {
    const campo = fechaNecesidadVista.getBoundingClientRect();
    const margen = 12;
    const ancho = modalSeleccionFecha.offsetWidth;
    const alto = modalSeleccionFecha.offsetHeight;
    const izquierda = Math.max(margen, Math.min(campo.left, window.innerWidth - ancho - margen));
    const debajo = campo.bottom + 8;
    const arriba = debajo + alto <= window.innerHeight - margen
        ? debajo
        : Math.max(margen, campo.top - alto - 8);

    modalSeleccionFecha.style.left = `${izquierda}px`;
    modalSeleccionFecha.style.top = `${arriba}px`;
}

function renderizarCalendario() {
    const anio = fechaMesMostrado.getFullYear();
    const mes = fechaMesMostrado.getMonth();
    mesCalendario.textContent = new Intl.DateTimeFormat("es", {
        month: "long",
        year: "numeric"
    }).format(fechaMesMostrado);
    diasCalendario.replaceChildren();

    const primerDia = new Date(anio, mes, 1);
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const cantidadDias = new Date(anio, mes + 1, 0).getDate();
    const minimo = fechaNecesidad.min.slice(0, 10);

    for (let espacio = 0; espacio < desplazamiento; espacio += 1) {
        const vacio = document.createElement("span");
        vacio.className = "selector-calendario-vacio";
        diasCalendario.appendChild(vacio);
    }

    for (let dia = 1; dia <= cantidadDias; dia += 1) {
        const fecha = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
        const boton = document.createElement("button");
        const esDomingo = new Date(anio, mes, dia).getDay() === 0;
        boton.type = "button";
        boton.className = "selector-calendario-dia";
        boton.textContent = String(dia);
        boton.setAttribute("aria-label", new Intl.DateTimeFormat("es", {
            dateStyle: "full"
        }).format(new Date(anio, mes, dia)));
        boton.setAttribute("aria-pressed", String(fecha === fechaSeleccionada));
        boton.disabled = fecha < minimo || esDomingo;
        boton.addEventListener("click", () => {
            fechaSeleccionada = fecha;
            renderizarCalendario();
            actualizarOpcionesHora(horaSeleccionada, minutoSeleccionado);
            diasCalendario.querySelector('[aria-pressed="true"]')?.focus();
        });
        diasCalendario.appendChild(boton);
    }

    const primerMes = new Date(Number(minimo.slice(0, 4)), Number(minimo.slice(5, 7)) - 1, 1);
    document.getElementById("mesAnterior").disabled =
        anio < primerMes.getFullYear() ||
        (anio === primerMes.getFullYear() && mes <= primerMes.getMonth());
}

function cambiarMesCalendario(cantidad) {
    fechaMesMostrado.setMonth(fechaMesMostrado.getMonth() + cantidad);
    renderizarCalendario();
}

function actualizarOpcionesHora(horaActual = "", minutoActual = "") {
    const dia = new Date(`${fechaSeleccionada}T12:00`).getDay();
    const ultimaHora = dia === 6 ? 12 : 17;
    const minimo = fechaSeleccionada === fechaNecesidad.min.slice(0, 10)
        ? fechaNecesidad.min.slice(11, 16)
        : "07:00";
    const [horaMinima, minutoMinimo] = minimo.split(":").map(Number);

    opcionesHora.replaceChildren();
    opcionesMinuto.replaceChildren();
    if (dia === 0) {
        horaSeleccionada = "";
        minutoSeleccionado = "";
        return;
    }

    const horasDisponibles = [];
    for (let hora = 7; hora <= ultimaHora; hora += 1) {
        const minutosValidos = [0, 30].filter(minuto =>
            (hora > horaMinima || (hora === horaMinima && minuto >= minutoMinimo)) &&
            !(hora === ultimaHora && minuto > 0)
        );
        if (minutosValidos.length) horasDisponibles.push(String(hora).padStart(2, "0"));
    }

    if (!horasDisponibles.length) {
        horaSeleccionada = "";
        minutoSeleccionado = "";
        return;
    }

    horaSeleccionada = horasDisponibles.includes(horaActual)
        ? horaActual
        : horasDisponibles[0];
    for (const valor of horasDisponibles) {
        agregarBotonOpcion(opcionesHora, valor, valor === horaSeleccionada, () => {
            horaSeleccionada = valor;
            actualizarOpcionesHora(horaSeleccionada, minutoSeleccionado);
        });
    }
    actualizarOpcionesMinuto(minutoActual);
}

function actualizarOpcionesMinuto(minutoActual = "") {
    const hora = Number(horaSeleccionada);
    const dia = new Date(`${fechaSeleccionada}T12:00`).getDay();
    const ultimaHora = dia === 6 ? 12 : 17;
    const minimo = fechaSeleccionada === fechaNecesidad.min.slice(0, 10)
        ? fechaNecesidad.min.slice(11, 16)
        : "07:00";
    const [horaMinima, minutoMinimo] = minimo.split(":").map(Number);

    const minutosDisponibles = [];
    for (const minuto of [0, 30]) {
        if (hora < horaMinima || (hora === horaMinima && minuto < minutoMinimo)) continue;
        if (hora === ultimaHora && minuto > 0) continue;
        minutosDisponibles.push(String(minuto).padStart(2, "0"));
    }

    minutoSeleccionado = minutosDisponibles.includes(minutoActual)
        ? minutoActual
        : minutosDisponibles[0] || "";
    opcionesMinuto.replaceChildren();
    for (const valor of minutosDisponibles) {
        agregarBotonOpcion(opcionesMinuto, valor, valor === minutoSeleccionado, () => {
            minutoSeleccionado = valor;
            actualizarOpcionesMinuto(minutoSeleccionado);
        });
    }
}

function agregarBotonOpcion(contenedor, valor, seleccionado, alSeleccionar) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "selector-hora-opcion";
    boton.textContent = valor;
    boton.setAttribute("aria-pressed", String(seleccionado));
    boton.addEventListener("click", alSeleccionar);
    contenedor.appendChild(boton);
}

function mostrarErrorFecha(texto) {
    mensajeError.textContent = texto;
    mensajeError.className = "error";
    fechaNecesidad.classList.add("input-error");
    return false;
}

function obtenerErrorFecha(valor) {
    if (!valor) return "Seleccione la fecha de necesidad.";
    const seleccionada = new Date(valor);
    if (horasHabilesEntre(new Date(), seleccionada) < HORAS_ANTICIPACION) {
        return `La fecha de necesidad debe tener al menos ${HORAS_ANTICIPACION} horas hábiles de anticipación.`;
    }

    if (seleccionada.getMinutes() % 30 !== 0) {
        return "Los minutos permitidos son 00 o 30.";
    }

    if (!dentroDeHorario(seleccionada)) {
        return "Horario no permitido. Solo se puede fijar de lunes a viernes de 07:00 a 17:00 y sábados de 07:00 a 12:00.";
    }

    return null;
}

function validarFecha() {
    const error = obtenerErrorFecha(fechaNecesidad.value);
    if (error) return mostrarErrorFecha(error);

    mensajeError.textContent = "";
    mensajeError.className = "";
    fechaNecesidad.classList.remove("input-error");
    return true;
}

function agregarFilaHerramienta() {
    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td data-label="Herramienta">
            <input type="text" placeholder="Ej: Taladro percutor 13 mm"
                aria-label="Nombre de la herramienta" required>
        </td>
        <td data-label="Cantidad">
            <input type="number" min="1" value="1" aria-label="Cantidad"
                placeholder="1" required>
        </td>
        <td data-label="Unidad de medida">
            <input type="text" value="ud." maxlength="50"
                aria-label="Unidad de medida" placeholder="ud.">
        </td>
        <td data-label="Observación">
            <input type="text" placeholder="Ej: con maletín y 2 baterías"
                aria-label="Observación de la herramienta">
        </td>
        <td>
            <button type="button" title="Quitar esta herramienta"
                aria-label="Quitar herramienta" class="btn-danger btnEliminar">X</button>
        </td>
    `;
    tabla.appendChild(fila);
}

fechaNecesidadVista.addEventListener("click", abrirSelectorFecha);
fechaNecesidadVista.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    abrirSelectorFecha();
});
document.getElementById("mesAnterior").addEventListener("click", () => cambiarMesCalendario(-1));
document.getElementById("mesSiguiente").addEventListener("click", () => cambiarMesCalendario(1));
document.getElementById("btnCancelarFecha").addEventListener("click", () => {
    modalSeleccionFecha.close();
});
document.getElementById("btnAceptarFecha").addEventListener("click", () => {
    if (!fechaSeleccionada || !horaSeleccionada || !minutoSeleccionado) {
        errorSeleccionFecha.textContent = "Selecciona la fecha y la hora.";
        errorSeleccionFecha.hidden = false;
        return;
    }

    const nuevoValor =
        `${fechaSeleccionada}T${horaSeleccionada}:${minutoSeleccionado}`;
    const error = obtenerErrorFecha(nuevoValor);
    if (error) {
        errorSeleccionFecha.textContent = error;
        errorSeleccionFecha.hidden = false;
        return;
    }

    fechaNecesidad.value = nuevoValor;
    mensajeError.textContent = "";
    mensajeError.className = "";
    fechaNecesidad.classList.remove("input-error");
    actualizarFechaVisible();
    modalSeleccionFecha.close();
});
document.addEventListener("pointerdown", event => {
    if (!modalSeleccionFecha.open) return;
    if (modalSeleccionFecha.contains(event.target) || fechaNecesidadVista.contains(event.target)) return;
    modalSeleccionFecha.close();
});
document.addEventListener("keydown", event => {
    if (modalSeleccionFecha.open && event.key === "Escape") {
        modalSeleccionFecha.close();
    }
});
btnAgregar.addEventListener("click", agregarFilaHerramienta);
document.getElementById("btnCerrarSolicitudCreada").addEventListener("click", () => {
    modalSolicitudCreada.close();
});
modalSolicitudCreada.addEventListener("close", () => {
    window.location.assign("/herramientas/reporte-herramientas/index.html");
});

tabla.addEventListener("click", event => {
    if (!event.target.classList.contains("btnEliminar")) return;
    if (tabla.querySelectorAll("tr").length === 1) {
        alert("Debe existir al menos una herramienta.");
        return;
    }
    event.target.closest("tr").remove();
});

formulario.addEventListener("reset", () => {
    claveSolicitudPendiente = null;
    mensajeError.textContent = "";
    mensajeError.className = "";
    fechaNecesidad.classList.remove("input-error");
    tabla.replaceChildren();
    agregarFilaHerramienta();
    setTimeout(configurarFechaMinima, 0);
});

formulario.addEventListener("submit", async event => {
    event.preventDefault();
    if (modoReprogramar) {
        if (!pedidoReprogramar.reportValidity()) return;
        const errorFecha = obtenerErrorFecha(fechaNecesidadNueva.value);
        if (errorFecha) {
            mostrarErrorReprogramacion(errorFecha);
            fechaNecesidadVista.focus();
            return;
        }
        if (!motivoReprogramacion.reportValidity()) return;
        if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) {
            mostrarErrorReprogramacion("Inicia sesión para reprogramar el pedido.");
            window.abrirLoginHerramientas?.();
            return;
        }
        const pedidoId = pedidoReprogramar.value;
        if (!pedidoId) {
            mostrarErrorReprogramacion("Selecciona un pedido activo.");
            return;
        }
        if (!claveReprogramacionPendiente) claveReprogramacionPendiente = crypto.randomUUID();
        btnReprogramarPedido.disabled = true;
        mostrarErrorReprogramacion("Guardando la reprogramación...", "success");
        try {
            const response = await API_FETCH(`/api/pedidos/${encodeURIComponent(pedidoId)}/reprogramacion`, {
                method: "POST",
                headers: { ...API_JSON_HEADERS, "Idempotency-Key": claveReprogramacionPendiente },
                body: JSON.stringify({
                    fechaNecesidad: fechaNecesidadNueva.value,
                    motivo: motivoReprogramacion.value.trim()
                })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.errores?.join(" ") || result.error || "No se pudo reprogramar el pedido.");
            claveReprogramacionPendiente = null;
            document.getElementById("tituloSolicitudCreada").textContent = "Pedido reprogramado";
            document.getElementById("mensajeSolicitudCreada").textContent =
                `Se creó el pedido ${result.id} y el pedido ${pedidoId} quedó completado.`;
            modalSolicitudCreada.showModal();
        } catch (error) {
            mostrarErrorReprogramacion(error instanceof TypeError
                ? "No se pudo conectar con el servidor. Verifica la conexión e intenta nuevamente."
                : error.message || "No se pudo reprogramar el pedido.");
        } finally {
            btnReprogramarPedido.disabled = false;
        }
        return;
    }
    if (!validarFecha()) return;

    if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) {
        mensajeError.textContent = "Inicia sesión para enviar la solicitud.";
        mensajeError.className = "error";
        window.abrirLoginHerramientas?.();
        return;
    }

    const herramientas = Array.from(tabla.querySelectorAll("tr"), fila => {
        const campos = fila.querySelectorAll("input");
        return {
            herramienta: campos[0].value.trim(),
            cantidad: Number(campos[1].value),
            unidadMedida: campos[2].value.trim(),
            observacion: campos[3].value.trim()
        };
    });

    const solicitud = {
        ot: document.getElementById("ot").value.trim(),
        nombreObra: document.getElementById("nombreObra").value.trim(),
        puntero: document.getElementById("puntero").value.trim(),
        fechaNecesidad: fechaNecesidad.value,
        tipoSolicitud: document.getElementById("tipoSolicitud").value,
        traslado: document.getElementById("traslado").value,
        observaciones: document.getElementById("observaciones").value.trim(),
        herramientas
    };

    if (!claveSolicitudPendiente) {
        claveSolicitudPendiente = crypto.randomUUID();
    }

    btnEnviar.disabled = true;
    mensajeError.textContent = "Enviando solicitud...";
    mensajeError.className = "success";

    try {
        const response = await API_FETCH("/api/pedidos", {
            method: "POST",
            headers: {
                ...API_JSON_HEADERS,
                "Idempotency-Key": claveSolicitudPendiente
            },
            body: JSON.stringify(solicitud)
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.errores?.join(" ") || result.error || "No se pudo guardar la solicitud.");
        }

        claveSolicitudPendiente = null;
        formulario.reset();
        document.getElementById("mensajeSolicitudCreada").textContent =
            `La solicitud ${result.id} se guardó correctamente.`;
        modalSolicitudCreada.showModal();
    } catch (error) {
        mensajeError.textContent = error instanceof TypeError
            ? "No se pudo conectar con la API local. Verifica que el backend esté iniciado y vuelve a intentar."
            : error.message || "No se pudo guardar la solicitud.";
        mensajeError.className = "error";
    } finally {
        btnEnviar.disabled = false;
    }
});
