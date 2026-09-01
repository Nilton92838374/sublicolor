// ==========================================
//   SUBLICOLOR - MÓDULO DE EQUIPO / STAFF
// ==========================================

const TODOS_LOS_PERMISOS = [
  { id: 'crear_clientes', label: 'Crear Clientes' },
  { id: 'eliminar_perfiles', label: 'Eliminar Perfiles' },
  { id: 'gestionar_proxies', label: 'Gestionar Proxys' },
  { id: 'ver_facturacion', label: 'Ver Facturación' },
  { id: 'acceso_configuracion', label: 'Acceso a Configuración' }
];

function obtenerStaffLocal() {
  const dataRaw = localStorage.getItem('sublicolor_staff');
  if (!dataRaw) {
    const iniciales = [
      {
        id: 'stf_001',
        usuario: 'admin_master',
        rol: 'Admin',
        estado: 'Activo',
        ultimaActividad: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        password: 'MasterAdmin2026!',
        permisos: ['crear_clientes', 'eliminar_perfiles', 'gestionar_proxies', 'ver_facturacion', 'acceso_configuracion']
      },
      {
        id: 'stf_002',
        usuario: 'reseller_ventas',
        rol: 'Reseller',
        estado: 'Activo',
        ultimaActividad: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        password: 'ResellerVentas2026!',
        permisos: ['crear_clientes', 'gestionar_proxies']
      }
    ];
    localStorage.setItem('sublicolor_staff', JSON.stringify(iniciales));
    return iniciales;
  }

  try {
    return JSON.parse(dataRaw) || [];
  } catch (e) {
    console.error('Error al parsear sublicolor_staff desde localStorage:', e);
    return [];
  }
}

function poblarPermisosModal(seleccionados = null) {
  const container = document.getElementById('lista-permisos-staff');
  if (!container) return;

  container.innerHTML = TODOS_LOS_PERMISOS.map(p => {
    const isChecked = (seleccionados === null || seleccionados.includes(p.id));
    const activeClass = isChecked ? 'active' : '';
    const checkedAttr = isChecked ? 'checked' : '';
    return `
      <label class="selectable-pill ${activeClass}">
        <input type="checkbox" name="permiso-staff" value="${p.id}" ${checkedAttr} onchange="this.parentElement.classList.toggle('active', this.checked)" />
        <span>🔑 ${escapeHtml(p.label)}</span>
      </label>
    `;
  }).join('');
}

async function cargarStaff() {
  const tbody = document.getElementById('tabla-staff-body');
  if (!tbody) return;

  const staff = obtenerStaffLocal();

  if (staff.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
          No hay miembros de staff registrados. Haz clic en <strong>+ Crear Admin</strong> o <strong>+ Crear Reseller</strong> para agregar uno.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = staff.map(s => {
    const badgeRol = s.rol === 'Admin'
      ? `<span class="tag-badge" style="color: #047857 !important; background-color: #d1fae5 !important; border-color: #a7f3d0 !important;">Admin</span>`
      : `<span class="tag-badge">Reseller</span>`;

    const badgeEstado = s.estado === 'Activo'
      ? `<span class="badge badge-active">Activo</span>`
      : `<span class="badge badge-idle" style="color: #dc2626; border-color: #fca5a5;">Inactivo</span>`;

    const permisosCount = (s.permisos || []).length;

    return `
      <tr>
        <td>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <strong>${escapeHtml(s.usuario)}</strong>
            <span style="font-size: 10.5px; color: var(--text-muted);">${permisosCount} de ${TODOS_LOS_PERMISOS.length} permisos</span>
          </div>
        </td>
        <td>${badgeRol}</td>
        <td>${badgeEstado}</td>
        <td>${escapeHtml(s.ultimaActividad || 'Ahora')}</td>
        <td>
          <span style="cursor: pointer;" title="Haz clic para ver/ocultar contraseña" onclick="togglePasswordStaff('${s.id}')">
            👁️ <code id="pass-staff-${s.id}">••••••••</code>
          </span>
        </td>
        <td>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; margin-right: 6px;" onclick="editarStaff('${s.id}')">Editar</button>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; color: #dc2626; background: #fee2e2; border-color: #fca5a5;" onclick="eliminarStaff('${s.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function togglePasswordStaff(idStaff) {
  const el = document.getElementById(`pass-staff-${idStaff}`);
  if (!el) return;

  const staff = obtenerStaffLocal();
  const miembro = staff.find(s => String(s.id) === String(idStaff));
  if (!miembro) return;

  if (el.innerText === '••••••••') {
    el.innerText = miembro.password;
  } else {
    el.innerText = '••••••••';
  }
}

function filtrarStaff(query) {
  const term = (query || '').toLowerCase().trim();
  const tbody = document.getElementById('tabla-staff-body');
  if (!tbody) return;

  const staff = obtenerStaffLocal();
  const filtrados = staff.filter(s => 
    (s.usuario || '').toLowerCase().includes(term) ||
    (s.rol || '').toLowerCase().includes(term)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
          No se encontraron miembros coincidentes.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtrados.map(s => {
    const badgeRol = s.rol === 'Admin'
      ? `<span class="tag-badge" style="color: #047857 !important; background-color: #d1fae5 !important; border-color: #a7f3d0 !important;">Admin</span>`
      : `<span class="tag-badge">Reseller</span>`;

    const badgeEstado = s.estado === 'Activo'
      ? `<span class="badge badge-active">Activo</span>`
      : `<span class="badge badge-idle" style="color: #dc2626; border-color: #fca5a5;">Inactivo</span>`;

    const permisosCount = (s.permisos || []).length;

    return `
      <tr>
        <td>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <strong>${escapeHtml(s.usuario)}</strong>
            <span style="font-size: 10.5px; color: var(--text-muted);">${permisosCount} de ${TODOS_LOS_PERMISOS.length} permisos</span>
          </div>
        </td>
        <td>${badgeRol}</td>
        <td>${badgeEstado}</td>
        <td>${escapeHtml(s.ultimaActividad || 'Ahora')}</td>
        <td>
          <span style="cursor: pointer;" title="Haz clic para ver/ocultar contraseña" onclick="togglePasswordStaff('${s.id}')">
            👁️ <code id="pass-staff-${s.id}">••••••••</code>
          </span>
        </td>
        <td>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; margin-right: 6px;" onclick="editarStaff('${s.id}')">Editar</button>
          <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px; color: #dc2626; background: #fee2e2; border-color: #fca5a5;" onclick="eliminarStaff('${s.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function abrirModalCrearPersonal(rolPredeterminado = 'admin') {
  const rolStandard = String(rolPredeterminado).toLowerCase() === 'reseller' ? 'Reseller' : 'Admin';
  crearNuevoStaff(rolStandard);
}

function crearNuevoStaff(rolPredeterminado = 'Admin') {
  const inputId = document.getElementById('modal-staff-id');
  const selectRol = document.getElementById('modal-staff-rol');
  const selectRolMiembro = document.getElementById('rol-nuevo-miembro');
  const titulo = document.getElementById('modal-staff-titulo');
  
  if (inputId) inputId.value = '';
  if (selectRol) selectRol.value = rolPredeterminado;
  if (selectRolMiembro) selectRolMiembro.value = String(rolPredeterminado).toLowerCase() === 'reseller' ? 'reseller' : 'admin';
  if (titulo) titulo.innerText = `Crear Nuevo Miembro`;

  poblarPermisosModal();

  const modal = document.getElementById('modal-nuevo-staff');
  if (modal) modal.style.display = 'flex';
}

function editarStaff(idStaff) {
  const staff = obtenerStaffLocal();
  const miembro = staff.find(s => String(s.id) === String(idStaff));
  if (!miembro) return;

  const inputId = document.getElementById('modal-staff-id');
  const inputUsuario = document.getElementById('modal-staff-usuario');
  const selectRol = document.getElementById('modal-staff-rol');
  const selectEstado = document.getElementById('modal-staff-estado');
  const inputPassword = document.getElementById('modal-staff-password');
  const titulo = document.getElementById('modal-staff-titulo');

  if (inputId) inputId.value = miembro.id;
  if (inputUsuario) inputUsuario.value = miembro.usuario;
  if (selectRol) selectRol.value = miembro.rol;
  if (selectEstado) selectEstado.value = miembro.estado;
  if (inputPassword) inputPassword.value = miembro.password;
  if (titulo) titulo.innerText = `Editar Miembro: ${miembro.usuario}`;

  poblarPermisosModal(miembro.permisos || []);

  const modal = document.getElementById('modal-nuevo-staff');
  if (modal) modal.style.display = 'flex';
}

function cerrarModalStaff() {
  const modal = document.getElementById('modal-nuevo-staff');
  if (modal) modal.style.display = 'none';

  const form = document.getElementById('form-nuevo-staff');
  if (form) form.reset();

  const inputId = document.getElementById('modal-staff-id');
  if (inputId) inputId.value = '';
}

async function guardarStaff(e) {
  if (e) e.preventDefault();

  const inputId = document.getElementById('modal-staff-id');
  const usuarioInput = document.getElementById('modal-staff-usuario');
  const rolSelect = document.getElementById('modal-staff-rol');
  const estadoSelect = document.getElementById('modal-staff-estado');
  const passwordInput = document.getElementById('modal-staff-password');

  const idExistente = inputId ? inputId.value.trim() : '';
  const usuarioRaw = usuarioInput ? usuarioInput.value.trim() : '';
  const rol = rolSelect ? rolSelect.value : 'Admin';
  const estado = estadoSelect ? estadoSelect.value : 'Activo';
  const password = passwordInput ? passwordInput.value : '';

  if (!usuarioRaw || !password) {
    mostrarNotificacion('Usuario y Contraseña son requeridos.', 'error');
    return;
  }

  const checkboxesPermisos = document.querySelectorAll('input[name="permiso-staff"]:checked');
  const permisos = Array.from(checkboxesPermisos).map(cb => cb.value);

  const staff = obtenerStaffLocal();
  const fechaAhora = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (idExistente) {
    const idx = staff.findIndex(s => String(s.id) === String(idExistente));
    if (idx !== -1) {
      staff[idx] = {
        ...staff[idx],
        usuario: usuarioRaw,
        rol,
        estado,
        password,
        permisos,
        ultimaActividad: fechaAhora
      };
      mostrarNotificacion('Miembro de staff actualizado', 'exito');
    }
  } else {
    const id = 'stf_' + Date.now();
    const nuevoMiembro = {
      id,
      usuario: usuarioRaw,
      rol,
      estado,
      password,
      permisos,
      ultimaActividad: fechaAhora
    };
    staff.push(nuevoMiembro);
    mostrarNotificacion('Nuevo miembro agregado al equipo', 'exito');
  }

  localStorage.setItem('sublicolor_staff', JSON.stringify(staff));
  cerrarModalStaff();
  cargarStaff();
}

function eliminarStaff(idStaff) {
  const staff = obtenerStaffLocal().filter(s => String(s.id) !== String(idStaff));
  localStorage.setItem('sublicolor_staff', JSON.stringify(staff));
  mostrarNotificacion('Miembro eliminado del equipo.', 'exito');
  cargarStaff();
}

// Exposiciones globales
window.obtenerStaffLocal = obtenerStaffLocal;
window.poblarPermisosModal = poblarPermisosModal;
window.cargarStaff = cargarStaff;
window.filtrarStaff = filtrarStaff;
window.togglePasswordStaff = togglePasswordStaff;
window.crearNuevoStaff = crearNuevoStaff;
window.abrirModalCrearPersonal = abrirModalCrearPersonal;
window.editarStaff = editarStaff;
window.cerrarModalStaff = cerrarModalStaff;
window.guardarStaff = guardarStaff;
window.eliminarStaff = eliminarStaff;
