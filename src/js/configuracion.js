// ==========================================
//   SUBLICOLOR - MÓDULO DE CONFIGURACIÓN DE SISTEMA
// ==========================================

function exportarBaseDeDatos() {
  try {
    const data = {
      fechaExportacion: new Date().toISOString(),
      perfiles: typeof window.obtenerPerfilesLocales === 'function' ? window.obtenerPerfilesLocales() : [],
      proxies: typeof window.obtenerProxiesLocales === 'function' ? window.obtenerProxiesLocales() : [],
      usuarios: typeof window.obtenerUsuariosLocales === 'function' ? window.obtenerUsuariosLocales() : [],
      staff: typeof window.obtenerStaffLocal === 'function' ? window.obtenerStaffLocal() : [],
      grupos: typeof window.obtenerGruposLocales === 'function' ? window.obtenerGruposLocales() : [],
      etiquetas: typeof window.obtenerEtiquetasLocales === 'function' ? window.obtenerEtiquetasLocales() : [],
      cuentas: typeof window.obtenerCuentasLocales === 'function' ? window.obtenerCuentasLocales() : []
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `sublicolor_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarNotificacion('Respaldo exportado correctamente.', 'exito');
  } catch (error) {
    console.error('Error al exportar base de datos:', error);
    mostrarNotificacion('Error al exportar respaldo: ' + error.message, 'error');
  }
}

function importarBaseDeDatos(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);

      if (data.perfiles && Array.isArray(data.perfiles)) {
        localStorage.setItem('sublicolor_perfiles', JSON.stringify(data.perfiles));
      }
      if (data.proxies && Array.isArray(data.proxies)) {
        localStorage.setItem('sublicolor_proxies', JSON.stringify(data.proxies));
      }
      if (data.usuarios && Array.isArray(data.usuarios)) {
        localStorage.setItem('sublicolor_usuarios', JSON.stringify(data.usuarios));
      }
      if (data.staff && Array.isArray(data.staff)) {
        localStorage.setItem('sublicolor_staff', JSON.stringify(data.staff));
      }
      if (data.grupos && Array.isArray(data.grupos)) {
        localStorage.setItem('sublicolor_grupos', JSON.stringify(data.grupos));
      }
      if (data.etiquetas && Array.isArray(data.etiquetas)) {
        localStorage.setItem('sublicolor_etiquetas', JSON.stringify(data.etiquetas));
      }
      if (data.cuentas && Array.isArray(data.cuentas)) {
        localStorage.setItem('sublicolor_cuentas', JSON.stringify(data.cuentas));
      }

      mostrarNotificacion('Base de datos importada correctamente. Actualizando...', 'exito');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error al importar base de datos:', error);
      mostrarNotificacion('Archivo JSON no válido.', 'error');
    }
  };
  reader.readAsText(file);
}

function cargarConfiguracionesGenerales() {
  const configRaw = localStorage.getItem('sublicolor_config_general');
  if (!configRaw) return;

  try {
    const config = JSON.parse(configRaw);

    const elAutobloqueo = document.getElementById('config-autobloqueo');
    const elHoraInicio = document.getElementById('config-hora-inicio');
    const elHoraFin = document.getElementById('config-hora-fin');
    const elMensaje = document.getElementById('config-mensaje-fuera-horario');

    if (elAutobloqueo && config.autobloqueo !== undefined) elAutobloqueo.value = config.autobloqueo;
    if (elHoraInicio && config.horaInicio) elHoraInicio.value = config.horaInicio;
    if (elHoraFin && config.horaFin) elHoraFin.value = config.horaFin;
    if (elMensaje && config.mensajeFueraHorario) elMensaje.value = config.mensajeFueraHorario;
  } catch (e) {
    console.error('Error al cargar configuraciones generales:', e);
  }
}

function guardarConfiguracionesGenerales() {
  const elAutobloqueo = document.getElementById('config-autobloqueo');
  const elHoraInicio = document.getElementById('config-hora-inicio');
  const elHoraFin = document.getElementById('config-hora-fin');
  const elMensaje = document.getElementById('config-mensaje-fuera-horario');

  const config = {
    autobloqueo: elAutobloqueo ? elAutobloqueo.value : '0',
    horaInicio: elHoraInicio ? elHoraInicio.value : '08:00',
    horaFin: elHoraFin ? elHoraFin.value : '20:00',
    mensajeFueraHorario: elMensaje ? elMensaje.value.trim() : ''
  };

  localStorage.setItem('sublicolor_config_general', JSON.stringify(config));
  mostrarNotificacion('Ajustes de sistema guardados.', 'exito');
}

async function limpiarCacheMotorBackend() {
  if (window.api && typeof window.api.limpiarCacheMotor === 'function') {
    try {
      const res = await window.api.limpiarCacheMotor();
      if (res && (res.ok || res.exito)) {
        mostrarNotificacion(res.mensaje || 'Caché y temporales limpiados correctamente.', 'exito');
      } else {
        mostrarNotificacion('Error al limpiar caché: ' + (res.error || res.mensaje), 'error');
      }
    } catch (err) {
      console.error('Error al invocar IPC limpiarCacheMotor:', err);
      mostrarNotificacion('Error de comunicación IPC: ' + err.message, 'error');
    }
  } else {
    mostrarNotificacion('Caché temporal borrada localmente.', 'exito');
  }
}

function cargarConfiguracionMotor() {
  cargarConfiguracionesGenerales();
}

// Exposiciones globales
window.exportarBaseDeDatos = exportarBaseDeDatos;
window.importarBaseDeDatos = importarBaseDeDatos;
window.cargarConfiguracionesGenerales = cargarConfiguracionesGenerales;
window.guardarConfiguracionesGenerales = guardarConfiguracionesGenerales;
window.limpiarCacheMotorBackend = limpiarCacheMotorBackend;
window.cargarConfiguracionMotor = cargarConfiguracionMotor;
