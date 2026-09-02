const { contextBridge, ipcRenderer } = require('electron');
const CryptoJS = require('crypto-js');

// Clave Secreta Fuerte Oculta en Entorno / Preload
const SECRET_KEY = process.env.SUBLICOLOR_SECRET_KEY || 'SUBLICOLOR_SECURE_ENCRYPTION_KEY_2026_AES256';

// Exponer API de Cifrado AES-256 Militar
contextBridge.exposeInMainWorld('SeguridadCrypto', {
  encriptar: (datos) => {
    try {
      const str = typeof datos === 'object' ? JSON.stringify(datos) : String(datos);
      return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
    } catch (e) {
      console.error('[Seguridad Nivel 4] Error al encriptar:', e);
      return null;
    }
  },
  desencriptar: (cifrado) => {
    try {
      if (!cifrado) return null;
      const bytes = CryptoJS.AES.decrypt(cifrado, SECRET_KEY);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      if (!originalText) return null;
      try {
        return JSON.parse(originalText);
      } catch (jsonErr) {
        return originalText;
      }
    } catch (e) {
      console.error('[Seguridad Nivel 4] Error al desencriptar:', e);
      return null;
    }
  }
});

// Exponer API segura para comunicación IPC bidireccional con el backend
contextBridge.exposeInMainWorld('api', {
  lanzarPerfil: (datosPerfil) => ipcRenderer.send('abrir-puppeteer', datosPerfil),
  recibirErrorMotor: (callback) => ipcRenderer.on('error-motor', (event, mensaje) => callback(mensaje)),
  verificarProxy: (datosProxy) => ipcRenderer.invoke('verificar-proxy', datosProxy),
  limpiarCacheMotor: () => ipcRenderer.invoke('limpiar-cache-motor'),
  obtenerHardwareId: () => ipcRenderer.invoke('obtener-hardware-id'),
  comprobarActualizaciones: () => ipcRenderer.invoke('buscar-actualizaciones'),
  onEstadoActualizacion: (callback) => ipcRenderer.on('estado-actualizacion', (event, data) => callback(data))
});

// Compatibilidad con información del sistema
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
  appVersion: '1.0.0'
});
