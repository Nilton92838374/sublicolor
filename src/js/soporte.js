// ==========================================
//   SUBLICOLOR - CONTROLADOR TICKETS DE SOPORTE ADMIN
// ==========================================

let busquedaTicketsQuery = '';

function obtenerTicketsLocales() {
  try {
    return JSON.parse(localStorage.getItem('sublicolor_tickets')) || [];
  } catch (e) {
    console.error('Error parseando sublicolor_tickets:', e);
    return [];
  }
}

function cargarTicketsAdmin() {
  const tbody = document.getElementById('tabla-tickets-body');
  if (!tbody) return;

  const tickets = obtenerTicketsLocales();

  const filtrados = tickets.filter(t => 
    (t.usuario || '').toLowerCase().includes(busquedaTicketsQuery) ||
    (t.cuenta || '').toLowerCase().includes(busquedaTicketsQuery) ||
    (t.mensaje || '').toLowerCase().includes(busquedaTicketsQuery)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">
          No hay tickets de soporte pendientes o registrados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtrados.map(t => {
    const esResuelto = t.estado === 'Resuelto';
    const badgeEstado = esResuelto
      ? '<span class="badge badge-active" style="background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">Resuelto</span>'
      : '<span class="badge badge-idle" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">Abierto</span>';

    return `
      <tr>
        <td><code>${escapeHtml(t.id)}</code></td>
        <td><strong>${escapeHtml(t.usuario)}</strong></td>
        <td><span class="tag-badge">📦 ${escapeHtml(t.cuenta || 'General')}</span></td>
        <td style="max-width: 260px; font-size: 12.5px; color: var(--text-main);">${escapeHtml(t.mensaje)}</td>
        <td style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(t.fecha || 'Reciente')}</td>
        <td>${badgeEstado}</td>
        <td>
          ${!esResuelto ? `<button class="btn-submit" style="padding: 4px 8px; font-size: 11px; margin-right: 4px; background-color: #10b981;" onclick="resolverTicket('${t.id}')">✓ Resolver</button>` : ''}
          <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #dc2626; border-color: #fca5a5; background: #fee2e2;" onclick="eliminarTicket('${t.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function resolverTicket(idTicket) {
  const tickets = obtenerTicketsLocales();
  const t = tickets.find(x => String(x.id) === String(idTicket));
  if (t) {
    t.estado = 'Resuelto';
    localStorage.setItem('sublicolor_tickets', JSON.stringify(tickets));
    mostrarNotificacion(`Ticket de ${t.usuario} marcado como Resuelto`, 'exito');
    cargarTicketsAdmin();
  }
}

function eliminarTicket(idTicket) {
  let tickets = obtenerTicketsLocales();
  const t = tickets.find(x => String(x.id) === String(idTicket));
  const usuarioStr = t ? t.usuario : 'el cliente';

  if (!confirm(`¿Deseas eliminar el ticket de soporte de ${usuarioStr}?`)) return;

  tickets = tickets.filter(x => String(x.id) !== String(idTicket));
  localStorage.setItem('sublicolor_tickets', JSON.stringify(tickets));
  mostrarNotificacion('Ticket de soporte eliminado.', 'exito');
  cargarTicketsAdmin();
}

function filtrarTicketsAdmin(query) {
  busquedaTicketsQuery = (query || '').toLowerCase().trim();
  cargarTicketsAdmin();
}

// Exposiciones globales
window.obtenerTicketsLocales = obtenerTicketsLocales;
window.cargarTicketsAdmin = cargarTicketsAdmin;
window.resolverTicket = resolverTicket;
window.eliminarTicket = eliminarTicket;
window.filtrarTicketsAdmin = filtrarTicketsAdmin;
