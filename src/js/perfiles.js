// ==========================================
//   SUBLICOLOR - MÓDULO DE PERFILES (AVANZADO)
// ==========================================

function obtenerPerfilesLocales() {
  const dataRaw = localStorage.getItem('sublicolor_perfiles');
  if (!dataRaw) {
    const iniciales = [
      {
        id: 'prf_100_01',
        nombre: 'Servicio Premium 100Pre #01',
        grupo: 'General',
        etiquetas: ['Premium', '100Pre'],
        startUrl: 'https://100prepremium.com',
        proxy: 'Direct Connection',
        cookies: '',
        camuflaje: { userAgent: true, canvas: true, webgl: true, hardware: true },
        estadoOperativo: 'activo',
        estado: 'Activo',
        ultimoAcceso: 'Ahora'
      },
      {
        id: 'prf_100_02',
        nombre: 'Servicio Premium 100Pre #02',
        grupo: 'General',
        etiquetas: ['Stream', '100Pre'],
        startUrl: 'https://100prepremium.com',
        proxy: 'Direct Connection',
        cookies: '',
        camuflaje: { userAgent: true, canvas: true, webgl: true, hardware: true },
        estadoOperativo: 'activo',
        estado: 'Activo',
        ultimoAcceso: 'Ahora'
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

function obtenerBadgeEstadoOperativo(estado = 'activo') {
  const est = (estado || 'activo').toLowerCase();
  if (est === 'mantenimiento') {
    return `<span class="badge-estado estado-mantenimiento">En Mantenimiento</span>`;
  }
  if (est === 'nuevo') {
    return `<span class="badge-estado estado-nuevo">Recién Lanzado</span>`;
  }
  if (est === 'caido') {
    return `<span class="badge-estado estado-caido">Inhabilitado</span>`;
  }
  return `<span class="badge-estado estado-activo">Activo</span>`;
}

function cambiarEstadoRapido(idPerfil, nuevoEstado, selectElement) {
  const perfiles = obtenerPerfilesLocales();
  const perfil = perfiles.find(p => String(p.id) === String(idPerfil));

  if (!perfil) {
    return mostrarNotificacion('Error: Perfil no encontrado.', 'error');
  }

  perfil.estadoOperativo = nuevoEstado;
  perfil.estado = nuevoEstado === 'caido' ? 'Inactivo' : 'Activo';

  localStorage.setItem('sublicolor_perfiles', JSON.stringify(perfiles));

  if (selectElement) {
    selectElement.className = `select-estado-rapido select-estado-${nuevoEstado}`;
  }

  mostrarNotificacion(`Estado de "${perfil.nombre}" actualizado a "${nuevoEstado.toUpperCase()}"`, 'exito');

  if (typeof window.actualizarEstadisticasDashboard === 'function') {
    window.actualizarEstadisticasDashboard();
  }
}

function renderFilaPerfil(p) {
  const etiquetasHtml = (p.etiquetas && p.etiquetas.length > 0)
    ? `<br>${p.etiquetas.map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('')}`
    : '';

  const op = p.estadoOperativo || (p.estado === 'Inactivo' ? 'caido' : 'activo');

  return `
    <tr>
      <td><code>${escapeHtml(p.id)}</code></td>
      <td>
        <strong>${escapeHtml(p.nombre)}</strong>
        ${p.grupo ? `<br><small style="color: var(--texto-muted);">${escapeHtml(p.grupo)}</small>` : ''}
        ${etiquetasHtml}
      </td>
      <td><code>${escapeHtml(p.proxy || 'Direct Connection')}</code></td>
      <td>
        <select class="select-estado-rapido select-estado-${op}" onchange="cambiarEstadoRapido('${p.id}', this.value, this)">
          <option value="activo" ${op === 'activo' ? 'selected' : ''}>🟢 Activo</option>
          <option value="mantenimiento" ${op === 'mantenimiento' ? 'selected' : ''}>🟠 Mantenimiento</option>
          <option value="nuevo" ${op === 'nuevo' ? 'selected' : ''}>✨ Nuevo</option>
          <option value="caido" ${op === 'caido' ? 'selected' : ''}>🔴 Caído</option>
        </select>
      </td>
      <td>${escapeHtml(p.ultimoAcceso || 'Ahora')}</td>
      <td>
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; margin-right: 4px;" onclick="abrirPerfil('${p.id}')">Abrir</button>
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; margin-right: 4px; color: var(--color-acento);" onclick="clonarPerfil('${p.id}')">Clonar</button>
        <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: var(--toast-error-text); border-color: rgba(239,68,68,0.3);" onclick="eliminarPerfil('${p.id}')">Eliminar</button>
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

function abrirModalGlobal() {
  const modal = document.getElementById('modal-seguridad-global');
  const textarea = document.getElementById('lista-negra-global');
  if (textarea) {
    textarea.value = localStorage.getItem('sublicolor_firewall_global') || '';
  }
  if (modal) modal.style.display = 'flex';
}

function cerrarModalGlobal() {
  const modal = document.getElementById('modal-seguridad-global');
  if (modal) modal.style.display = 'none';
}

function guardarListaNegraGlobal() {
  const textarea = document.getElementById('lista-negra-global');
  const reglas = textarea ? textarea.value.trim() : '';
  localStorage.setItem('sublicolor_firewall_global', reglas);
  mostrarNotificacion('🛡️ Reglas globales de seguridad actualizadas.', 'exito');
  cerrarModalGlobal();
}

function abrirPerfil(idPerfil) {
  const perfiles = JSON.parse(localStorage.getItem('sublicolor_perfiles')) || [];
  const perfil = perfiles.find(p => String(p.id) === String(idPerfil));
  
  if (!perfil) {
    return mostrarNotificacion('Error: Perfil no encontrado en la memoria local.', 'error');
  }

  console.log('Preparando motor Antidetect para:', perfil);
  mostrarNotificacion(`Iniciando entorno aislado: ${perfil.nombre}...`, 'exito');

  const firewallGlobal = localStorage.getItem('sublicolor_firewall_global') || '';

  // Enviar señal IPC al backend de Electron (Payload combinando perfil y reglasGlobales)
  if (window.api && typeof window.api.lanzarPerfil === 'function') {
    window.api.lanzarPerfil({ perfil, reglasGlobales: firewallGlobal });
  } else {
    mostrarNotificacion('⚠️ La apertura de navegadores antidetect requiere ejecutar la app desde Electron (npm start).', 'error');
  }
}

function clonarPerfil(idPerfil) {
  const perfiles = obtenerPerfilesLocales();
  const original = perfiles.find(p => String(p.id) === String(idPerfil));

  if (!original) {
    return mostrarNotificacion('Error: Perfil a clonar no encontrado.', 'error');
  }

  const nuevoId = 'prf_' + Date.now();
  const copia = JSON.parse(JSON.stringify(original));
  copia.id = nuevoId;
  copia.nombre = `${original.nombre} (Copia)`;
  copia.ultimoAcceso = 'Reciente';

  perfiles.push(copia);
  localStorage.setItem('sublicolor_perfiles', JSON.stringify(perfiles));

  mostrarNotificacion(`Perfil "${copia.nombre}" clonado exitosamente`, 'exito');
  cargarPerfiles();
  if (typeof window.actualizarEstadisticasDashboard === 'function') {
    window.actualizarEstadisticasDashboard();
  }
}

function eliminarPerfil(idPerfil) {
  const perfiles = obtenerPerfilesLocales();
  const perfil = perfiles.find(p => String(p.id) === String(idPerfil));
  const nombre = perfil ? perfil.nombre : 'este perfil';

  if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el perfil "${nombre}"?`)) {
    return;
  }

  const filtrados = perfiles.filter(p => String(p.id) !== String(idPerfil));
  localStorage.setItem('sublicolor_perfiles', JSON.stringify(filtrados));

  mostrarNotificacion(`Perfil "${nombre}" eliminado`, 'exito');
  cargarPerfiles();
  if (typeof window.actualizarEstadisticasDashboard === 'function') {
    window.actualizarEstadisticasDashboard();
  }
}

/**
 * POBLADO DINÁMICO DEL MODAL DE NUEVO PERFIL
 */
function poblarSelectoresModalPerfil() {
  // 1. Poblar Proxies
  const selectProxy = document.getElementById('modal-perfil-proxy');
  if (selectProxy) {
    const proxies = typeof window.obtenerProxiesLocales === 'function' ? window.obtenerProxiesLocales() : [];
    let optionsHtml = '<option value="Direct Connection">Direct Connection (Sin Proxy)</option>';
    proxies.forEach(p => {
      const valorStr = `${p.ip}:${p.puerto}` + (p.usuario ? `:${p.usuario}:${p.password}` : '');
      optionsHtml += `<option value="${escapeHtml(valorStr)}">${escapeHtml(p.nombre)} (${escapeHtml(p.ip)}:${escapeHtml(p.puerto)})</option>`;
    });
    selectProxy.innerHTML = optionsHtml;
  }

  // 2. Poblar Grupos
  const selectGrupo = document.getElementById('modal-perfil-grupo');
  if (selectGrupo) {
    const grupos = typeof window.obtenerGruposLocales === 'function' ? window.obtenerGruposLocales() : ['General'];
    let optionsHtml = '';
    grupos.forEach(g => {
      optionsHtml += `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`;
    });
    selectGrupo.innerHTML = optionsHtml;
  }

  // 3. Poblar Chips de Etiquetas Sugeridas
  const containerTags = document.getElementById('container-tags-disponibles');
  if (containerTags) {
    const etiquetas = typeof window.obtenerEtiquetasLocales === 'function' ? window.obtenerEtiquetasLocales() : [];
    if (etiquetas.length > 0) {
      containerTags.innerHTML = '<small style="color: var(--texto-secundario); display: block; margin-bottom: 4px;">Sugeridas (Haz clic para agregar):</small>' +
        etiquetas.map(t => `<span class="tag-badge" style="cursor: pointer;" onclick="agregarEtiquetaAInput('${escapeHtml(t)}')">+ ${escapeHtml(t)}</span>`).join('');
    } else {
      containerTags.innerHTML = '';
    }
  }
}

function agregarEtiquetaAInput(tag) {
  const input = document.getElementById('modal-perfil-etiquetas');
  if (!input) return;

  const actual = input.value.trim();
  if (!actual) {
    input.value = tag;
  } else {
    const lista = actual.split(',').map(s => s.trim());
    if (!lista.includes(tag)) {
      lista.push(tag);
      input.value = lista.join(', ');
    }
  }
}

/**
 * PARSEADOR INTELIGENTE DE COOKIES EN EL PEGA (JSON & NETSCAPE RAW)
 */
function parsearCookiesPegadas(e) {
  const clipboardData = e.clipboardData || window.clipboardData;
  if (!clipboardData) return;

  const pastedText = clipboardData.getData('Text');
  if (!pastedText || !pastedText.trim()) return;

  e.preventDefault();
  const rawText = pastedText.trim();
  const textarea = document.getElementById('modal-perfil-cookies');
  if (!textarea) return;

  // Intentar parseo directo de JSON
  try {
    const jsonParsed = JSON.parse(rawText);
    if (Array.isArray(jsonParsed) || typeof jsonParsed === 'object') {
      textarea.value = JSON.stringify(jsonParsed, null, 2);
      mostrarNotificacion('Cookies JSON detectadas y formateadas correctamente', 'exito');
      return;
    }
  } catch (errJson) {
    // Si falla JSON, intentar parsear Netscape / Key=Value String
  }

  // Parseador de formato Netscape o Raw Headers / String
  try {
    const lineas = rawText.split('\n');
    const cookiesResult = [];

    lineas.forEach(linea => {
      const cleanLine = linea.trim();
      if (!cleanLine || cleanLine.startsWith('#')) return;

      // Netscape Tab-Separated Format: domain flag path secure expiration name value
      const partes = cleanLine.split(/\t+/);
      if (partes.length >= 7) {
        cookiesResult.push({
          domain: partes[0],
          path: partes[2],
          secure: partes[3].toLowerCase() === 'true',
          expirationDate: parseFloat(partes[4]) || undefined,
          name: partes[5],
          value: partes[6]
        });
      } else if (cleanLine.includes('=')) {
        // Key=Value format simple
        const sub = cleanLine.split(';');
        sub.forEach(pair => {
          const eqIdx = pair.indexOf('=');
          if (eqIdx > 0) {
            const k = pair.substring(0, eqIdx).trim();
            const v = pair.substring(eqIdx + 1).trim();
            if (k) cookiesResult.push({ name: k, value: v });
          }
        });
      }
    });

    if (cookiesResult.length > 0) {
      textarea.value = JSON.stringify(cookiesResult, null, 2);
      mostrarNotificacion(`Format Netscape/String detectado. ${cookiesResult.length} cookies estructuradas en JSON.`, 'exito');
      return;
    }

  } catch (errNetscape) {
    console.error('Error procesando cookies:', errNetscape);
  }

  // Si fallan ambos
  textarea.value = rawText;
  mostrarNotificacion('Formato de Cookies no reconocido o JSON inválido', 'error');
}

let logoBase64Temporal = '';

function inicializarEventosLogoPerfil() {
  const inputArchivo = document.getElementById('archivo-logo-perfil');
  const inputUrl = document.getElementById('url-logo-perfil');
  const imgPreview = document.getElementById('img-preview-logo');
  const cajaPreview = document.getElementById('preview-logo-caja');

  if (inputArchivo) {
    inputArchivo.onchange = function(e) {
      const file = e.target.files[0];
      if (!file) return;

      // LÍMITE DE SEGURIDAD: 200 KB
      if (file.size > 204800) {
        alert('⚠️ La imagen es muy pesada. El límite es 200 KB. Usa una más pequeña o pega un Link.');
        this.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(event) {
        logoBase64Temporal = event.target.result;
        if (imgPreview) imgPreview.src = logoBase64Temporal;
        if (cajaPreview) cajaPreview.style.display = 'block';
        if (inputUrl) inputUrl.value = '';
      };
      reader.readAsDataURL(file);
    };
  }

  if (inputUrl) {
    inputUrl.oninput = function() {
      const val = this.value.trim();
      if (val !== '') {
        if (imgPreview) imgPreview.src = val;
        if (cajaPreview) cajaPreview.style.display = 'block';
        if (inputArchivo) inputArchivo.value = '';
        logoBase64Temporal = '';
      } else {
        if (!logoBase64Temporal && cajaPreview) {
          cajaPreview.style.display = 'none';
        }
      }
    };
  }
}

async function crearNuevoPerfil() {
  let modal = document.getElementById('modal-nuevo-perfil');
  if (!modal && typeof window.cargarVista === 'function') {
    await window.cargarVista('perfiles');
    modal = document.getElementById('modal-nuevo-perfil');
  }

  poblarSelectoresModalPerfil();
  logoBase64Temporal = '';
  const inputArchivo = document.getElementById('archivo-logo-perfil');
  const inputUrl = document.getElementById('url-logo-perfil');
  const cajaPreview = document.getElementById('preview-logo-caja');
  const inputCookies = document.getElementById('cookies-perfil') || document.getElementById('modal-perfil-cookies');
  if (inputArchivo) inputArchivo.value = '';
  if (inputUrl) inputUrl.value = '';
  if (cajaPreview) cajaPreview.style.display = 'none';
  if (inputCookies) inputCookies.value = '';

  inicializarEventosLogoPerfil();

  if (modal) {
    modal.style.display = 'flex';
  } else {
    if (typeof mostrarNotificacion === 'function') {
      mostrarNotificacion('Navega a la sección de Perfiles para crear un nuevo perfil.', 'error');
    }
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
  logoBase64Temporal = '';
  const cajaPreview = document.getElementById('preview-logo-caja');
  if (cajaPreview) cajaPreview.style.display = 'none';
}

async function guardarPerfil(e) {
  if (e) e.preventDefault();

  const nombreInput = document.getElementById('modal-perfil-nombre');
  const grupoInput = document.getElementById('modal-perfil-grupo');
  const etiquetasInput = document.getElementById('modal-perfil-etiquetas');
  const startUrlInput = document.getElementById('modal-perfil-start-url');
  const proxyInput = document.getElementById('modal-perfil-proxy');
  const cookiesInput = document.getElementById('cookies-perfil') || document.getElementById('modal-perfil-cookies');

  const userAgentInput = document.getElementById('modal-perfil-useragent');
  const canvasInput = document.getElementById('modal-perfil-canvas');
  const webglInput = document.getElementById('modal-perfil-webgl');
  const hardwareInput = document.getElementById('modal-perfil-hardware');
  const webrtcInput = document.getElementById('modal-perfil-webrtc');
  const timezoneInput = document.getElementById('modal-perfil-timezone');
  const screenInput = document.getElementById('modal-perfil-screen');
  const fontsInput = document.getElementById('modal-perfil-fonts');
  const audioInput = document.getElementById('modal-perfil-audio');

  const nombre = nombreInput ? nombreInput.value.trim() : '';
  const grupo = grupoInput ? grupoInput.value.trim() : 'General';
  const etiquetasRaw = etiquetasInput ? etiquetasInput.value.trim() : '';
  const etiquetas = etiquetasRaw ? etiquetasRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const startUrl = startUrlInput ? startUrlInput.value.trim() : '';
  const proxy = (proxyInput && proxyInput.value.trim()) ? proxyInput.value.trim() : 'Direct Connection';
  const cookies = cookiesInput ? cookiesInput.value.trim() : '';

  let logoFinal = 'default';
  const inputUrl = document.getElementById('url-logo-perfil');
  const urlVal = inputUrl ? inputUrl.value.trim() : '';

  if (urlVal !== '') {
    logoFinal = urlVal;
  } else if (logoBase64Temporal !== '') {
    logoFinal = logoBase64Temporal;
  }

  const estadoOperativoInput = document.getElementById('estado-operativo');
  const estadoOperativo = estadoOperativoInput ? estadoOperativoInput.value : 'activo';

  const soInput = document.getElementById('emulacion-so');
  const ramInput = document.getElementById('emulacion-ram');

  const entorno = {
    so: soInput ? soInput.value : 'Windows 11 (PC Moderna)',
    ram: ramInput ? ramInput.value : '16'
  };

  const camuflaje = {
    userAgent: userAgentInput ? userAgentInput.checked : true,
    canvas: canvasInput ? canvasInput.checked : true,
    webgl: webglInput ? webglInput.checked : true,
    hardware: hardwareInput ? hardwareInput.checked : true,
    webrtc: webrtcInput ? webrtcInput.checked : true,
    timezone: timezoneInput ? timezoneInput.checked : true,
    screen: screenInput ? screenInput.checked : true,
    fonts: fontsInput ? fontsInput.checked : true,
    audio: audioInput ? audioInput.checked : true
  };

  if (!nombre) {
    mostrarNotificacion('El Nombre del perfil es requerido.', 'error');
    return;
  }

  const id = 'prf_' + Date.now();

  const nuevoPerfil = {
    id,
    nombre,
    grupo,
    etiquetas,
    startUrl,
    proxy,
    cookies,
    logoUrl: logoFinal,
    entorno,
    camuflaje,
    estadoOperativo,
    estado: estadoOperativo === 'caido' ? 'Inactivo' : 'Activo',
    ultimoAcceso: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const perfiles = obtenerPerfilesLocales();
  perfiles.push(nuevoPerfil);

  localStorage.setItem('sublicolor_perfiles', JSON.stringify(perfiles));

  mostrarNotificacion('Perfil guardado exitosamente', 'exito');
  cerrarModalPerfil();
  cargarPerfiles();
  if (typeof window.actualizarEstadisticasDashboard === 'function') {
    window.actualizarEstadisticasDashboard();
  }
}

async function cargarClientePerfiles() {
  const tbody = document.getElementById('tabla-cliente-perfiles-body');
  if (!tbody) return;

  const sesion = window.usuarioSesion || { rol: 'admin' };
  const perfiles = obtenerPerfilesLocales();

  let asignados = perfiles;
  if (sesion.rol === 'cliente' && Array.isArray(sesion.gruposPermitidos) && sesion.gruposPermitidos.length > 0) {
    asignados = perfiles.filter(p => sesion.gruposPermitidos.includes(p.grupo));
  }

  if (asignados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--texto-muted); padding: 24px;">
          No tienes perfiles asignados en tu cuenta.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = asignados.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.nombre)}</strong></td>
      <td><span class="badge ${p.estado === 'Activo' ? 'badge-active' : 'badge-idle'}">${escapeHtml(p.estado || 'Activo')}</span></td>
      <td><code>${escapeHtml(p.proxy || 'Direct Connection')}</code></td>
      <td>${escapeHtml(p.ultimoAcceso || 'Ahora')}</td>
      <td>
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirPerfil('${p.id}')">Abrir</button>
      </td>
    </tr>
  `).join('');
}

function filtrarPerfilesCliente(query) {
  const term = (query || '').toLowerCase().trim();
  const tbody = document.getElementById('tabla-cliente-perfiles-body');
  if (!tbody) return;

  const sesion = window.usuarioSesion || { rol: 'admin' };
  const perfiles = obtenerPerfilesLocales();

  let asignados = perfiles;
  if (sesion.rol === 'cliente' && Array.isArray(sesion.gruposPermitidos) && sesion.gruposPermitidos.length > 0) {
    asignados = perfiles.filter(p => sesion.gruposPermitidos.includes(p.grupo));
  }

  const filtrados = asignados.filter(p => 
    (p.nombre || '').toLowerCase().includes(term) ||
    (p.proxy || '').toLowerCase().includes(term)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--texto-muted); padding: 24px;">
          No se encontraron perfiles coincidentes.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtrados.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.nombre)}</strong></td>
      <td><span class="badge ${p.estado === 'Activo' ? 'badge-active' : 'badge-idle'}">${escapeHtml(p.estado || 'Activo')}</span></td>
      <td><code>${escapeHtml(p.proxy || 'Direct Connection')}</code></td>
      <td>${escapeHtml(p.ultimoAcceso || 'Ahora')}</td>
      <td>
        <button class="btn-secondary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirPerfil('${p.id}')">Abrir</button>
      </td>
    </tr>
  `).join('');
}

// Exposiciones globales
window.obtenerPerfilesLocales = obtenerPerfilesLocales;
window.renderFilaPerfil = renderFilaPerfil;
window.cargarPerfiles = cargarPerfiles;
window.cargarClientePerfiles = cargarClientePerfiles;
window.filtrarPerfiles = filtrarPerfiles;
window.filtrarPerfilesCliente = filtrarPerfilesCliente;
window.abrirPerfil = abrirPerfil;
window.clonarPerfil = clonarPerfil;
window.eliminarPerfil = eliminarPerfil;
window.cambiarEstadoRapido = cambiarEstadoRapido;
window.poblarSelectoresModalPerfil = poblarSelectoresModalPerfil;
window.agregarEtiquetaAInput = agregarEtiquetaAInput;
window.parsearCookiesPegadas = parsearCookiesPegadas;
window.crearNuevoPerfil = crearNuevoPerfil;
window.cerrarModalPerfil = cerrarModalPerfil;
window.guardarPerfil = guardarPerfil;
window.abrirModalGlobal = abrirModalGlobal;
window.cerrarModalGlobal = cerrarModalGlobal;
window.guardarListaNegraGlobal = guardarListaNegraGlobal;
