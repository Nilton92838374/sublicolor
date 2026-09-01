// ==========================================
//   SUBLICOLOR - MÓDULO DE FACTURACIÓN & FINANZAS
// ==========================================

let busquedaFacturacion = '';

function cargarFacturacion() {
  const tbody = document.getElementById('tabla-facturacion-body');
  if (!tbody) return;

  const usuarios = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];
  const hoyMs = new Date().getTime();

  let ingresosEstimados = 0;
  let pagosPendientesCount = 0;
  let clientesActivosCount = 0;

  const filtrados = usuarios.filter(u => 
    (u.usuario || '').toLowerCase().includes(busquedaFacturacion)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
          No hay registros financieros que coincidan.
        </td>
      </tr>
    `;
    actualizarKPIsFacturacion(0, 0, 0);
    return;
  }

  tbody.innerHTML = filtrados.map(u => {
    const tarifa = u.tarifaMensual !== undefined ? parseFloat(u.tarifaMensual) || 0 : 29.99;
    let esActivo = true;
    let diasRestantes = 999;
    let statusBadge = '<span class="badge badge-active">Al día</span>';

    if (u.fechaVencimiento) {
      const vencMs = new Date(u.fechaVencimiento).getTime();
      if (!isNaN(vencMs)) {
        diasRestantes = Math.ceil((vencMs - hoyMs) / (1000 * 60 * 60 * 24));
        esActivo = vencMs >= hoyMs;
      }
    }

    if (esActivo) {
      ingresosEstimados += tarifa;
      clientesActivosCount++;
    }

    if (!esActivo) {
      pagosPendientesCount++;
      statusBadge = `<span class="badge badge-idle" style="color: #dc2626; background: #fee2e2; border-color: #fca5a5;">Vencido</span>`;
    } else if (diasRestantes <= 3) {
      pagosPendientesCount++;
      statusBadge = `<span class="tag-badge" style="color: #b45309; background: #fef3c7; border-color: #fde68a;">Pendiente (${diasRestantes}d)</span>`;
    } else {
      statusBadge = `<span class="badge badge-active">Al día</span>`;
    }

    const packsHtml = (u.gruposPermitidos && u.gruposPermitidos.length > 0)
      ? u.gruposPermitidos.map(g => `<span class="tag-badge">📦 ${escapeHtml(g)}</span>`).join('')
      : '<span style="color: var(--text-muted); font-size: 11px;">Todos los Packs</span>';

    const fechaVencTexto = u.fechaVencimiento ? u.fechaVencimiento.replace('T', ' ') : 'Indefinido';

    return `
      <tr>
        <td><strong>${escapeHtml(u.usuario)}</strong></td>
        <td>${packsHtml}</td>
        <td><strong style="color: #059669;">${typeof window.formatearDolares === 'function' ? window.formatearDolares(tarifa) : '$ ' + tarifa.toFixed(2) + ' USD'}</strong></td>
        <td>${escapeHtml(fechaVencTexto)}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn-submit" style="padding: 4px 10px; font-size: 11px;" onclick="registrarPago('${u.id}')">💳 Registrar Pago (+1 Mes)</button>
        </td>
      </tr>
    `;
  }).join('');

  actualizarKPIsFacturacion(ingresosEstimados, pagosPendientesCount, clientesActivosCount);
}

function actualizarKPIsFacturacion(ingresos, pendientes, activos) {
  const kpiIngresos = document.getElementById('kpi-ingresos') || document.getElementById('kpi-ingresos-estimados');
  const kpiPendientes = document.getElementById('kpi-pendientes') || document.getElementById('kpi-pagos-pendientes');
  const kpiActivos = document.getElementById('kpi-activos') || document.getElementById('kpi-clientes-activos');

  if (kpiIngresos) kpiIngresos.innerText = typeof window.formatearDolares === 'function' ? window.formatearDolares(ingresos) : '$ ' + ingresos.toFixed(2) + ' USD';
  if (kpiPendientes) kpiPendientes.innerText = pendientes;
  if (kpiActivos) kpiActivos.innerText = activos;
}

function filtrarFacturacion(query) {
  busquedaFacturacion = (query || '').toLowerCase().trim();
  cargarFacturacion();
}

function registrarPago(idCliente) {
  const usuarios = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];
  const idx = usuarios.findIndex(u => String(u.id) === String(idCliente));

  if (idx === -1) {
    mostrarNotificacion('Cliente no encontrado.', 'error');
    return;
  }

  const cliente = usuarios[idx];
  let fechaBase = new Date();

  if (cliente.fechaVencimiento) {
    const parsed = new Date(cliente.fechaVencimiento);
    if (!isNaN(parsed.getTime()) && parsed.getTime() > fechaBase.getTime()) {
      fechaBase = parsed;
    }
  }

  fechaBase.setMonth(fechaBase.getMonth() + 1);

  const pad = (num) => String(num).padStart(2, '0');
  const nuevaVencStr = `${fechaBase.getFullYear()}-${pad(fechaBase.getMonth() + 1)}-${pad(fechaBase.getDate())}T${pad(fechaBase.getHours())}:${pad(fechaBase.getMinutes())}`;

  cliente.fechaVencimiento = nuevaVencStr;
  usuarios[idx] = cliente;

  localStorage.setItem('sublicolor_usuarios', JSON.stringify(usuarios));
  mostrarNotificacion(`¡Pago registrado para ${cliente.usuario}! Suscripción renovada por 1 mes.`, 'exito');

  cargarFacturacion();

  if (typeof window.actualizarEstadisticasDashboard === 'function') {
    window.actualizarEstadisticasDashboard();
  }
}

// Exposiciones globales
window.cargarFacturacion = cargarFacturacion;
window.filtrarFacturacion = filtrarFacturacion;
window.registrarPago = registrarPago;
