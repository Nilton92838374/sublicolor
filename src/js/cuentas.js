// ==========================================
//   SUBLICOLOR - MÓDULO DE INVENTARIO DE CUENTAS
// ==========================================

function obtenerCuentasLocales() {
  const dataRaw = localStorage.getItem('sublicolor_cuentas');
  if (!dataRaw) {
    const hoy = new Date();
    const expActiva = new Date();
    expActiva.setDate(hoy.getDate() + 25);
    const expVencida = new Date();
    expVencida.setDate(hoy.getDate() - 5);

    const iniciales = [
      {
        id: 'cta_001',
        plataforma: 'Netflix Premium 4K',
        correo: 'netflix_vip@sublicolor.local',
        password: 'PassStream2026!',
        fechaExpiracion: expActiva.toISOString().split('T')[0]
      },
      {
        id: 'cta_002',
        plataforma: 'Canva Pro Enterprise',
        correo: 'design@sublicolor.local',
        password: 'CanvaDesign99#',
        fechaExpiracion: expVencida.toISOString().split('T')[0]
      }
    ];
    localStorage.setItem('sublicolor_cuentas', JSON.stringify(iniciales));
    return iniciales;
  }

  try {
    return JSON.parse(dataRaw) || [];
  } catch (e) {
    console.error('Error al parsear sublicolor_cuentas desde localStorage:', e);
    return [];
  }
}

async function cargarCuentas() {
  const tbody = document.getElementById('tabla-cuentas-body');
  if (!tbody) return;

  const cuentas = obtenerCuentasLocales();

  if (cuentas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--texto-muted); padding: 24px;">
          No hay cuentas registradas en el inventario. Haz clic en <strong>+ Nueva Cuenta</strong> para agregar una.
        </td>
      </tr>
    `;
    return;
  }

  const hoyStr = new Date().toISOString().split('T')[0];

  tbody.innerHTML = cuentas.map(c => {
    const esActiva = !c.fechaExpiracion || c.fechaExpiracion >= hoyStr;
    const badgeEstado = esActiva
      ? `<span class="badge badge-active">Activa</span>`
      : `<span class="badge badge-idle" style="color: #ef4444; border-color: rgba(239,68,68,0.3);">Expirada</span>`;

    return `
      <tr>
        <td><strong>${escapeHtml(c.plataforma)}</strong></td>
        <td><code>${escapeHtml(c.correo)}</code></td>
        <td><code>${escapeHtml(c.password)}</code></td>
        <td>${escapeHtml(c.fechaExpiracion || 'Sin límite')}</td>
        <td>${badgeEstado}</td>
        <td>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; margin-right: 6px;" onclick="editarCuenta('${c.id}')">Editar</button>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; color: var(--toast-error-text); border-color: rgba(239,68,68,0.3);" onclick="eliminarCuenta('${c.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function filtrarCuentas(query) {
  const term = (query || '').toLowerCase().trim();
  const tbody = document.getElementById('tabla-cuentas-body');
  if (!tbody) return;

  const cuentas = obtenerCuentasLocales();
  const filtradas = cuentas.filter(c => 
    (c.plataforma || '').toLowerCase().includes(term) ||
    (c.correo || '').toLowerCase().includes(term)
  );

  if (filtradas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--texto-muted); padding: 24px;">
          No se encontraron cuentas coincidentes.
        </td>
      </tr>
    `;
    return;
  }

  const hoyStr = new Date().toISOString().split('T')[0];

  tbody.innerHTML = filtradas.map(c => {
    const esActiva = !c.fechaExpiracion || c.fechaExpiracion >= hoyStr;
    const badgeEstado = esActiva
      ? `<span class="badge badge-active">Activa</span>`
      : `<span class="badge badge-idle" style="color: #ef4444; border-color: rgba(239,68,68,0.3);">Expirada</span>`;

    return `
      <tr>
        <td><strong>${escapeHtml(c.plataforma)}</strong></td>
        <td><code>${escapeHtml(c.correo)}</code></td>
        <td><code>${escapeHtml(c.password)}</code></td>
        <td>${escapeHtml(c.fechaExpiracion || 'Sin límite')}</td>
        <td>${badgeEstado}</td>
        <td>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; margin-right: 6px;" onclick="editarCuenta('${c.id}')">Editar</button>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; color: var(--toast-error-text); border-color: rgba(239,68,68,0.3);" onclick="eliminarCuenta('${c.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function crearNuevaCuenta() {
  const inputId = document.getElementById('modal-cuenta-id');
  const titulo = document.getElementById('modal-cuenta-titulo');
  if (inputId) inputId.value = '';
  if (titulo) titulo.innerText = 'Registrar Nueva Cuenta';

  const modal = document.getElementById('modal-nueva-cuenta');
  if (modal) modal.style.display = 'flex';
}

function editarCuenta(idCuenta) {
  const cuentas = obtenerCuentasLocales();
  const cuenta = cuentas.find(c => String(c.id) === String(idCuenta));
  if (!cuenta) return;

  const inputId = document.getElementById('modal-cuenta-id');
  const inputPlataforma = document.getElementById('modal-cuenta-plataforma');
  const inputCorreo = document.getElementById('modal-cuenta-correo');
  const inputPassword = document.getElementById('modal-cuenta-password');
  const inputExpiracion = document.getElementById('modal-cuenta-expiracion');
  const titulo = document.getElementById('modal-cuenta-titulo');

  if (inputId) inputId.value = cuenta.id;
  if (inputPlataforma) inputPlataforma.value = cuenta.plataforma;
  if (inputCorreo) inputCorreo.value = cuenta.correo;
  if (inputPassword) inputPassword.value = cuenta.password;
  if (inputExpiracion) inputExpiracion.value = cuenta.fechaExpiracion || '';
  if (titulo) titulo.innerText = `Editar Cuenta: ${cuenta.plataforma}`;

  const modal = document.getElementById('modal-nueva-cuenta');
  if (modal) modal.style.display = 'flex';
}

function cerrarModalCuenta() {
  const modal = document.getElementById('modal-nueva-cuenta');
  if (modal) modal.style.display = 'none';

  const form = document.getElementById('form-nueva-cuenta');
  if (form) form.reset();

  const inputId = document.getElementById('modal-cuenta-id');
  if (inputId) inputId.value = '';
}

async function guardarCuenta(e) {
  if (e) e.preventDefault();

  const inputId = document.getElementById('modal-cuenta-id');
  const plataformaInput = document.getElementById('modal-cuenta-plataforma');
  const correoInput = document.getElementById('modal-cuenta-correo');
  const passwordInput = document.getElementById('modal-cuenta-password');
  const expiracionInput = document.getElementById('modal-cuenta-expiracion');

  const idExistente = inputId ? inputId.value.trim() : '';
  const plataforma = plataformaInput ? plataformaInput.value.trim() : '';
  const correo = correoInput ? correoInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const fechaExpiracion = expiracionInput ? expiracionInput.value : '';

  if (!plataforma || !correo || !password) {
    mostrarNotificacion('Plataforma, Correo y Contraseña son requeridos.', 'error');
    return;
  }

  const cuentas = obtenerCuentasLocales();

  if (idExistente) {
    const idx = cuentas.findIndex(c => String(c.id) === String(idExistente));
    if (idx !== -1) {
      cuentas[idx] = {
        ...cuentas[idx],
        plataforma,
        correo,
        password,
        fechaExpiracion
      };
      mostrarNotificacion('Cuenta actualizada exitosamente', 'exito');
    }
  } else {
    const id = 'cta_' + Date.now();
    const nuevaCuenta = {
      id,
      plataforma,
      correo,
      password,
      fechaExpiracion
    };
    cuentas.push(nuevaCuenta);
    mostrarNotificacion('Cuenta agregada al inventario', 'exito');
  }

  localStorage.setItem('sublicolor_cuentas', JSON.stringify(cuentas));
  cerrarModalCuenta();
  cargarCuentas();
}

function eliminarCuenta(idCuenta) {
  const cuentas = obtenerCuentasLocales().filter(c => String(c.id) !== String(idCuenta));
  localStorage.setItem('sublicolor_cuentas', JSON.stringify(cuentas));
  mostrarNotificacion('Cuenta eliminada del inventario.', 'exito');
  cargarCuentas();
}

// Exposiciones globales
window.obtenerCuentasLocales = obtenerCuentasLocales;
window.cargarCuentas = cargarCuentas;
window.filtrarCuentas = filtrarCuentas;
window.crearNuevaCuenta = crearNuevaCuenta;
window.editarCuenta = editarCuenta;
window.cerrarModalCuenta = cerrarModalCuenta;
window.guardarCuenta = guardarCuenta;
window.eliminarCuenta = eliminarCuenta;
