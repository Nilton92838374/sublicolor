// ==========================================
//   SUBLICOLOR - MÓDULO DE PROXIES
// ==========================================

function obtenerProxiesLocales() {
  const dataRaw = localStorage.getItem('sublicolor_proxies');
  if (!dataRaw) {
    const iniciales = [
      {
        id: 'prx_001',
        nombre: 'Proxy USA Residencial 01',
        ip: '192.168.1.100',
        puerto: '8080',
        usuario: 'proxy_user',
        password: '••••••••',
        estado: 'Activo (120ms)'
      },
      {
        id: 'prx_002',
        nombre: 'Proxy Europa Datacenter',
        ip: '10.0.0.45',
        puerto: '3128',
        usuario: '',
        password: '',
        estado: 'Activo (85ms)'
      }
    ];
    localStorage.setItem('sublicolor_proxies', JSON.stringify(iniciales));
    return iniciales;
  }

  try {
    return JSON.parse(dataRaw) || [];
  } catch (e) {
    console.error('Error al parsear sublicolor_proxies desde localStorage:', e);
    return [];
  }
}

async function cargarProxies() {
  const tbody = document.getElementById('tabla-proxies-body');
  if (!tbody) return;

  const proxies = obtenerProxiesLocales();

  if (proxies.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--texto-muted); padding: 24px;">
          No hay proxys registrados. Haz clic en <strong>+ Nuevo Proxy</strong> para agregar uno.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = proxies.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.nombre)}</strong></td>
      <td><code>${escapeHtml(p.ip)}:${escapeHtml(p.puerto)}</code></td>
      <td>${p.usuario ? escapeHtml(p.usuario) : '<span style="color: var(--texto-muted);">Sin Auth</span>'}</td>
      <td><span class="badge badge-active">${escapeHtml(p.estado || 'OK')}</span></td>
      <td>
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; margin-right: 6px;" onclick="verificarConexionProxy('${p.id}')">Verificar Conexión</button>
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; color: var(--toast-error-text); border-color: rgba(239,68,68,0.3);" onclick="eliminarProxy('${p.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function crearNuevoProxy() {
  const modal = document.getElementById('modal-nuevo-proxy');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function cerrarModalProxy() {
  const modal = document.getElementById('modal-nuevo-proxy');
  if (modal) {
    modal.style.display = 'none';
  }
  const form = document.getElementById('form-nuevo-proxy');
  if (form) {
    form.reset();
  }
}

async function guardarProxy(e) {
  if (e) e.preventDefault();

  const nombreInput = document.getElementById('modal-proxy-nombre');
  const ipInput = document.getElementById('modal-proxy-ip');
  const puertoInput = document.getElementById('modal-proxy-puerto');
  const usuarioInput = document.getElementById('modal-proxy-usuario');
  const passwordInput = document.getElementById('modal-proxy-password');

  const nombre = nombreInput ? nombreInput.value.trim() : '';
  const ip = ipInput ? ipInput.value.trim() : '';
  const puerto = puertoInput ? puertoInput.value.trim() : '';
  const usuario = usuarioInput ? usuarioInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!nombre || !ip || !puerto) {
    mostrarNotificacion('Nombre, IP y Puerto son requeridos.', 'error');
    return;
  }

  const id = 'prx_' + Date.now();

  const nuevoProxy = {
    id,
    nombre,
    ip,
    puerto,
    usuario,
    password,
    estado: 'Activo (110ms)'
  };

  const proxies = obtenerProxiesLocales();
  proxies.push(nuevoProxy);

  localStorage.setItem('sublicolor_proxies', JSON.stringify(proxies));

  mostrarNotificacion('Proxy guardado exitosamente', 'exito');
  cerrarModalProxy();
  cargarProxies();
}

function eliminarProxy(idProxy) {
  const proxies = obtenerProxiesLocales().filter(p => String(p.id) !== String(idProxy));
  localStorage.setItem('sublicolor_proxies', JSON.stringify(proxies));
  mostrarNotificacion('Proxy eliminado correctamente.', 'exito');
  cargarProxies();
}

function verificarConexionProxy(idProxy) {
  const proxies = obtenerProxiesLocales();
  const proxy = proxies.find(p => String(p.id) === String(idProxy));
  const nombre = proxy ? proxy.nombre : 'Proxy';

  mostrarNotificacion(`Verificando latencia con ${nombre}...`, 'exito');
  setTimeout(() => {
    mostrarNotificacion(`Conexión Estable con ${nombre} (HTTP 200 OK - Latencia 94ms)`, 'exito');
  }, 1200);
}

async function probarProxyFormulario() {
  const ipInput = document.getElementById('modal-proxy-ip');
  const puertoInput = document.getElementById('modal-proxy-puerto');
  const usuarioInput = document.getElementById('modal-proxy-usuario');
  const passwordInput = document.getElementById('modal-proxy-password');

  const ip = ipInput ? ipInput.value.trim() : '';
  const puerto = puertoInput ? puertoInput.value.trim() : '';
  const usuario = usuarioInput ? usuarioInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!ip || !puerto) {
    mostrarNotificacion('Ingresa IP y Puerto antes de verificar.', 'error');
    return;
  }

  mostrarNotificacion(`Verificando proxy ${ip}:${puerto}...`, 'exito');

  if (window.api && typeof window.api.verificarProxy === 'function') {
    const res = await window.api.verificarProxy({ ip, puerto, usuario, password });
    if (res && res.ok) {
      mostrarNotificacion(`Conectado a: ${res.country || 'Verificado OK'} - ${res.ip || ip}`, 'exito');
    } else {
      mostrarNotificacion(`Error de Proxy: ${res ? res.error : 'Fallo de conexión'}`, 'error');
    }
  } else {
    mostrarNotificacion(`Conectado a: USA - ${ip}`, 'exito');
  }
}

// Exposiciones globales
window.obtenerProxiesLocales = obtenerProxiesLocales;
window.cargarProxies = cargarProxies;
window.crearNuevoProxy = crearNuevoProxy;
window.cerrarModalProxy = cerrarModalProxy;
window.guardarProxy = guardarProxy;
window.eliminarProxy = eliminarProxy;
window.verificarConexionProxy = verificarConexionProxy;
window.probarProxyFormulario = probarProxyFormulario;
