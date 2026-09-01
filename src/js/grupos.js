// ==========================================
//   SUBLICOLOR - MÓDULO DE GRUPOS Y ETIQUETAS
// ==========================================

const KEY_GRUPOS = 'sublicolor_grupos_lista';
const KEY_ETIQUETAS = 'sublicolor_etiquetas_lista';

function obtenerGruposLocales() {
  const dataRaw = localStorage.getItem(KEY_GRUPOS) || localStorage.getItem('sublicolor_grupos');
  if (!dataRaw) {
    const iniciales = ['General', 'Ventas', 'Farming', 'Crypto'];
    localStorage.setItem(KEY_GRUPOS, JSON.stringify(iniciales));
    localStorage.setItem('sublicolor_grupos', JSON.stringify(iniciales));
    return iniciales;
  }

  try {
    return JSON.parse(dataRaw) || [];
  } catch (e) {
    console.error('Error al parsear grupos desde localStorage:', e);
    return [];
  }
}

function obtenerEtiquetasLocales() {
  const dataRaw = localStorage.getItem(KEY_ETIQUETAS) || localStorage.getItem('sublicolor_etiquetas');
  if (!dataRaw) {
    const iniciales = ['Ads', 'VIP', 'HighRisk', 'Warmup', 'Tier1'];
    localStorage.setItem(KEY_ETIQUETAS, JSON.stringify(iniciales));
    localStorage.setItem('sublicolor_etiquetas', JSON.stringify(iniciales));
    return iniciales;
  }

  try {
    return JSON.parse(dataRaw) || [];
  } catch (e) {
    console.error('Error al parsear etiquetas desde localStorage:', e);
    return [];
  }
}

function renderizarListas() {
  const gruposGuardados = obtenerGruposLocales();
  const etiquetasGuardadas = obtenerEtiquetasLocales();

  const divGrupos = document.getElementById('lista-grupos-registrados') || document.getElementById('container-lista-grupos');
  const divEtiquetas = document.getElementById('lista-etiquetas-registradas') || document.getElementById('container-lista-etiquetas');
  
  if (divGrupos) {
    divGrupos.innerHTML = gruposGuardados.length === 0 
      ? '<span class="texto-vacio">No hay grupos registrados.</span>' 
      : gruposGuardados.map((g, index) => `
        <div class="chip-item chip-grupo">
          <span>${escapeHtml(g)}</span>
          <button type="button" onclick="eliminarGrupo(${index})" class="btn-eliminar-chip" title="Eliminar grupo">✖</button>
        </div>
      `).join('');
  }
  
  if (divEtiquetas) {
    divEtiquetas.innerHTML = etiquetasGuardadas.length === 0 
      ? '<span class="texto-vacio">No hay etiquetas registradas.</span>' 
      : etiquetasGuardadas.map((e, index) => `
        <div class="chip-item chip-etiqueta">
          <span># ${escapeHtml(e)}</span>
          <button type="button" onclick="eliminarEtiqueta(${index})" class="btn-eliminar-chip" title="Eliminar etiqueta">✖</button>
        </div>
      `).join('');
  }
}

function agregarGrupo() {
  const input = document.getElementById('input-nuevo-grupo');
  const valor = input ? input.value.trim() : '';
  const gruposGuardados = obtenerGruposLocales();

  if (valor && !gruposGuardados.includes(valor)) {
    gruposGuardados.push(valor);
    localStorage.setItem(KEY_GRUPOS, JSON.stringify(gruposGuardados));
    localStorage.setItem('sublicolor_grupos', JSON.stringify(gruposGuardados));
    if (input) input.value = '';
    if (typeof mostrarNotificacion === 'function') mostrarNotificacion(`Grupo "${valor}" agregado.`, 'exito');
    renderizarListas();
  } else if (!valor) {
    if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Ingresa un nombre para el grupo.', 'error');
  } else {
    if (typeof mostrarNotificacion === 'function') mostrarNotificacion('El grupo ya existe.', 'error');
  }
}

function agregarEtiqueta() {
  const input = document.getElementById('input-nueva-etiqueta');
  const valor = input ? input.value.trim() : '';
  const etiquetasGuardadas = obtenerEtiquetasLocales();

  if (valor && !etiquetasGuardadas.includes(valor)) {
    etiquetasGuardadas.push(valor);
    localStorage.setItem(KEY_ETIQUETAS, JSON.stringify(etiquetasGuardadas));
    localStorage.setItem('sublicolor_etiquetas', JSON.stringify(etiquetasGuardadas));
    if (input) input.value = '';
    if (typeof mostrarNotificacion === 'function') mostrarNotificacion(`Etiqueta "#${valor}" agregada.`, 'exito');
    renderizarListas();
  } else if (!valor) {
    if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Ingresa un nombre para la etiqueta.', 'error');
  } else {
    if (typeof mostrarNotificacion === 'function') mostrarNotificacion('La etiqueta ya existe.', 'error');
  }
}

function eliminarGrupo(indexOrName) {
  let gruposGuardados = obtenerGruposLocales();
  if (typeof indexOrName === 'number') {
    gruposGuardados.splice(indexOrName, 1);
  } else {
    gruposGuardados = gruposGuardados.filter(g => g !== indexOrName);
  }
  localStorage.setItem(KEY_GRUPOS, JSON.stringify(gruposGuardados));
  localStorage.setItem('sublicolor_grupos', JSON.stringify(gruposGuardados));
  if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Grupo eliminado.', 'exito');
  renderizarListas();
}

function eliminarEtiqueta(indexOrName) {
  let etiquetasGuardadas = obtenerEtiquetasLocales();
  if (typeof indexOrName === 'number') {
    etiquetasGuardadas.splice(indexOrName, 1);
  } else {
    etiquetasGuardadas = etiquetasGuardadas.filter(e => e !== indexOrName);
  }
  localStorage.setItem(KEY_ETIQUETAS, JSON.stringify(etiquetasGuardadas));
  localStorage.setItem('sublicolor_etiquetas', JSON.stringify(etiquetasGuardadas));
  if (typeof mostrarNotificacion === 'function') mostrarNotificacion('Etiqueta eliminada.', 'exito');
  renderizarListas();
}

function cargarGrupos() {
  renderizarListas();
}

function cargarGruposYEtiquetas() {
  renderizarListas();
}

function guardarNuevoGrupo(e) {
  if (e) e.preventDefault();
  agregarGrupo();
}

function guardarNuevaEtiqueta(e) {
  if (e) e.preventDefault();
  agregarEtiqueta();
}

document.addEventListener('DOMContentLoaded', renderizarListas);

// Exposiciones globales
window.KEY_GRUPOS = KEY_GRUPOS;
window.KEY_ETIQUETAS = KEY_ETIQUETAS;
window.obtenerGruposLocales = obtenerGruposLocales;
window.obtenerEtiquetasLocales = obtenerEtiquetasLocales;
window.renderizarListas = renderizarListas;
window.agregarGrupo = agregarGrupo;
window.agregarEtiqueta = agregarEtiqueta;
window.eliminarGrupo = eliminarGrupo;
window.eliminarEtiqueta = eliminarEtiqueta;
window.cargarGrupos = cargarGrupos;
window.cargarGruposYEtiquetas = cargarGruposYEtiquetas;
window.guardarNuevoGrupo = guardarNuevoGrupo;
window.guardarNuevaEtiqueta = guardarNuevaEtiqueta;
