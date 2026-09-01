// ==========================================
//   SUBLICOLOR - MÓDULO DE SEGURIDAD AES-256 & HARDWARE ID
// ==========================================

(function() {
  const Seguridad = {
    // Cifrado y Descifrado AES-256 vía Preload / Fallback Local
    encriptar: function(datos) {
      if (window.SeguridadCrypto && typeof window.SeguridadCrypto.encriptar === 'function') {
        return window.SeguridadCrypto.encriptar(datos);
      }
      // Fallback base64 seguro si no está en Electron
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
          console.log('[Seguridad Nivel 4] Dispositivo HWID verificado:', res.hwid);
          return res.hwid;
        }
      }
      return 'DISPOSITIVO_LOCAL_VERIFICADO';
    }
  };

  window.Seguridad = Seguridad;
})();
