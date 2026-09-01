// ==========================================
//   SUBLICOLOR - MÓDULO DE DASHBOARD ANALÍTICO
// ==========================================

function cargarMetricas() {
  const perfiles = typeof window.obtenerPerfilesLocales === 'function' ? window.obtenerPerfilesLocales() : [];
  const proxies = typeof window.obtenerProxiesLocales === 'function' ? window.obtenerProxiesLocales() : [];
  const usuarios = typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [];
  const staff = typeof window.obtenerStaffLocal === 'function' ? window.obtenerStaffLocal() : [];
  const grupos = typeof window.obtenerGruposLocales === 'function' ? window.obtenerGruposLocales() : [];
  const etiquetas = typeof window.obtenerEtiquetasLocales === 'function' ? window.obtenerEtiquetasLocales() : [];
  const cuentas = typeof window.obtenerCuentasLocales === 'function' ? window.obtenerCuentasLocales() : [];

  const totalPerfiles = perfiles.length;
  const perfilesActivos = perfiles.filter(p => p.estado === 'Activo' || !p.estado).length;
  const totalProxies = proxies.length;
  const totalClientes = usuarios.length;

  // Cálculo de Cuentas por Expirar (menos de 15 días desde hoy o ya expiradas)
  const hoyMs = new Date().getTime();
  const limite15DiasMs = hoyMs + (15 * 24 * 60 * 60 * 1000);

  const cuentasExpirando = cuentas.filter(c => {
    if (!c.fechaExpiracion) return false;
    const expMs = new Date(c.fechaExpiracion).getTime();
    return expMs <= limite15DiasMs;
  }).length;

  // Inyección de Métricas Principales
  const elPerfilesActivos = document.getElementById('stat-perfiles-activos');
  const elFooterPerfiles = document.getElementById('stat-footer-perfiles');
  const elProxiesActivos = document.getElementById('stat-proxies-activos');
  const elFooterProxies = document.getElementById('stat-footer-proxies');
  const elTotalClientes = document.getElementById('stat-total-clientes');
  const elCuentasExpirando = document.getElementById('stat-cuentas-expirando');
  const elFooterCuentas = document.getElementById('stat-footer-cuentas');

  if (elPerfilesActivos) elPerfilesActivos.innerText = perfilesActivos;
  if (elFooterPerfiles) elFooterPerfiles.innerText = `${totalPerfiles} perfiles creados`;
  if (elProxiesActivos) elProxiesActivos.innerText = totalProxies;
  if (elFooterProxies) elFooterProxies.innerText = `${totalProxies} servidores en total`;
  if (elTotalClientes) elTotalClientes.innerText = totalClientes;
  if (elCuentasExpirando) {
    elCuentasExpirando.innerText = cuentasExpirando;
    if (cuentasExpirando > 0) {
      elCuentasExpirando.style.color = '#dc2626';
    } else {
      elCuentasExpirando.style.color = '#059669';
    }
  }
  if (elFooterCuentas) elFooterCuentas.innerText = cuentasExpirando === 1 ? '1 cuenta en riesgo' : `${cuentasExpirando} cuentas en riesgo`;

  // Inyección de Panel de Estado del Sistema
  const elStaffCount = document.getElementById('dash-staff-count');
  const elGruposCount = document.getElementById('dash-grupos-count');
  const elEtiquetasCount = document.getElementById('dash-etiquetas-count');

  const totalAdmins = staff.filter(s => s.rol === 'Admin').length;
  const totalResellers = staff.filter(s => s.rol === 'Reseller').length;

  if (elStaffCount) elStaffCount.innerText = `${totalAdmins} Admins / ${totalResellers} Resellers`;
  if (elGruposCount) elGruposCount.innerText = `${grupos.length} creados`;
  if (elEtiquetasCount) elEtiquetasCount.innerText = `${etiquetas.length} registradas`;

  // Inyección de Tabla Preview: Últimos Clientes Registrados
  const tbodyClientes = document.getElementById('dash-ultimos-clientes-body');
  if (tbodyClientes) {
    if (usuarios.length === 0) {
      tbodyClientes.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 16px;">
            No hay clientes registrados aún.
          </td>
        </tr>
      `;
    } else {
      const ultimos = usuarios.slice(-5).reverse();
      const hoyStr = new Date().toISOString().split('T')[0];

      tbodyClientes.innerHTML = ultimos.map(u => {
        const esActivo = !u.fechaVencimiento || u.fechaVencimiento >= hoyStr;
        const badgeSuscripcion = esActivo
          ? `<span class="badge badge-active">Activo</span>`
          : `<span class="badge badge-idle" style="color: #dc2626; border-color: #fca5a5;">Vencido</span>`;

        return `
          <tr>
            <td><strong>${escapeHtml(u.usuario)}</strong></td>
            <td>${badgeSuscripcion}</td>
            <td><code>${escapeHtml(u.fechaVencimiento || 'Indefinido')}</code></td>
          </tr>
        `;
      }).join('');
    }
  }
}

// Exposiciones globales
window.cargarMetricas = cargarMetricas;
window.actualizarEstadisticasDashboard = cargarMetricas;
