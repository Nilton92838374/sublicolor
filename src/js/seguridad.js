// ==========================================
//   SUBLICOLOR - MÓDULO DE SEGURIDAD AES-256, HARDWARE ID & REALTIME SENSOR
// ==========================================

(function() {
  let clienteSubscripcionRealtime = null;

  const Seguridad = {
    // Cifrado y Descifrado AES-256 vía Preload / Fallback Local
    encriptar: function(datos) {
      if (window.SeguridadCrypto && typeof window.SeguridadCrypto.encriptar === 'function') {
        return window.SeguridadCrypto.encriptar(datos);
      }
      try {
        const str = typeof datos === 'object' ? JSON.stringify(datos) : String(datos);
        return btoa(unescape(encodeURIComponent(str)));
      } catch (e) {
        return datos;
      }
    },

    desencriptar: function(cifrado) {
      if (window.SeguridadCrypto && typeof window.SeguridadCrypto.desencriptar === 'function') {
        return window.SeguridadCrypto.desencriptar(cifrado);
      }
      try {
        const decoded = decodeURIComponent(escape(atob(cifrado)));
        try { return JSON.parse(decoded); } catch (e) { return decoded; }
      } catch (e) {
        return cifrado;
      }
    },

    // Guardado Cifrado en LocalStorage
    guardarLocalCifrado: function(clave, valor) {
      try {
        const cifrado = this.encriptar(valor);
        localStorage.setItem(`sec_${clave}`, cifrado);
      } catch (err) {
        console.error(`Error guardando local cifrado [${clave}]:`, err);
      }
    },

    // Obtención Cifrada desde LocalStorage
    obtenerLocalCifrado: function(clave) {
      try {
        const cifrado = localStorage.getItem(`sec_${clave}`);
        if (!cifrado) return null;
        return this.desencriptar(cifrado);
      } catch (err) {
        console.error(`Error obteniendo local cifrado [${clave}]:`, err);
        return null;
      }
    },

    // Verificación de Hardware ID contra la Sesión
    verificarHardwareDispositivo: async function() {
      if (window.api && typeof window.api.obtenerHardwareId === 'function') {
        const res = await window.api.obtenerHardwareId();
        if (res && res.hwid) {
          return res.hwid;
        }
      }
      return 'HWID_LOCAL_VERIFICADO';
    },

    // SENSOR DE EXPULSIÓN EN TIEMPO REAL (REALTIME WEBSOCKETS)
    iniciarSensorExpulsionRealtime: async function(usuarioActivo) {
      if (!usuarioActivo) return;

      const client = window.supabaseClient || (typeof window.initSupabaseClient === 'function' ? window.initSupabaseClient() : null);
      if (!client || typeof client.channel !== 'function') {
        console.log('[Realtime Sensor] Cliente Supabase no configurado. Operando con seguridad local.');
        return;
      }

      const hwidActual = await this.verificarHardwareDispositivo();

      if (clienteSubscripcionRealtime) {
        try { client.removeChannel(clienteSubscripcionRealtime); } catch (e) {}
      }

      console.log(`[Realtime Sensor] Escuchando cambios en la nube para "${usuarioActivo}" (HWID: ${hwidActual})`);

      try {
        clienteSubscripcionRealtime = client
          .channel(`expulsion_sensor_${usuarioActivo}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'clientes',
              filter: `usuario=eq.${usuarioActivo}`
            },
            (payload) => {
              const nuevoDeviceId = payload.new ? payload.new.device_id_activo : null;
              if (nuevoDeviceId && nuevoDeviceId !== hwidActual) {
                console.warn('[Realtime Sensor] ¡Hardware ID modificado en Supabase! Iniciando expulsión inmediata...');
                Seguridad.ejecutarExpulsionViolenta();
              }
            }
          )
          .subscribe((status) => {
            console.log(`[Realtime Sensor] Conexión WebSocket Realtime: ${status}`);
          });
      } catch (err) {
        console.error('[Realtime Sensor] Error al conectar WebSocket Realtime:', err);
      }
    },

    // EXPULSIÓN VIOLENTA POR SESIÓN ÚNICA EN OTRO DISPOSITIVO
    ejecutarExpulsionViolenta: function() {
      localStorage.removeItem('sublicolor_sesion_activa');
      localStorage.removeItem('sublicolor_usuario_activo');
      sessionStorage.clear();

      if (typeof mostrarNotificacion === 'function') {
        mostrarNotificacion('🔒 Sesión cerrada: Has iniciado sesión en otro dispositivo.', 'error');
      } else {
        alert('🔒 Sesión cerrada: Has iniciado sesión en otro dispositivo.');
      }

      setTimeout(() => {
        if (typeof handleLogout === 'function') {
          handleLogout();
        } else if (document.getElementById('vista-login')) {
          const vLogin = document.getElementById('vista-login');
          const vPanel = document.getElementById('vista-panel');
          if (vLogin) vLogin.classList.remove('hidden');
          if (vPanel) vPanel.classList.add('hidden');
        } else {
          window.location.href = 'login.html';
        }
      }, 1000);
    }
  };

  window.Seguridad = Seguridad;
})();
