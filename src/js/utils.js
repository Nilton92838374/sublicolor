// BLOQUEO ESTRICTO DE MENÚ CONTEXTUAL (CLIC DERECHO -> INSPECCIONAR)
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

// ESCUCHAR ERRORES CRÍTICOS DEL MOTOR DE PUPPETEER DESDE EL BACKEND
if (window.api && typeof window.api.recibirErrorMotor === 'function') {
  window.api.recibirErrorMotor((mensajeError) => {
    console.error('Fallo en el backend:', mensajeError);
    mostrarNotificacion('Error del Motor: ' + mensajeError, 'error');
  });
}

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

function aplicarPermisosUsuarioActivo() {
  const sesion = window.usuarioSesion;
  if (!sesion || sesion.rol === 'cliente') return;

  const permisos = sesion.permisos || ['crear_clientes', 'eliminar_perfiles', 'gestionar_proxies', 'ver_facturacion', 'acceso_configuracion'];

  // Control 1: Acceso a Configuración en Sidebar
  const navConfig = document.querySelector('a[onclick*="configuracion"]');
  if (navConfig) {
    navConfig.style.display = permisos.includes('acceso_configuracion') ? 'flex' : 'none';
  }

  // Control 2: Botón + Nuevo Cliente en sección usuarios
  const btnNuevoCliente = document.getElementById('btn-header-action');
  if (btnNuevoCliente && btnNuevoCliente.innerText.includes('Cliente') && !permisos.includes('crear_clientes')) {
    btnNuevoCliente.style.display = 'none';
  }

  // Control 3: Botones de eliminación en tablas
  if (!permisos.includes('eliminar_perfiles')) {
    const btnsEliminar = document.querySelectorAll('.data-table button[onclick*="eliminarPerfil"]');
    btnsEliminar.forEach(btn => btn.style.display = 'none');
  }
}

async function handleLogin(e) {
  if (e) e.preventDefault();

  const usuarioInput = document.getElementById('login-usuario');
  const passwordInput = document.getElementById('login-password');

  const usuarioRaw = usuarioInput ? usuarioInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  let loginExitoso = false;
  let rolAsignado = 'admin';
  let nombreAsignado = 'Admin Master';

  // 1. Verificación en Staff (Admins & Resellers)
  const staffLocales = typeof window.obtenerStaffLocal === 'function' ? window.obtenerStaffLocal() : [];
  const miembroStaff = staffLocales.find(s => s.usuario.toLowerCase() === usuarioRaw.toLowerCase());

  if (miembroStaff) {
    if (miembroStaff.password && miembroStaff.password !== password) {
      mostrarNotificacion('Contraseña de personal incorrecta.', 'error');
      return;
    }
    if (miembroStaff.estado === 'Inactivo') {
      mostrarNotificacion('Acceso suspendido. Contacta al administrador general.', 'error');
      return;
    }

    rolAsignado = miembroStaff.rol.toLowerCase();
    nombreAsignado = miembroStaff.usuario;
    loginExitoso = true;
  } 
  // 2. Buscar cliente en localStorage.sublicolor_usuarios
  else {
    const usuariosLocales = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];
    const cliente = usuariosLocales.find(u => u.usuario.toLowerCase() === usuarioRaw.toLowerCase());

    if (cliente) {
      if (cliente.password && cliente.password !== password) {
        mostrarNotificacion('Contraseña incorrecta.', 'error');
        return;
      }
      const hoyStr = new Date().toISOString();
      if (cliente.fechaVencimiento && cliente.fechaVencimiento < hoyStr) {
        mostrarNotificacion(`Suscripción vencida el ${cliente.fechaVencimiento.replace('T', ' ')}. Contacta al administrador.`, 'error');
        return;
      }
      rolAsignado = 'cliente';
      nombreAsignado = cliente.usuario;
      loginExitoso = true;
    } else {
      // Admin por defecto
      rolAsignado = 'admin';
      nombreAsignado = usuarioRaw || 'Admin Master';
      loginExitoso = true;
    }
  }

  if (loginExitoso) {
    window.usuarioSesion = {
      rol: rolAsignado,
      usuario: nombreAsignado,
      permisos: ['crear_clientes', 'eliminar_perfiles', 'gestionar_proxies', 'ver_facturacion', 'acceso_configuracion', 'gestionar_equipo']
    };

    localStorage.setItem('sublicolor_sesion_activa', JSON.stringify(window.usuarioSesion));
    localStorage.setItem('sublicolor_usuario_activo', JSON.stringify(window.usuarioSesion));

    mostrarNotificacion(`Bienvenido, ${nombreAsignado}`, 'exito');

    const vistaLogin = document.getElementById('vista-login');
    const vistaPanel = document.getElementById('vista-panel');
    if (vistaLogin && vistaPanel) {
      vistaLogin.classList.add('hidden');
      vistaLogin.classList.remove('active');
      vistaLogin.style.display = 'none';

      vistaPanel.classList.remove('hidden');
      vistaPanel.classList.add('active');
      vistaPanel.style.display = 'flex';
    } else {
      mostrarVista('vista-panel');
    }

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.style.display = rolAsignado === 'cliente' ? 'none' : 'flex';
    }

    if (typeof window.actualizarWidgetSuscripcionSidebar === 'function') {
      window.actualizarWidgetSuscripcionSidebar();
    }

    if (typeof window.cargarVista === 'function') {
      window.cargarVista(rolAsignado === 'cliente' ? 'dashboard_cliente' : 'inicio');
    }
  }
}

function toggleMenuSesion(event) {
  if (event) event.stopPropagation();
  const drop = document.getElementById('dropdown-sesion');
  if (drop) {
    drop.classList.toggle('oculto');
  }
}

function cerrarSesion() {
  const drop = document.getElementById('dropdown-sesion');
  if (drop) drop.classList.add('oculto');
  handleLogout();
}

function handleLogout() {
  const usuarioInput = document.getElementById('login-usuario');
  const passwordInput = document.getElementById('login-password');
  if (usuarioInput) usuarioInput.value = '';
  if (passwordInput) passwordInput.value = '';

  localStorage.removeItem('sublicolor_sesion_activa');
  localStorage.removeItem('sublicolor_usuario_activo');
  window.usuarioSesion = null;

  const drop = document.getElementById('dropdown-sesion');
  if (drop) drop.classList.add('oculto');

  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.style.display = 'flex';

  const selectRol = document.getElementById('select-simulador-rol');
  if (selectRol) selectRol.value = 'admin';

  if (typeof mostrarNotificacion === 'function') {
    mostrarNotificacion('Sesión cerrada correctamente.', 'exito');
  }

  const vistaPanel = document.getElementById('vista-panel');
  const vistaLogin = document.getElementById('vista-login');
  if (vistaPanel && vistaLogin) {
    vistaPanel.classList.add('hidden');
    vistaPanel.classList.remove('active');
    vistaPanel.style.display = 'none';

    vistaLogin.classList.remove('hidden');
    vistaLogin.classList.add('active');
    vistaLogin.style.display = 'flex';
  } else {
    mostrarVista('vista-login');
  }
}

function alternarSimuladorRol(rolTarget) {
  const sidebar = document.querySelector('.sidebar');
  const topUserName = document.getElementById('top-user-name');
  const userDisplayName = document.getElementById('user-display-name');
  const selectRol = document.getElementById('select-simulador-rol');
  const campanita = document.getElementById('contenedor-campanita-topbar');

  if (selectRol) selectRol.value = rolTarget;

  if (rolTarget === 'cliente') {
    window.usuarioSesion = {
      rol: 'cliente',
      usuario: 'Cliente Demo',
      gruposPermitidos: []
    };

    if (sidebar) sidebar.style.display = 'none';
    if (campanita) campanita.style.display = 'inline-flex';
    if (topUserName) topUserName.innerText = 'Cliente Demo (Simulador)';
    if (userDisplayName) userDisplayName.innerText = 'Cliente Demo';

    if (typeof window.actualizarWidgetSuscripcionSidebar === 'function') {
      window.actualizarWidgetSuscripcionSidebar();
    }

    mostrarNotificacion('Simulando Vista de Cliente Minimalista', 'exito');
    if (typeof window.cargarVista === 'function') {
      window.cargarVista('dashboard_cliente');
    }
  } else {
    window.usuarioSesion = {
      rol: 'admin',
      usuario: 'Admin Master',
      permisos: ['crear_clientes', 'eliminar_perfiles', 'gestionar_proxies', 'ver_facturacion', 'acceso_configuracion']
    };

    if (sidebar) sidebar.style.display = 'flex';
    if (campanita) campanita.style.display = 'none';
    if (topUserName) topUserName.innerText = 'Admin Master';
    if (userDisplayName) userDisplayName.innerText = 'Admin Master';

    if (typeof window.actualizarWidgetSuscripcionSidebar === 'function') {
      window.actualizarWidgetSuscripcionSidebar();
    }

    mostrarNotificacion('Simulando Vista de Administrador Completa', 'exito');
    if (typeof window.aplicarPermisosUsuarioActivo === 'function') {
      window.aplicarPermisosUsuarioActivo();
    }
    if (typeof window.cargarVista === 'function') {
      window.cargarVista('inicio');
    }
  }
}

function formatearSoles(monto) {
  const num = parseFloat(monto || 0);
  return 'S/ ' + (isNaN(num) ? '0.00' : num.toFixed(2));
}

function formatearDolares(monto) {
  const num = parseFloat(monto || 0);
  return '$ ' + (isNaN(num) ? '0.00' : num.toFixed(2)) + ' USD';
}

// Escuchador global de errores del motor Puppeteer enviados desde Electron
if (window.api && typeof window.api.recibirErrorMotor === 'function') {
  window.api.recibirErrorMotor((msg) => {
    if (typeof mostrarNotificacion === 'function') {
      mostrarNotificacion('⚠️ Fallo en el motor de navegación: ' + msg, 'error');
    }
  });
}

function renderizarInfoSuscripcion(cliente = null) {
  const sesion = window.usuarioSesion || { usuario: 'Admin Master', rol: 'admin' };
  const usuarios = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];
  const usuarioObj = cliente || usuarios.find(u => u.usuario === sesion.usuario) || {};

  const planDelCliente = usuarioObj.plan || (sesion.rol === 'admin' ? 'Enterprise' : 'Basic');

  // 1. Inyectar en la barra del Dashboard del cliente
  const spanPlanDashboard = document.getElementById('plan-cliente-actual');
  if (spanPlanDashboard) spanPlanDashboard.innerText = planDelCliente;

  const spanPlanDashboardAlt = document.getElementById('nombre-plan-dashboard');
  if (spanPlanDashboardAlt) spanPlanDashboardAlt.innerText = planDelCliente;

  // 2. Inyectar en el Widget del Sidebar
  const spanPlanWidget = document.getElementById('widget-nombre-plan');
  if (spanPlanWidget) spanPlanWidget.innerText = planDelCliente;

  // 3. Inyectar en el Modal
  const spanPlanModal = document.getElementById('detalle-plan');
  if (spanPlanModal) spanPlanModal.innerText = planDelCliente;

  return planDelCliente;
}

function abrirModalMiSuscripcion() {
  const modal = document.getElementById('modal-mi-suscripcion');
  if (modal) modal.style.display = 'flex';

  const sesion = window.usuarioSesion || { usuario: 'Admin Master', rol: 'admin', gruposPermitidos: [] };
  const usuarios = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];
  const usuarioObj = usuarios.find(u => u.usuario === sesion.usuario) || {};

  const planNombre = renderizarInfoSuscripcion(usuarioObj);
  const fechaVenceStr = usuarioObj.fechaVencimiento || '2026-12-01T23:59';
  let fechaFmt = '01/12/2026';

  try {
    const d = new Date(fechaVenceStr);
    if (!isNaN(d.getTime())) {
      fechaFmt = d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch (e) {}

  const elVence = document.getElementById('detalle-vence');
  const elCant = document.getElementById('detalle-cantidad-perfiles');
  const listaUl = document.getElementById('lista-resumen-perfiles');

  if (elVence) elVence.innerText = fechaFmt;

  const perfiles = typeof window.obtenerPerfilesLocales === 'function' ? window.obtenerPerfilesLocales() : [];
  let asignados = perfiles;
  if (sesion.rol === 'cliente' && Array.isArray(sesion.gruposPermitidos) && sesion.gruposPermitidos.length > 0) {
    asignados = perfiles.filter(p => sesion.gruposPermitidos.includes(p.grupo));
  }

  if (elCant) elCant.innerText = asignados.length;

  if (listaUl) {
    if (asignados.length === 0) {
      listaUl.innerHTML = '<li style="font-size: 12px; color: var(--text-muted); padding: 6px 0;">No tienes perfiles asignados.</li>';
    } else {
      listaUl.innerHTML = asignados.map(p => {
        const estOp = p.estadoOperativo || 'activo';
        let badgeEst = '<span class="badge badge-active">🟢 Activo</span>';
        if (estOp === 'mantenimiento') badgeEst = '<span class="badge" style="background: #fef3c7; color: #92400e;">🟠 Mantenimiento</span>';
        if (estOp === 'nuevo') badgeEst = '<span class="badge" style="background: #e0e7ff; color: #3730a3;">✨ Nuevo</span>';
        if (estOp === 'caido') badgeEst = '<span class="badge badge-idle" style="background: #fee2e2; color: #991b1b;">🔴 Caído</span>';

        return `
          <li style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border-light); font-size: 12.5px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 600; color: var(--text-main);">🖥️ ${escapeHtml(p.nombre)}</span>
              <span class="tag-badge">📦 ${escapeHtml(p.grupo || 'General')}</span>
            </div>
            <div>${badgeEst}</div>
          </li>
        `;
      }).join('');
    }
  }
}

function cerrarModalMiSuscripcion() {
  const modal = document.getElementById('modal-mi-suscripcion');
  if (modal) modal.style.display = 'none';
}

function actualizarWidgetSuscripcionSidebar() {
  const sesion = window.usuarioSesion || { usuario: 'Admin Master', rol: 'admin' };
  const widgetVence = document.getElementById('widget-vence');
  const widgetUsuario = document.getElementById('widget-nombre-usuario');
  const avatarIniciales = document.getElementById('avatar-iniciales');

  const usuarios = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];
  const usuarioObj = usuarios.find(u => u.usuario === sesion.usuario) || {};

  const nombreUsuario = sesion.usuario || 'Admin Master';
  const planNombre = renderizarInfoSuscripcion(usuarioObj);
  const fechaVenceStr = usuarioObj.fechaVencimiento || '2026-12-01T23:59';
  let fechaFmt = '01/12/2026';

  try {
    const d = new Date(fechaVenceStr);
    if (!isNaN(d.getTime())) {
      fechaFmt = d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch (e) {}

  if (widgetVence) widgetVence.innerText = fechaFmt;
  if (widgetUsuario) widgetUsuario.innerText = nombreUsuario;

  if (avatarIniciales) {
    const partes = nombreUsuario.trim().split(' ');
    let init = 'AM';
    if (partes.length >= 2) {
      init = (partes[0][0] + partes[1][0]).toUpperCase();
    } else if (partes[0].length >= 2) {
      init = partes[0].substring(0, 2).toUpperCase();
    }
    avatarIniciales.innerText = init;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarWidgetSuscripcionSidebar();
});

// Exposiciones globales
window.mostrarNotificacion = mostrarNotificacion;
window.cerrarToast = cerrarToast;
window.escapeHtml = escapeHtml;
window.mostrarVista = mostrarVista;
window.aplicarPermisosUsuarioActivo = aplicarPermisosUsuarioActivo;
window.alternarSimuladorRol = alternarSimuladorRol;
window.formatearSoles = formatearSoles;
window.formatearDolares = formatearDolares;
window.renderizarInfoSuscripcion = renderizarInfoSuscripcion;
window.abrirModalMiSuscripcion = abrirModalMiSuscripcion;
window.cerrarModalMiSuscripcion = cerrarModalMiSuscripcion;
window.actualizarWidgetSuscripcionSidebar = actualizarWidgetSuscripcionSidebar;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.toggleMenuSesion = toggleMenuSesion;
window.cerrarSesion = cerrarSesion;
window.inicializarFlatpickr = inicializarFlatpickr;
window.verificarPermisosUI = verificarPermisosUI;
