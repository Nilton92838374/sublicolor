// ==========================================
//   SUBLICOLOR - MÓDULO DE USUARIOS / CLIENTES
// ==========================================

let paginaActualUsuarios = 1;
const itemsPorPaginaUsuarios = 10;
let busquedaFiltroUsuarios = '';

function formatearFechaDatetimeLocal(dateObj = new Date()) {
  const pad = (num) => String(num).padStart(2, '0');
  const year = dateObj.getFullYear();
  const month = pad(dateObj.getMonth() + 1);
  const day = pad(dateObj.getDate());
  const hours = pad(dateObj.getHours());
  const minutes = pad(dateObj.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function obtenerUsuariosLocales() {
  const dataRaw = localStorage.getItem('sublicolor_usuarios');
  if (!dataRaw) {
    const hoy = new Date();
    const vencimiento = new Date();
    vencimiento.setDate(hoy.getDate() + 30);

    const iniciales = [
      {
        id: 'usr_001',
        usuario: 'admin',
        rol: 'admin',
        password: '••••••••',
        fechaInicio: formatearFechaDatetimeLocal(hoy),
        fechaVencimiento: formatearFechaDatetimeLocal(vencimiento),
        gruposPermitidos: ['General', 'Ventas']
      },
      {
        id: 'usr_002',
        usuario: 'juanperez',
        rol: 'cliente',
        password: '••••••••',
        fechaInicio: formatearFechaDatetimeLocal(hoy),
        fechaVencimiento: formatearFechaDatetimeLocal(vencimiento),
        gruposPermitidos: ['Farming']
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

function sumarTiempoSuscripcion(unidad = 'meses', cantidad = 1) {
  const inputInicio = document.getElementById('modal-cliente-inicio');
  const inputVencimiento = document.getElementById('modal-cliente-vencimiento');

  let fechaBase = new Date();
  if (inputInicio && inputInicio.value) {
    const parsed = new Date(inputInicio.value);
    if (!isNaN(parsed.getTime())) fechaBase = parsed;
  } else if (inputInicio) {
    inputInicio.value = formatearFechaDatetimeLocal(fechaBase);
  }

  const fechaVenc = new Date(fechaBase);
  const num = parseInt(cantidad, 10) || 1;

  if (unidad === 'horas') {
    fechaVenc.setHours(fechaVenc.getHours() + num);
  } else if (unidad === 'dias') {
    fechaVenc.setDate(fechaVenc.getDate() + num);
  } else if (unidad === 'meses') {
    fechaVenc.setMonth(fechaVenc.getMonth() + num);
  }

  if (inputVencimiento) {
    inputVencimiento.value = formatearFechaDatetimeLocal(fechaVenc);
  }
}

function poblarGruposPermitidosModal(seleccionados = []) {
  const container = document.getElementById('lista-grupos-permitidos');
  if (!container) return;

  const grupos = typeof window.obtenerGruposLocales === 'function' ? window.obtenerGruposLocales() : [];

  if (grupos.length === 0) {
    container.innerHTML = '<span style="color: var(--text-muted); font-size: 11px;">Crea grupos de perfiles primero para asignar accesos.</span>';
    return;
  }

  container.innerHTML = grupos.map(g => {
    const isChecked = (seleccionados.length === 0 || seleccionados.includes(g));
    const activeClass = isChecked ? 'active' : '';
    const checkedAttr = isChecked ? 'checked' : '';
    return `
      <label class="selectable-pill ${activeClass}">
        <input type="checkbox" name="grupo-permitido" value="${escapeHtml(g)}" ${checkedAttr} onchange="this.parentElement.classList.toggle('active', this.checked)" />
        <span>📦 ${escapeHtml(g)}</span>
      </label>
    `;
  }).join('');
}

function togglePassword(btn) {
  if (!btn) return;
  const celda = btn.closest('.celda-password') || btn.parentElement;
  if (!celda) return;
  const span = celda.querySelector('.pwd-oculta');
  if (!span) return;

  const realPass = span.getAttribute('data-real') || '';
  if (span.innerText === '••••••••') {
    span.innerText = realPass;
  } else {
    span.innerText = '••••••••';
  }
}

window.copiarAcceso = function(usuario, password) {
    const textoCopiar = `¡Hola! Aquí tienes tu acceso a Sublicolor:\n\n` +
                        `👤 Usuario: ${usuario}\n` +
                        `🔑 Contraseña: ${password}\n\n` +
                        `¡Gracias por tu preferencia!`;

    navigator.clipboard.writeText(textoCopiar).then(() => {
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion('Mensaje copiado al portapapeles', 'exito');
        } else {
            alert('Mensaje copiado al portapapeles');
        }
    }).catch(err => {
        console.error('Error al copiar al portapapeles:', err);
    });
};

function filtrarUsuarios(query) {
  busquedaFiltroUsuarios = (query || '').toLowerCase().trim();
  paginaActualUsuarios = 1;
  cargarUsuarios();
}

function paginaAnteriorUsuarios() {
  if (paginaActualUsuarios > 1) {
    paginaActualUsuarios--;
    cargarUsuarios();
  }
}

function paginaSiguienteUsuarios() {
  const usuarios = obtenerUsuariosLocales();
  const filtrados = usuarios.filter(u => 
    (u.usuario || '').toLowerCase().includes(busquedaFiltroUsuarios) ||
    (u.rol || '').toLowerCase().includes(busquedaFiltroUsuarios)
  );
  const maxPaginas = Math.ceil(filtrados.length / itemsPorPaginaUsuarios) || 1;
  if (paginaActualUsuarios < maxPaginas) {
    paginaActualUsuarios++;
    cargarUsuarios();
  }
}

async function cargarUsuarios() {
  const tbody = document.getElementById('tabla-usuarios-body');
  if (!tbody) return;

  const usuarios = obtenerUsuariosLocales();

  const filtrados = usuarios.filter(u => 
    (u.usuario || '').toLowerCase().includes(busquedaFiltroUsuarios) ||
    (u.rol || '').toLowerCase().includes(busquedaFiltroUsuarios)
  );

  const totalPaginas = Math.ceil(filtrados.length / itemsPorPaginaUsuarios) || 1;
  if (paginaActualUsuarios > totalPaginas) paginaActualUsuarios = totalPaginas;

  const infoPaginacion = document.getElementById('paginacion-info-usuarios');
  if (infoPaginacion) {
    infoPaginacion.innerText = `Página ${paginaActualUsuarios} de ${totalPaginas} (${filtrados.length} clientes)`;
  }

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">
          No se encontraron clientes coincidentes.
        </td>
      </tr>
    `;
    return;
  }

  const inicioIdx = (paginaActualUsuarios - 1) * itemsPorPaginaUsuarios;
  const paginados = filtrados.slice(inicioIdx, inicioIdx + itemsPorPaginaUsuarios);
  const hoyMs = new Date().getTime();

  tbody.innerHTML = paginados.map(u => {
    let esActivo = true;
    let vencTexto = u.fechaVencimiento || 'Indefinido';

    if (u.fechaVencimiento) {
      const vencMs = new Date(u.fechaVencimiento).getTime();
      if (!isNaN(vencMs)) {
        esActivo = vencMs >= hoyMs;
        vencTexto = u.fechaVencimiento.replace('T', ' ');
      }
    }

    const badgeSuscripcion = esActivo
      ? `<span class="badge badge-active">Activo (${escapeHtml(vencTexto)})</span>`
      : `<span class="badge badge-idle" style="color: #dc2626; border-color: #fca5a5;">Vencido (${escapeHtml(vencTexto)})</span>`;

    const gruposHtml = (u.gruposPermitidos && u.gruposPermitidos.length > 0)
      ? u.gruposPermitidos.map(g => `<span class="tag-badge">📦 ${escapeHtml(g)}</span>`).join('')
      : '<span style="color: var(--text-muted); font-size: 11px;">Todos</span>';

    return `
      <tr>
        <td><strong>${escapeHtml(u.usuario)}</strong></td>
        <td>${badgeSuscripcion}</td>
        <td>${gruposHtml}</td>
        <td class="celda-password">
          <span class="pwd-oculta" data-real="${escapeHtml(u.password)}">••••••••</span>
          <button class="revelar-pwd" type="button" onclick="togglePassword(this)" title="Mostrar/Ocultar contraseña" aria-label="Mostrar u ocultar contraseña">👁️</button>
        </td>
        <td>
          <button type="button" class="btn-editar-tabla" style="margin-right: 6px;" onclick="editarCliente('${u.id}')">Editar</button>
          <button type="button" class="btn-copiar" style="margin-right: 6px;" onclick="copiarAcceso('${escapeHtml(u.usuario)}', '${escapeHtml(u.password)}')">📋 Copiar</button>
          <button type="button" class="btn-eliminar-tabla" onclick="eliminarCliente('${u.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function crearNuevoCliente() {
  const inputId = document.getElementById('modal-cliente-id');
  const inputInicio = document.getElementById('modal-cliente-inicio');
  const titulo = document.getElementById('modal-cliente-titulo');

  if (inputId) inputId.value = '';
  if (titulo) titulo.innerText = 'Crear Nuevo Cliente';

  const ahoraStr = formatearFechaDatetimeLocal(new Date());
  if (inputInicio) inputInicio.value = ahoraStr;

  poblarGruposPermitidosModal();
  sumarTiempoSuscripcion('meses', 1);

  const modal = document.getElementById('modal-nuevo-cliente');
  if (modal) modal.style.display = 'flex';
}

function editarCliente(idUsuario) {
  const usuarios = obtenerUsuariosLocales();
  const cliente = usuarios.find(u => String(u.id) === String(idUsuario));
  if (!cliente) return;

  const inputId = document.getElementById('modal-cliente-id');
  const inputUsuario = document.getElementById('modal-cliente-usuario');
  const selectRol = document.getElementById('modal-cliente-rol');
  const selectPlan = document.getElementById('modal-usuario-plan');
  const inputPassword = document.getElementById('modal-cliente-password');
  const inputTarifa = document.getElementById('modal-cliente-tarifa');
  const inputInicio = document.getElementById('modal-cliente-inicio');
  const inputVencimiento = document.getElementById('modal-cliente-vencimiento');
  const titulo = document.getElementById('modal-cliente-titulo');

  if (inputId) inputId.value = cliente.id;
  if (inputUsuario) inputUsuario.value = cliente.usuario;
  if (selectRol) selectRol.value = cliente.rol || 'cliente';
  if (selectPlan) selectPlan.value = cliente.plan || 'Enterprise';
  if (inputPassword) inputPassword.value = cliente.password;
  if (inputTarifa) inputTarifa.value = cliente.tarifaMensual !== undefined ? cliente.tarifaMensual : 29.99;
  if (inputInicio) inputInicio.value = cliente.fechaInicio || formatearFechaDatetimeLocal(new Date());
  if (inputVencimiento) inputVencimiento.value = cliente.fechaVencimiento || '';
  if (titulo) titulo.innerText = `Editar Cliente: ${cliente.usuario}`;

  poblarGruposPermitidosModal(cliente.gruposPermitidos || []);

  const modal = document.getElementById('modal-nuevo-cliente');
  if (modal) modal.style.display = 'flex';
}

function cerrarModalCliente() {
  const modal = document.getElementById('modal-nuevo-cliente');
  if (modal) modal.style.display = 'none';

  const form = document.getElementById('form-nuevo-cliente');
  if (form) form.reset();

  const inputId = document.getElementById('modal-cliente-id');
  if (inputId) inputId.value = '';
}

async function guardarCliente(e) {
  if (e) e.preventDefault();

  const inputId = document.getElementById('modal-cliente-id');
  const usuarioInput = document.getElementById('modal-cliente-usuario');
  const rolSelect = document.getElementById('modal-cliente-rol');
  const planSelect = document.getElementById('modal-usuario-plan');
  const passwordInput = document.getElementById('modal-cliente-password');
  const tarifaInput = document.getElementById('modal-cliente-tarifa');
  const inicioInput = document.getElementById('modal-cliente-inicio');
  const vencimientoInput = document.getElementById('modal-cliente-vencimiento');

  const idExistente = inputId ? inputId.value.trim() : '';
  const usuarioRaw = usuarioInput ? usuarioInput.value.trim() : '';
  const rol = rolSelect ? rolSelect.value : 'cliente';
  const plan = planSelect ? planSelect.value : 'Enterprise';
  const password = passwordInput ? passwordInput.value : '';
  const tarifaMensual = tarifaInput ? (parseFloat(tarifaInput.value) || 0) : 29.99;
  const fechaInicio = inicioInput ? inicioInput.value : formatearFechaDatetimeLocal(new Date());
  const fechaVencimiento = vencimientoInput ? vencimientoInput.value : '';

  if (!usuarioRaw) {
    mostrarNotificacion('El Nombre de Usuario es requerido.', 'error');
    return;
  }

  if (!password) {
    mostrarNotificacion('La Contraseña es requerida.', 'error');
    return;
  }

  const checkboxes = document.querySelectorAll('input[name="grupo-permitido"]:checked');
  const gruposPermitidos = Array.from(checkboxes).map(cb => cb.value);

  const usuarios = obtenerUsuariosLocales();

  if (idExistente) {
    const idx = usuarios.findIndex(u => String(u.id) === String(idExistente));
    if (idx !== -1) {
      usuarios[idx] = {
        ...usuarios[idx],
        usuario: usuarioRaw,
        rol,
        plan,
        password,
        tarifaMensual,
        fechaInicio,
        fechaVencimiento,
        gruposPermitidos
      };
      mostrarNotificacion('Cliente actualizado exitosamente', 'exito');
    }
  } else {
    const id = 'usr_' + Date.now();
    const nuevoCliente = {
      id,
      usuario: usuarioRaw,
      rol,
      plan,
      password,
      tarifaMensual,
      fechaInicio,
      fechaVencimiento,
      gruposPermitidos
    };
    usuarios.push(nuevoCliente);
    mostrarNotificacion('Cliente creado exitosamente', 'exito');
  }

  localStorage.setItem('sublicolor_usuarios', JSON.stringify(usuarios));
  cerrarModalCliente();
  cargarUsuarios();

  if (typeof window.actualizarEstadisticasDashboard === 'function') {
    window.actualizarEstadisticasDashboard();
  }
}

function eliminarCliente(idUsuario) {
  const usuarios = obtenerUsuariosLocales().filter(u => String(u.id) !== String(idUsuario));
  localStorage.setItem('sublicolor_usuarios', JSON.stringify(usuarios));
  mostrarNotificacion('Cliente eliminado correctamente.', 'exito');
  cargarUsuarios();

  if (typeof window.actualizarEstadisticasDashboard === 'function') {
    window.actualizarEstadisticasDashboard();
  }
}

// Exposiciones globales
window.formatearFechaDatetimeLocal = formatearFechaDatetimeLocal;
window.obtenerUsuariosLocales = obtenerUsuariosLocales;
window.sumarTiempoSuscripcion = sumarTiempoSuscripcion;
window.sumarSuscripcion = (meses) => sumarTiempoSuscripcion('meses', meses);
window.sumarUnMesSuscripcion = () => sumarTiempoSuscripcion('meses', 1);
window.poblarGruposPermitidosModal = poblarGruposPermitidosModal;
window.togglePassword = togglePassword;
window.copiarAcceso = copiarAcceso;
window.filtrarUsuarios = filtrarUsuarios;
window.paginaAnteriorUsuarios = paginaAnteriorUsuarios;
window.paginaSiguienteUsuarios = paginaSiguienteUsuarios;
window.cargarUsuarios = cargarUsuarios;
window.crearNuevoCliente = crearNuevoCliente;
window.editarCliente = editarCliente;
window.cerrarModalCliente = cerrarModalCliente;
window.guardarCliente = guardarCliente;
window.eliminarCliente = eliminarCliente;
