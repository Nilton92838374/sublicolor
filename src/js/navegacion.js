// ==========================================
//   SUBLICOLOR - CONTROLADOR DE NAVEGACIÓN
// ==========================================

function actualizarEstadisticasDashboard() {
  const perfiles = typeof window.obtenerPerfilesLocales === 'function' ? window.obtenerPerfilesLocales() : [];
  const usuarios = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];

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

async function cargarVista(vista) {
  const contenedor = document.getElementById('contenido-principal');
  if (!contenedor) return;

  try {
    let nombreArchivoHtml = vista;
    if (vista === 'cliente_perfiles' || vista === 'dashboard_cliente') {
      nombreArchivoHtml = 'dashboard-cliente';
    }

    const response = await fetch(`./src/vistas/${nombreArchivoHtml}.html`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    contenedor.innerHTML = html;

    // Actualizar título y botón principal del top-navbar
    const titleEl = document.getElementById('page-title');
    const actionBtn = document.getElementById('btn-header-action');

    if (vista === 'inicio') {
      if (titleEl) titleEl.innerText = 'Dashboard / Inicio';
      if (actionBtn) actionBtn.style.display = 'none';
      if (typeof window.cargarMetricas === 'function') window.cargarMetricas();
    } else if (vista === 'perfiles') {
      if (titleEl) titleEl.innerText = 'Gestión de Perfiles Multicuenta';
      if (actionBtn) {
        actionBtn.innerText = '+ Nuevo Perfil';
        actionBtn.onclick = window.crearNuevoPerfil;
        actionBtn.style.display = 'inline-block';
      }
      if (typeof window.cargarPerfiles === 'function') window.cargarPerfiles();
    } else if (vista === 'proxies') {
      if (titleEl) titleEl.innerText = 'Servidores Proxy';
      if (actionBtn) {
        actionBtn.innerText = '+ Nuevo Proxy';
        actionBtn.onclick = window.crearNuevoProxy;
        actionBtn.style.display = 'inline-block';
      }
      if (typeof window.cargarProxies === 'function') window.cargarProxies();
    } else if (vista === 'grupos') {
      if (titleEl) titleEl.innerText = 'Grupos & Etiquetas';
      if (actionBtn) actionBtn.style.display = 'none';
      if (typeof window.cargarGruposYEtiquetas === 'function') window.cargarGruposYEtiquetas();
    } else if (vista === 'usuarios') {
      if (titleEl) titleEl.innerText = 'Usuarios / Clientes';
      if (actionBtn) {
        actionBtn.innerText = '+ Nuevo Cliente';
        actionBtn.onclick = window.crearNuevoCliente;
        actionBtn.style.display = 'inline-block';
      }
      if (typeof window.cargarUsuarios === 'function') window.cargarUsuarios();
    } else if (vista === 'facturacion') {
      if (titleEl) titleEl.innerText = 'Facturación & Gestión Financiera';
      if (actionBtn) actionBtn.style.display = 'none';
      if (typeof window.cargarFacturacion === 'function') window.cargarFacturacion();
    } else if (vista === 'equipo') {
      if (titleEl) titleEl.innerText = 'Gestión de Equipo y Personal Interno';
      if (actionBtn) actionBtn.style.display = 'none';
      if (typeof window.cargarStaff === 'function') window.cargarStaff();
    } else if (vista === 'cuentas') {
      if (titleEl) titleEl.innerText = 'Cuentas Vinculadas e Inventario';
      if (actionBtn) {
        actionBtn.innerText = '+ Nueva Cuenta';
        actionBtn.onclick = window.crearNuevaCuenta;
        actionBtn.style.display = 'inline-block';
      }
      if (typeof window.cargarCuentas === 'function') window.cargarCuentas();
    } else if (vista === 'cliente_perfiles' || vista === 'dashboard_cliente') {
      if (titleEl) titleEl.innerText = 'Panel de Servicios Cliente';
      if (actionBtn) actionBtn.style.display = 'none';
      if (typeof window.cargarDashboardCliente === 'function') window.cargarDashboardCliente();
    } else if (vista === 'configuracion') {
      if (titleEl) titleEl.innerText = 'Configuración de Sistema';
      if (actionBtn) actionBtn.style.display = 'none';
      if (typeof window.cargarConfiguracionMotor === 'function') window.cargarConfiguracionMotor();
    } else if (vista === 'anuncios') {
      if (titleEl) titleEl.innerText = '📢 Módulo de Anuncios y Comunicados';
      if (actionBtn) actionBtn.style.display = 'none';
      if (typeof window.cargarAnunciosAdmin === 'function') window.cargarAnunciosAdmin();
    } else if (vista === 'soporte') {
      if (titleEl) titleEl.innerText = '🎧 Gestión de Tickets de Soporte';
      if (actionBtn) actionBtn.style.display = 'none';
      if (typeof window.cargarTicketsAdmin === 'function') window.cargarTicketsAdmin();
    }

    if (typeof window.aplicarPermisosUsuarioActivo === 'function') {
      window.aplicarPermisosUsuarioActivo();
    }
    if (typeof window.verificarPermisosUI === 'function') {
      window.verificarPermisosUI();
    }
    if (typeof window.inicializarFlatpickr === 'function') {
      window.inicializarFlatpickr();
    }

  } catch (error) {
    console.error('Error cargando la vista:', error);
    if (typeof window.mostrarNotificacion === 'function') {
      window.mostrarNotificacion('Error al cargar la sección: ' + error.message, 'error');
    }
  }
}

function switchTab(tabName) {
  const items = document.querySelectorAll('.nav-item');
  items.forEach(i => i.classList.remove('active'));

  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }

  cargarVista(tabName);
}

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('Sublicolor Sistema Modular Inicializado');
  cargarVista('inicio');
});

// Exposiciones globales
window.cargarVista = cargarVista;
window.switchTab = switchTab;
window.actualizarEstadisticasDashboard = actualizarEstadisticasDashboard;
