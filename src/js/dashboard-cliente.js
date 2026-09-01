// ==========================================
//   SUBLICOLOR - CONTROLADOR MODO CLIENTE COMPACTO CON FILTROS & FIJADO
// ==========================================

let busquedaClienteQuery = '';
let grupoSeleccionadoCliente = 'Todos';

function obtenerPerfilesFijadosCliente() {
  try {
    return JSON.parse(localStorage.getItem('sublicolor_fijados_cliente')) || [];
  } catch (e) {
    return [];
  }
}

function fijarPerfil(idPerfil) {
  const fijados = obtenerPerfilesFijadosCliente();
  const index = fijados.indexOf(String(idPerfil));

  if (index >= 0) {
    fijados.splice(index, 1);
    mostrarNotificacion('Perfil desanclado de la parte superior', 'exito');
  } else {
    fijados.push(String(idPerfil));
    mostrarNotificacion('📌 Perfil fijado en la parte superior', 'exito');
  }

  localStorage.setItem('sublicolor_fijados_cliente', JSON.stringify(fijados));
  cargarDashboardCliente();
}

function toggleMenu(btnElement) {
  const container = btnElement.closest('.menu-opciones-tarjeta');
  if (!container) return;
  const dropdown = container.querySelector('.dropdown-opciones');

  // Cerrar todos los demás menús desplegables abiertos
  document.querySelectorAll('.dropdown-opciones').forEach(d => {
    if (d !== dropdown) d.classList.add('oculto');
  });

  if (dropdown) {
    dropdown.classList.toggle('oculto');
  }
}

// Escuchador global para cerrar menús desplegables al hacer clic en el cuerpo de la página
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-opciones-tarjeta')) {
    document.querySelectorAll('.dropdown-opciones').forEach(d => d.classList.add('oculto'));
  }
});

function renderFiltrosCliente(perfilesAsignados) {
  const containerFiltros = document.getElementById('filtros-cliente');
  if (!containerFiltros) return;

  const gruposUnicos = ['Todos', ...new Set(perfilesAsignados.map(p => p.grupo || 'General').filter(Boolean))];

  containerFiltros.innerHTML = gruposUnicos.map(grupo => {
    const esActivo = grupo === grupoSeleccionadoCliente ? 'activo' : '';
    return `<button type="button" class="chip-filtro ${esActivo}" onclick="filtrarPorGrupoCliente('${escapeHtml(grupo)}')">${escapeHtml(grupo)}</button>`;
  }).join('');
}

function filtrarPorGrupoCliente(grupo) {
  grupoSeleccionadoCliente = grupo;
  cargarDashboardCliente();
}

function actualizarInfoSuscripcionCliente() {
  const elemNombre = document.getElementById('nombre-cliente-actual');
  const elemPlan = document.getElementById('plan-cliente-actual');
  const elemFecha = document.getElementById('fecha-vence-cliente');
  const elemBadgeDias = document.getElementById('dias-restantes-cliente');

  const sesion = window.usuarioSesion || { usuario: 'Cliente' };
  if (elemNombre) elemNombre.innerText = sesion.usuario || 'Cliente';

  const usuarios = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];
  const usuarioObj = usuarios.find(u => u.usuario === sesion.usuario) || usuarios[0] || {};

  if (elemPlan) elemPlan.innerText = usuarioObj.plan || (sesion.rol === 'admin' ? 'Enterprise' : 'Basic');

  const fechaVenceStr = usuarioObj.fechaVencimiento || sesion.fechaVencimiento || '2026-12-31T23:59';
  let fechaFmt = 'Sin registrar';
  let diasRestantes = 30;

  try {
    const fechaVence = new Date(fechaVenceStr);
    if (!isNaN(fechaVence.getTime())) {
      fechaFmt = fechaVence.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
      const diffTime = fechaVence - new Date();
      diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  } catch (err) {}

  if (elemFecha) elemFecha.innerText = fechaFmt;

  if (elemBadgeDias) {
    if (diasRestantes <= 3) {
      elemBadgeDias.innerText = `⏳ Quedan ${diasRestantes} días`;
      elemBadgeDias.className = 'badge-dias';
    } else {
      elemBadgeDias.innerText = `✅ Quedan ${diasRestantes} días`;
      elemBadgeDias.className = 'badge-dias badge-ok';
    }
  }

  if (typeof window.actualizarWidgetSuscripcionSidebar === 'function') {
    window.actualizarWidgetSuscripcionSidebar();
  }
}

function cargarDashboardCliente() {
  actualizarInfoSuscripcionCliente();

  if (typeof window.actualizarCampanitaNotificaciones === 'function') {
    window.actualizarCampanitaNotificaciones();
  }

  const container = document.getElementById('grid-tarjetas-cliente');
  if (!container) return;

  const sesion = window.usuarioSesion || { rol: 'cliente', usuario: 'Cliente', gruposPermitidos: [] };

  const saludoNombre = document.getElementById('saludo-cliente-nombre');
  if (saludoNombre) {
    saludoNombre.innerText = `¡Bienvenido, ${escapeHtml(sesion.usuario)}!`;
  }
  const bannerNombre = document.getElementById('nombre-cliente-banner');
  if (bannerNombre) {
    bannerNombre.innerText = escapeHtml(sesion.usuario);
  }

  const perfiles = typeof window.obtenerPerfilesLocales === 'function' ? window.obtenerPerfilesLocales() : [];

  let asignados = perfiles;
  if (sesion.rol === 'cliente' && Array.isArray(sesion.gruposPermitidos) && sesion.gruposPermitidos.length > 0) {
    asignados = perfiles.filter(p => sesion.gruposPermitidos.includes(p.grupo));
  }

  renderFiltrosCliente(asignados);

  let filtrados = asignados.filter(p => {
    const coincideBusqueda = (p.nombre || '').toLowerCase().includes(busquedaClienteQuery) ||
                             (p.grupo || '').toLowerCase().includes(busquedaClienteQuery);
    const coincideGrupo = (grupoSeleccionadoCliente === 'Todos' || (p.grupo || 'General') === grupoSeleccionadoCliente);
    return coincideBusqueda && coincideGrupo;
  });

  const fijados = obtenerPerfilesFijadosCliente();

  // Ordenar perfiles fijados primero
  filtrados.sort((a, b) => {
    const aFijado = fijados.includes(String(a.id));
    const bFijado = fijados.includes(String(b.id));
    if (aFijado && !bFijado) return -1;
    if (!aFijado && bFijado) return 1;
    return 0;
  });

  if (filtrados.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; background-color: var(--bg-card); border: 1px dashed var(--border-light); border-radius: 16px; padding: 40px; text-align: center;">
        <span style="font-size: 32px; display: block; margin-bottom: 8px;">🎭</span>
        <h4 style="font-size: 15px; font-weight: 700; color: var(--text-main);">No hay perfiles disponibles</h4>
        <p style="font-size: 12.5px; color: var(--text-muted); margin-top: 4px;">Ajusta tus filtros o contacta al soporte.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtrados.map((p, idx) => {
    const esFijado = fijados.includes(String(p.id));
    const avatarUrl = (p.logoUrl && p.logoUrl !== 'default') 
      ? p.logoUrl 
      : (p.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre)}&background=0D8ABC&color=fff&rounded=true`);

    let claseEstado = 'estado-activo';
    let textoEstado = 'Activo';
    const op = (p.estadoOperativo || '').toLowerCase();

    if (op === 'mantenimiento') {
      claseEstado = 'estado-mantenimiento';
      textoEstado = 'En Mantenimiento';
    } else if (op === 'nuevo') {
      claseEstado = 'estado-nuevo';
      textoEstado = 'Recién Lanzado';
    } else if (op === 'caido') {
      claseEstado = 'estado-caido';
      textoEstado = 'Inhabilitado';
    }

    const estaBloqueado = (op === 'mantenimiento' || op === 'caido');
    const atributoDisabled = estaBloqueado ? 'disabled style="background: #94a3b8 !important; cursor: not-allowed !important; box-shadow: none !important; opacity: 0.75;"' : '';
    const textoBoton = estaBloqueado ? '🔒 Servicio Suspendido' : '▶️ ABRIR CUENTA';

    const numFormateado = String(idx + 1).padStart(2, '0');
    const observacionTexto = p.observacion || p.comentario || 'Acceso privado y seguro.';

    return `
      <div class="tarjeta-perfil-cliente ${esFijado ? 'fijado' : ''}" data-grupo="${escapeHtml(p.grupo || 'General')}">
        <div class="cabecera-tarjeta-cliente">
          <div class="info-principal-cabecera">
            <img src="${avatarUrl}" alt="Logo" class="icono-servicio" />
            <div class="info-tarjeta-cliente">
              <h4 title="${escapeHtml(p.nombre)}">
                <span class="numero-perfil">#${numFormateado}</span> ${escapeHtml(p.nombre)}
              </h4>
              <span class="badge-estado ${claseEstado}">${textoEstado}</span>
            </div>
          </div>

          <div class="menu-opciones-tarjeta">
            <button type="button" class="btn-tres-puntos" onclick="toggleMenu(this)" title="Opciones">⋮</button>
            <div class="dropdown-opciones oculto">
              <button type="button" onclick="fijarPerfil('${p.id}')">
                ${esFijado ? '📍 Desanclar perfil' : '📌 Fijar al inicio'}
              </button>
            </div>
          </div>
        </div>

        <div class="observacion-cliente">
          <p>${escapeHtml(observacionTexto)}</p>
        </div>

        <button type="button" class="btn-abrir-compacto" onclick="lanzarBrowserCliente('${p.id}')" ${atributoDisabled}>
          ${textoBoton}
        </button>
      </div>
    `;
  }).join('');
}

function abrirModalSoporteCliente() {
  const modal = document.getElementById('modal-soporte-cliente');
  const selectCuentas = document.getElementById('soporte-cuenta-afectada');
  if (modal) modal.style.display = 'flex';

  if (selectCuentas) {
    const perfiles = typeof window.obtenerPerfilesLocales === 'function' ? window.obtenerPerfilesLocales() : [];
    const sesion = window.usuarioSesion || { rol: 'cliente', gruposPermitidos: [] };
    let asignados = perfiles;
    if (sesion.rol === 'cliente' && Array.isArray(sesion.gruposPermitidos) && sesion.gruposPermitidos.length > 0) {
      asignados = perfiles.filter(p => sesion.gruposPermitidos.includes(p.grupo));
    }

    let opts = '<option value="General / Consulta">General / Consulta Técnica</option>';
    asignados.forEach(p => {
      opts += `<option value="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)} (${escapeHtml(p.grupo || 'General')})</option>`;
    });
    selectCuentas.innerHTML = opts;
  }
}

function cerrarModalSoporteCliente() {
  const modal = document.getElementById('modal-soporte-cliente');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('form-soporte-cliente');
  if (form) form.reset();
}

function enviarTicketSoporte(e) {
  if (e) e.preventDefault();

  const selectCuenta = document.getElementById('soporte-cuenta-afectada');
  const textareaMsg = document.getElementById('soporte-mensaje');

  const cuenta = selectCuenta ? selectCuenta.value : 'General';
  const mensaje = textareaMsg ? textareaMsg.value.trim() : '';

  if (!mensaje) {
    mostrarNotificacion('Ingresa una descripción del problema.', 'error');
    return;
  }

  const sesion = window.usuarioSesion || { usuario: 'Cliente' };
  const tickets = JSON.parse(localStorage.getItem('sublicolor_tickets')) || [];

  const nuevoTicket = {
    id: 'tkt_' + Date.now(),
    usuario: sesion.usuario || 'Cliente',
    cuenta,
    mensaje,
    estado: 'Abierto',
    fecha: new Date().toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  };

  tickets.unshift(nuevoTicket);
  localStorage.setItem('sublicolor_tickets', JSON.stringify(tickets));

  mostrarNotificacion('🎧 Ticket de soporte enviado correctamente. El equipo técnico lo revisará.', 'exito');
  cerrarModalSoporteCliente();

  if (typeof window.cargarTicketsAdmin === 'function') {
    window.cargarTicketsAdmin();
  }
}

function filtrarDashboardCliente(query) {
  busquedaClienteQuery = (query || '').toLowerCase().trim();
  cargarDashboardCliente();
}

function lanzarBrowserCliente(idPerfil) {
  if (typeof window.abrirPerfil === 'function') {
    window.abrirPerfil(idPerfil);
  } else {
    mostrarNotificacion('Error al abrir el perfil.', 'error');
  }
}

// Exposiciones globales
window.cargarDashboardCliente = cargarDashboardCliente;
window.actualizarInfoSuscripcionCliente = actualizarInfoSuscripcionCliente;
window.filtrarDashboardCliente = filtrarDashboardCliente;
window.filtrarPorGrupoCliente = filtrarPorGrupoCliente;
window.fijarPerfil = fijarPerfil;
window.toggleMenu = toggleMenu;
window.lanzarBrowserCliente = lanzarBrowserCliente;
window.abrirModalSoporteCliente = abrirModalSoporteCliente;
window.cerrarModalSoporteCliente = cerrarModalSoporteCliente;
window.enviarTicketSoporte = enviarTicketSoporte;
