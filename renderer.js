// ESCUCHAR ERRORES CRÍTICOS DEL MOTOR DE PUPPETEER DESDE EL BACKEND
if (window.api && typeof window.api.recibirErrorMotor === 'function') {
  window.api.recibirErrorMotor((mensajeError) => {
    console.error('Fallo en el backend:', mensajeError);
    mostrarNotificacion('Error del Motor: ' + mensajeError, 'error');
  });
}

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sublicolor Renderer inicializado (Arquitectura 100% LocalStorage)');

  // Cargar tablas iniciales desde LocalStorage y activar pestaña Inicio por defecto
  cargarPerfiles();
  cargarUsuarios();
  switchTab('inicio');
});

/**
 * LÓGICA DE LECTURA DE PERFILES DESDE LOCALSTORAGE
 */
function obtenerPerfilesLocales() {
  const dataRaw = localStorage.getItem('sublicolor_perfiles');
  if (!dataRaw) {
    const iniciales = [
      {
        id: 'prf_001',
        nombre: 'Perfil Alpha',
        grupo: 'Marketing / VIP',
        startUrl: 'https://facebook.com',
        proxy: '192.168.1.100:8080',
        cookies: '',
        canvas: true,
        webgl: true,
        estado: 'Activo',
        ultimoAcceso: 'Hace 5 min'
      },
      {
        id: 'prf_002',
        nombre: 'Perfil Beta',
        grupo: 'Desarrollo',
        startUrl: 'https://google.com',
        proxy: 'Direct Connection',
        cookies: '',
        canvas: true,
        webgl: true,
        estado: 'Inactivo',
        ultimoAcceso: 'Ayer'
      }
    ];
    localStorage.setItem('sublicolor_perfiles', JSON.stringify(iniciales));
    return iniciales;
  }

  try {
    return JSON.parse(dataRaw) || [];
  } catch (e) {
    console.error('Error al parsear sublicolor_perfiles desde localStorage:', e);
    return [];
  }
}

/**
 * GESTIÓN DE USUARIOS / CLIENTES EN LOCALSTORAGE
 */
function obtenerUsuariosLocales() {
  const dataRaw = localStorage.getItem('sublicolor_usuarios');
  if (!dataRaw) {
    const iniciales = [
      {
        id: 'usr_001',
        usuario: 'admin',
        correoFantasma: 'admin@sublicolor.online',
        password: '••••••••'
      },
      {
        id: 'usr_002',
        usuario: 'juanperez',
        correoFantasma: 'juanperez@sublicolor.online',
        password: '••••••••'
      }
    ];
    localStorage.setItem('sublicolor_usuarios', JSON.stringify(iniciales));
    return iniciales;
  }

  try {
    return JSON.parse(dataRaw) || [];
  } catch (e) {
    console.error('Error al parsear sublicolor_usuarios desde localStorage:', e);
    return [];
  }
}

/**
 * ACTUALIZACIÓN DE MÉTRICAS DEL DASHBOARD
 */
function actualizarEstadisticasDashboard() {
  const perfiles = obtenerPerfilesLocales();
  const usuarios = obtenerUsuariosLocales();

  const totalPerfiles = perfiles.length;
  const perfilesActivos = perfiles.filter(p => p.estado === 'Activo' || !p.estado).length;
  const totalClientes = usuarios.length;

  const elTotalP = document.getElementById('stat-total-perfiles');
  const elActivosP = document.getElementById('stat-perfiles-activos');
  const elTotalC = document.getElementById('stat-total-clientes');

  if (elTotalP) elTotalP.innerText = totalPerfiles;
  if (elActivosP) elActivosP.innerText = perfilesActivos;
  if (elTotalC) elTotalC.innerText = totalClientes;
}

/**
 * SISTEMA GLOBAL DE NOTIFICACIONES (Toasts)
 */
function mostrarNotificacion(mensaje, tipo = 'exito') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;

  const iconText = tipo === 'exito' ? '✓' : '✕';
  const titleText = tipo === 'exito' ? 'Operación Exitosa' : 'Error de Sistema';

  toast.innerHTML = `
    <span class="toast-icon">${iconText}</span>
    <div class="toast-content">
      <span class="toast-title">${titleText}</span>
      <span class="toast-message">${escapeHtml(mensaje)}</span>
    </div>
    <button class="toast-close" onclick="cerrarToast(this)">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    cerrarToastEl(toast);
  }, 5000);
}

function cerrarToast(btnEl) {
  const toast = btnEl.closest('.toast');
  if (toast) cerrarToastEl(toast);
}

function cerrarToastEl(toastEl) {
  if (toastEl && toastEl.parentElement) {
    toastEl.classList.add('fade-out');
    setTimeout(() => {
      if (toastEl.parentElement) {
        toastEl.remove();
      }
    }, 300);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * LÓGICA DE NAVEGACIÓN Y LOGIN
 */
async function handleLogin(e) {
  if (e) e.preventDefault();

  const usuarioInput = document.getElementById('login-usuario');
  const usuarioRaw = (usuarioInput && usuarioInput.value.trim()) ? usuarioInput.value.trim() : 'Administrador';

  mostrarNotificacion(`Bienvenido, ${usuarioRaw}`, 'exito');

  const userDisplayName = document.getElementById('user-display-name');
  if (userDisplayName) {
    userDisplayName.innerText = usuarioRaw;
  }
  const topUserName = document.getElementById('top-user-name');
  if (topUserName) {
    topUserName.innerText = usuarioRaw;
  }

  mostrarVista('vista-panel');
  switchTab('inicio');
}

/**
 * GESTIÓN DE MODAL DE PERFILES
 */
function crearNuevoPerfil() {
  const modal = document.getElementById('modal-nuevo-perfil');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function cerrarModalPerfil() {
  const modal = document.getElementById('modal-nuevo-perfil');
  if (modal) {
    modal.style.display = 'none';
  }
  const form = document.getElementById('form-nuevo-perfil');
  if (form) {
    form.reset();
  }
}

async function guardarPerfil(e) {
  if (e) e.preventDefault();

  const nombreInput = document.getElementById('modal-perfil-nombre');
  const grupoInput = document.getElementById('modal-perfil-grupo');
  const etiquetasInput = document.getElementById('modal-perfil-etiquetas');
  const startUrlInput = document.getElementById('modal-perfil-start-url');
  const proxyInput = document.getElementById('modal-perfil-proxy');
  const cookiesInput = document.getElementById('modal-perfil-cookies');

  // Checkboxes de Camuflaje
  const userAgentInput = document.getElementById('modal-perfil-useragent');
  const canvasInput = document.getElementById('modal-perfil-canvas');
  const webglInput = document.getElementById('modal-perfil-webgl');
  const hardwareInput = document.getElementById('modal-perfil-hardware');

  const nombre = nombreInput ? nombreInput.value.trim() : '';
  const grupo = grupoInput ? grupoInput.value.trim() : '';
  const etiquetasRaw = etiquetasInput ? etiquetasInput.value.trim() : '';
  const etiquetas = etiquetasRaw ? etiquetasRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const startUrl = startUrlInput ? startUrlInput.value.trim() : '';
  const proxy = (proxyInput && proxyInput.value.trim()) ? proxyInput.value.trim() : 'Direct Connection';
  const cookies = cookiesInput ? cookiesInput.value.trim() : '';

  const camuflaje = {
    userAgent: userAgentInput ? userAgentInput.checked : true,
    canvas: canvasInput ? canvasInput.checked : true,
    webgl: webglInput ? webglInput.checked : true,
    hardware: hardwareInput ? hardwareInput.checked : true
  };

  if (!nombre) {
    mostrarNotificacion('El Nombre del perfil es requerido.', 'error');
    return;
  }

  const id = 'prf_' + Date.now();

  const nuevoPerfil = {
    id,
    nombre,
    grupo: grupo || 'General',
    etiquetas,
    startUrl,
    proxy,
    cookies,
    camuflaje,
    estado: 'Activo',
    ultimoAcceso: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const perfiles = obtenerPerfilesLocales();
  perfiles.push(nuevoPerfil);

  localStorage.setItem('sublicolor_perfiles', JSON.stringify(perfiles));

  mostrarNotificacion('Perfil guardado exitosamente en LocalStorage', 'exito');
  cerrarModalPerfil();
  cargarPerfiles();
  actualizarEstadisticasDashboard();
}

/**
 * RECARGA Y FILTRADO DE LA TABLA DE PERFILES
 */
function renderFilaPerfil(p) {
  const etiquetasHtml = (p.etiquetas && p.etiquetas.length > 0)
    ? `<br>${p.etiquetas.map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('')}`
    : '';

  return `
    <tr>
      <td><code>${escapeHtml(p.id)}</code></td>
      <td>
        <strong>${escapeHtml(p.nombre)}</strong>
        ${p.grupo ? `<br><small style="color: var(--texto-muted);">${escapeHtml(p.grupo)}</small>` : ''}
        ${etiquetasHtml}
      </td>
      <td>${escapeHtml(p.proxy || 'Direct Connection')}</td>
      <td><span class="badge ${p.estado === 'Activo' ? 'badge-active' : 'badge-idle'}">${escapeHtml(p.estado || 'Activo')}</span></td>
      <td>${escapeHtml(p.ultimoAcceso || 'Ahora')}</td>
      <td>
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirPerfil('${p.id}')">Abrir</button>
      </td>
    </tr>
  `;
}

async function cargarPerfiles() {
  const tbody = document.getElementById('tabla-perfiles-body');
  if (!tbody) return;

  const perfiles = obtenerPerfilesLocales();

  if (perfiles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--texto-muted); padding: 24px;">
          No hay perfiles guardados. Haz clic en <strong>+ Nuevo Perfil</strong> para crear uno.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = perfiles.map(renderFilaPerfil).join('');
}

function filtrarPerfiles(query) {
  const term = (query || '').toLowerCase().trim();
  const tbody = document.getElementById('tabla-perfiles-body');
  if (!tbody) return;

  const perfiles = obtenerPerfilesLocales();
  const filtrados = perfiles.filter(p => 
    (p.nombre || '').toLowerCase().includes(term) ||
    (p.grupo || '').toLowerCase().includes(term) ||
    (p.proxy || '').toLowerCase().includes(term) ||
    (p.id || '').toLowerCase().includes(term) ||
    (p.etiquetas && p.etiquetas.some(t => t.toLowerCase().includes(term)))
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--texto-muted); padding: 24px;">
          No se encontraron perfiles que coincidan con "${escapeHtml(query)}".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtrados.map(renderFilaPerfil).join('');
}

function abrirPerfil(idPerfil) {
  const perfiles = JSON.parse(localStorage.getItem('sublicolor_perfiles')) || [];
  const perfil = perfiles.find(p => String(p.id) === String(idPerfil));
  
  if (!perfil) {
    return mostrarNotificacion('Error: Perfil no encontrado en la memoria local.', 'error');
  }

  console.log('Preparando motor Antidetect para:', perfil);
  mostrarNotificacion(`Iniciando entorno aislado: ${perfil.nombre}...`, 'exito');

  // Enviar señal IPC al backend de Electron
  if (window.api && typeof window.api.lanzarPerfil === 'function') {
    window.api.lanzarPerfil(perfil);
  }
}

/**
 * GESTIÓN DE MODAL Y LÓGICA DE CLIENTES (SIN CORREOS FANTASMA)
 */
function crearNuevoCliente() {
  const modal = document.getElementById('modal-nuevo-cliente');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function cerrarModalCliente() {
  const modal = document.getElementById('modal-nuevo-cliente');
  if (modal) {
    modal.style.display = 'none';
  }
  const form = document.getElementById('form-nuevo-cliente');
  if (form) {
    form.reset();
  }
}

async function guardarCliente(e) {
  if (e) e.preventDefault();

  const usuarioInput = document.getElementById('modal-cliente-usuario');
  const passwordInput = document.getElementById('modal-cliente-password');

  const usuarioRaw = usuarioInput ? usuarioInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!usuarioRaw) {
    mostrarNotificacion('El Nombre de Usuario es requerido.', 'error');
    return;
  }

  if (!password) {
    mostrarNotificacion('La Contraseña es requerida.', 'error');
    return;
  }

  const id = 'usr_' + Date.now();

  const nuevoCliente = {
    id,
    usuario: usuarioRaw,
    password: password
  };

  const usuarios = obtenerUsuariosLocales();
  usuarios.push(nuevoCliente);

  localStorage.setItem('sublicolor_usuarios', JSON.stringify(usuarios));

  mostrarNotificacion('Cliente creado exitosamente', 'exito');
  cerrarModalCliente();
  cargarUsuarios();
  actualizarEstadisticasDashboard();
}

async function cargarUsuarios() {
  const tbody = document.getElementById('tabla-usuarios-body');
  if (!tbody) return;

  const usuarios = obtenerUsuariosLocales();

  if (usuarios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; color: var(--texto-muted); padding: 24px;">
          No hay clientes registrados. Haz clic en <strong>+ Nuevo Cliente</strong> para crear uno.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = usuarios.map(u => `
    <tr>
      <td><strong>${escapeHtml(u.usuario)}</strong></td>
      <td>${escapeHtml(u.password)}</td>
      <td>
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; color: var(--toast-error-text); border-color: rgba(239,68,68,0.3);" onclick="eliminarCliente('${u.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function eliminarCliente(idUsuario) {
  const usuarios = obtenerUsuariosLocales().filter(u => String(u.id) !== String(idUsuario));
  localStorage.setItem('sublicolor_usuarios', JSON.stringify(usuarios));
  mostrarNotificacion('Cliente eliminado correctamente.', 'exito');
  cargarUsuarios();
  actualizarEstadisticasDashboard();
}

/**
 * ESTRUCTURA DE VISTAS Y NAVEGACIÓN ENTRE PESTAÑAS
 */
function mostrarVista(vistaId) {
  const vistas = document.querySelectorAll('.vista');
  vistas.forEach(v => {
    if (v.id === vistaId) {
      v.classList.remove('hidden');
      v.classList.add('active');
    } else {
      v.classList.add('hidden');
      v.classList.remove('active');
    }
  });
}

function handleLogout() {
  const usuarioInput = document.getElementById('login-usuario');
  const passwordInput = document.getElementById('login-password');
  if (usuarioInput) usuarioInput.value = '';
  if (passwordInput) passwordInput.value = '';

  mostrarNotificacion('Sesión cerrada correctamente.', 'exito');
  mostrarVista('vista-login');
}

function switchTab(tabName) {
  const items = document.querySelectorAll('.nav-item');
  items.forEach(i => i.classList.remove('active'));
  
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }

  // Ocultar todas las secciones de pestañas
  const sections = document.querySelectorAll('.tab-section');
  sections.forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
  });

  const titleEl = document.getElementById('page-title');
  const actionBtn = document.getElementById('btn-header-action');

  if (tabName === 'inicio') {
    if (titleEl) titleEl.innerText = 'Dashboard / Inicio';
    if (actionBtn) actionBtn.style.display = 'none';
    const sec = document.getElementById('section-inicio');
    if (sec) { sec.classList.remove('hidden'); sec.classList.add('active'); }
    actualizarEstadisticasDashboard();
  } else if (tabName === 'perfiles') {
    if (titleEl) titleEl.innerText = 'Gestión de Perfiles Multicuenta';
    if (actionBtn) {
      actionBtn.innerText = '+ Nuevo Perfil';
      actionBtn.onclick = crearNuevoPerfil;
      actionBtn.style.display = 'inline-block';
    }
    const sec = document.getElementById('section-perfiles');
    if (sec) { sec.classList.remove('hidden'); sec.classList.add('active'); }
    cargarPerfiles();
  } else if (tabName === 'usuarios') {
    if (titleEl) titleEl.innerText = 'Gestión de Usuarios / Clientes';
    if (actionBtn) {
      actionBtn.innerText = '+ Nuevo Cliente';
      actionBtn.onclick = crearNuevoCliente;
      actionBtn.style.display = 'inline-block';
    }
    const sec = document.getElementById('section-usuarios');
    if (sec) { sec.classList.remove('hidden'); sec.classList.add('active'); }
    cargarUsuarios();
  } else if (tabName === 'cuentas') {
    if (titleEl) titleEl.innerText = 'Cuentas Vinculadas';
    if (actionBtn) actionBtn.style.display = 'none';
    const sec = document.getElementById('section-cuentas');
    if (sec) { sec.classList.remove('hidden'); sec.classList.add('active'); }
  } else if (tabName === 'configuracion') {
    if (titleEl) titleEl.innerText = 'Configuración de Sistema';
    if (actionBtn) actionBtn.style.display = 'none';
    const sec = document.getElementById('section-configuracion');
    if (sec) { sec.classList.remove('hidden'); sec.classList.add('active'); }
  }
}

// ==========================================
// EXPOSICIÓN AL ÁMBITO GLOBAL (window)
// ==========================================
window.mostrarNotificacion = mostrarNotificacion;
window.cerrarToast = cerrarToast;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.mostrarVista = mostrarVista;
window.switchTab = switchTab;
window.crearNuevoPerfil = crearNuevoPerfil;
window.cerrarModalPerfil = cerrarModalPerfil;
window.guardarPerfil = guardarPerfil;
window.cargarPerfiles = cargarPerfiles;
window.filtrarPerfiles = filtrarPerfiles;
window.obtenerPerfilesLocales = obtenerPerfilesLocales;
window.actualizarEstadisticasDashboard = actualizarEstadisticasDashboard;
window.abrirPerfil = abrirPerfil;

window.crearNuevoCliente = crearNuevoCliente;
window.cerrarModalCliente = cerrarModalCliente;
window.actualizarPreviewGhost = actualizarPreviewGhost;
window.guardarCliente = guardarCliente;
window.cargarUsuarios = cargarUsuarios;
window.obtenerUsuariosLocales = obtenerUsuariosLocales;
window.eliminarCliente = eliminarCliente;
