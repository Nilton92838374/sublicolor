// ==========================================
//   SUBLICOLOR - CONTROLADOR DE ANUNCIOS & NOTIFICACIONES
// ==========================================

function obtenerAnunciosLocales() {
  try {
    return JSON.parse(localStorage.getItem('sublicolor_anuncios')) || [];
  } catch (e) {
    console.error('Error parseando sublicolor_anuncios:', e);
    return [];
  }
}

function publicarAnuncio(e) {
  if (e) e.preventDefault();

  const textoInput = document.getElementById('texto-anuncio');
  const mensaje = textoInput ? textoInput.value.trim() : '';

  if (!mensaje) {
    mostrarNotificacion('Escribe un mensaje para publicar el aviso.', 'error');
    return;
  }

  const sesion = window.usuarioSesion || { usuario: 'Admin' };
  const anuncios = obtenerAnunciosLocales();

  const nuevoAnuncio = {
    id: 'anc_' + Date.now(),
    mensaje,
    autor: sesion.usuario || 'Administración',
    fecha: new Date().toLocaleString([], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  };

  anuncios.unshift(nuevoAnuncio);
  localStorage.setItem('sublicolor_anuncios', JSON.stringify(anuncios));

  if (textoInput) textoInput.value = '';

  mostrarNotificacion('📢 Comunicado publicado exitosamente en los paneles de clientes.', 'exito');
  cargarAnunciosAdmin();
  actualizarCampanitaNotificaciones();
}

function eliminarAnuncio(idAnuncio) {
  let anuncios = obtenerAnunciosLocales();
  anuncios = anuncios.filter(a => String(a.id) !== String(idAnuncio));
  localStorage.setItem('sublicolor_anuncios', JSON.stringify(anuncios));

  mostrarNotificacion('Aviso eliminado.', 'exito');
  cargarAnunciosAdmin();
  actualizarCampanitaNotificaciones();
}

function cargarAnunciosAdmin() {
  const container = document.getElementById('lista-anuncios-admin');
  if (!container) return;

  const anuncios = obtenerAnunciosLocales();

  if (anuncios.length === 0) {
    container.innerHTML = `
      <div style="background-color: var(--bg-body); border: 1px dashed var(--border-light); border-radius: 10px; padding: 24px; text-align: center;">
        <p style="font-size: 12.5px; color: var(--text-muted); margin: 0;">No se han publicado avisos todavía.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = anuncios.map(a => `
    <div style="background-color: var(--bg-body); border: 1px solid var(--border-light); border-radius: 10px; padding: 14px; position: relative;">
      <p style="font-size: 13px; color: var(--text-main); margin: 0 0 6px 0; line-height: 1.4;">${escapeHtml(a.mensaje)}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
        <span>✍️ ${escapeHtml(a.autor)} - 📅 ${escapeHtml(a.fecha)}</span>
        <button type="button" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 11px; font-weight: 600;" onclick="eliminarAnuncio('${a.id}')">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function toggleNotificaciones(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('panel-notificaciones');
  if (!panel) return;

  panel.classList.toggle('oculto');
  if (!panel.classList.contains('oculto')) {
    actualizarCampanitaNotificaciones();
  }
}

function actualizarCampanitaNotificaciones() {
  const badgeContador = document.getElementById('badge-notif-contador');
  const listaMensajes = document.getElementById('lista-mensajes-cliente');
  const anuncios = obtenerAnunciosLocales();

  if (badgeContador) {
    badgeContador.innerText = anuncios.length;
    badgeContador.style.display = anuncios.length > 0 ? 'flex' : 'none';
  }

  if (listaMensajes) {
    if (anuncios.length === 0) {
      listaMensajes.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12.5px;">
          No hay avisos ni comunicados recientes.
        </div>
      `;
    } else {
      listaMensajes.innerHTML = anuncios.map(a => `
        <div class="item-notif">
          <strong>📢 Comunicado:</strong> ${escapeHtml(a.mensaje)}
          <span class="fecha-notif">📅 ${escapeHtml(a.fecha)}</span>
        </div>
      `).join('');
    }
  }
}

// Cerrar panel de notificaciones al hacer clic fuera
document.addEventListener('click', (e) => {
  if (!e.target.closest('#contenedor-campanita-topbar')) {
    const panel = document.getElementById('panel-notificaciones');
    if (panel) panel.classList.add('oculto');
  }
});

// Exposiciones globales
window.obtenerAnunciosLocales = obtenerAnunciosLocales;
window.publicarAnuncio = publicarAnuncio;
window.eliminarAnuncio = eliminarAnuncio;
window.cargarAnunciosAdmin = cargarAnunciosAdmin;
window.toggleNotificaciones = toggleNotificaciones;
window.actualizarCampanitaNotificaciones = actualizarCampanitaNotificaciones;
