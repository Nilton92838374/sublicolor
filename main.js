const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { autoUpdater } = require('electron-updater');
const { machineIdSync } = require('node-machine-id');
const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.SUBLICOLOR_SECRET_KEY || 'SUBLICOLOR_SECURE_ENCRYPTION_KEY_2026_AES256';

// ------------------------------------------
// 1. CAPA 1: BLOQUEO DE HARDWARE (ANTI-COPIA & ANTI-PIRATERÍA)
// ------------------------------------------
let hardwareId = '';
try {
  hardwareId = machineIdSync({ original: true });
  console.log('[Seguridad Nivel 4] Hardware ID (Placa Base & Procesador):', hardwareId);
} catch (hwidErr) {
  console.error('[Seguridad Nivel 4] Error al obtener Hardware ID:', hwidErr.message);
  hardwareId = 'HWID_' + os.hostname() + '_' + os.arch();
}

ipcMain.handle('obtener-hardware-id', () => {
  return { ok: true, hwid: hardwareId };
});

// Helper de Descifrado AES-256 en Main Process
function desencriptarCadena(cifrado) {
  try {
    if (!cifrado || typeof cifrado !== 'string') return cifrado;
    if (!cifrado.startsWith('U2FsdGVkX1')) return cifrado; // No es cifrado de CryptoJS
    const bytes = CryptoJS.AES.decrypt(cifrado, SECRET_KEY);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    if (!text) return cifrado;
    try { return JSON.parse(text); } catch (e) { return text; }
  } catch (e) {
    return cifrado;
  }
}

// Configuración del Módulo Auto-Updater Blindado
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('error', (err) => {
  console.log('Error de actualización:', err);
});

autoUpdater.on('checking-for-update', () => {
  console.log('Buscando actualizaciones...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Actualización disponible:', info.version);
});

autoUpdater.on('update-not-available', () => {
  console.log('La aplicación está en la versión más reciente.');
});

// ESCUCHADOR IPC BLINDADO PARA LANZAMIENTO DE PUPPETEER
ipcMain.on('abrir-puppeteer', async (event, payload) => {
  try {
    const perfil = (payload && payload.perfil) ? payload.perfil : payload;
    const reglasGlobales = (payload && payload.reglasGlobales !== undefined) ? payload.reglasGlobales : '';

    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;
    
    // Asegurar que la carpeta base exista
    const baseDir = path.join(app.getPath('userData'), 'perfiles_aislados');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    
    const userDataPath = path.join(baseDir, String(perfil.id));

    let argsLanzamiento = [
      '--app=about:blank', // Forzar Modo App sin barra de URL
      '--start-maximized',
      '--disable-notifications',
      '--disable-restore-session-state'
    ];

    if (perfil.proxy && perfil.proxy !== 'Direct Connection') {
      argsLanzamiento.push(`--proxy-server=${perfil.proxy}`);
    }

    if (perfil.camuflaje && perfil.camuflaje.webrtc) {
      argsLanzamiento.push('--disable-webrtc');
      argsLanzamiento.push('--force-webrtc-ip-handling-policy=disable_non_proxied_udp');
    }

    const browser = await puppeteer.launch({
      headless: false,
      channel: 'chrome',
      userDataDir: userDataPath,
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: null,
      args: argsLanzamiento
    });

    const pages = await browser.pages();
    const mainPage = pages.length > 0 ? pages[0] : await browser.newPage();

    // Inyectar Coherencia de Hardware y SO
    await mainPage.evaluateOnNewDocument((entorno) => {
        if (!entorno) return;

        // 1. Falsificar Memoria RAM y Procesador
        if (entorno.ram) {
            Object.defineProperty(navigator, 'deviceMemory', { 
                get: () => parseInt(entorno.ram) 
            });
            let cores = parseInt(entorno.ram) >= 16 ? 8 : 4;
            Object.defineProperty(navigator, 'hardwareConcurrency', { 
                get: () => cores 
            });
        }

        // 2. Falsificar Plataforma del Sistema Operativo
        if (entorno.so && entorno.so.includes('macOS')) {
            Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
        } else {
            Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        }
    }, perfil.entorno);

    // Inyectar Evasiones Antidetect en el Documento antes de cargar
    if (perfil.camuflaje) {
      await mainPage.evaluateOnNewDocument((cam) => {
        // 1. Hardware Concurrency fallback
        if (cam.hardware && !navigator.deviceMemory) {
          Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
          Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
        }

        // 2. Screen Resolution Spoofing
        if (cam.screen) {
          Object.defineProperty(window.screen, 'width', { get: () => 1920 });
          Object.defineProperty(window.screen, 'height', { get: () => 1080 });
          Object.defineProperty(window.screen, 'availWidth', { get: () => 1920 });
          Object.defineProperty(window.screen, 'availHeight', { get: () => 1040 });
        }

        // 3. Canvas Noise Injection
        if (cam.canvas) {
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL = function (type) {
            const context = this.getContext('2d');
            if (context) {
              const imageData = context.getImageData(0, 0, this.width, this.height);
              for (let i = 0; i < imageData.data.length; i += 64) {
                imageData.data[i] = imageData.data[i] ^ 1;
              }
              context.putImageData(imageData, 0, 0);
 context.putImageData(imageData, 0, 0);
            }
            return originalToDataURL.apply(this, arguments);
          };
        }

        // 4. WebGL Spoofing
        if (cam.webgl) {
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function (parameter) {
            if (parameter === 37445) return 'Google Inc. (NVIDIA)';
            if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)';
            return getParameter.apply(this, arguments);
          };
        }

        // 5. AudioContext Noise
        if (cam.audio) {
          const originalGetChannelData = AudioBuffer.prototype.getChannelData;
          AudioBuffer.prototype.getChannelData = function () {
            const results = originalGetChannelData.apply(this, arguments);
            for (let i = 0; i < results.length; i += 100) {
              results[i] = results[i] + 0.0000001 * Math.random();
            }
            return results;
          };
        }
      }, perfil.camuflaje);
    }

    // INYECCIÓN DE COOKIES (DESENCRIPTANDO AES-256 SI ES NECESARIO)
    if (perfil.cookies && perfil.cookies !== '') {
        try {
            let cookiesRaw = perfil.cookies;
            if (typeof cookiesRaw === 'string' && cookiesRaw.startsWith('U2FsdGVkX1')) {
              cookiesRaw = desencriptarCadena(cookiesRaw);
            }
            const cookiesArray = typeof cookiesRaw === 'string' ? JSON.parse(cookiesRaw) : cookiesRaw;
            if (Array.isArray(cookiesArray) && cookiesArray.length > 0) {
                await mainPage.setCookie(...cookiesArray);
                console.log(`[Seguridad Nivel 4] Cookies AES-256 descifradas e inyectadas exitosamente para: ${perfil.nombre}`);
            }
        } catch (error) {
            console.error(`[Error] Fallo al inyectar cookies en ${perfil.nombre}:`, error);
        }
    }

    // INTERCEPCIÓN COMBINADA DE CORTAFUEGOS (LOCAL & GLOBAL)
    await mainPage.setRequestInterception(true);

    const rutasLocalRaw = perfil.rutasBloqueadas || perfil.rutasProhibidas || perfil.listaNegra || '';
    const rutasLocal = typeof rutasLocalRaw === 'string' ? rutasLocalRaw.split('\n') : (Array.isArray(rutasLocalRaw) ? rutasLocalRaw : []);
    const rutasGlobal = typeof reglasGlobales === 'string' ? reglasGlobales.split('\n') : (Array.isArray(reglasGlobales) ? reglasGlobales : []);

    const rutasProhibidas = [...rutasLocal, ...rutasGlobal]
        .map(ruta => String(ruta).trim().toLowerCase())
        .filter(ruta => ruta !== '');

    mainPage.on('request', (request) => {
        const urlDestino = request.url().toLowerCase();
        const accesoDenegado = rutasProhibidas.some(ruta => ruta && urlDestino.includes(ruta));

        if (accesoDenegado) {
            console.log(`[Cortafuegos] Acceso DENEGADO a: ${urlDestino}`);
            request.abort('accessdenied');
        } else {
            request.continue();
        }
    });

    const urlInicio = perfil.link || perfil.startUrl || 'https://100prepremium.com';

    try {
      await mainPage.goto(urlInicio, { waitUntil: 'networkidle2', timeout: 60000 });
    } catch (navError) {
      console.error('Error de navegación (Revisar Proxy):', navError);
    }

    if (pages.length > 1) {
      for (let i = 1; i < pages.length; i++) {
        try {
          await pages[i].close();
        } catch (e) { /* ignorar */ }
      }
    }

  } catch (error) {
    console.error('Fallo crítico al iniciar Puppeteer:', error);
    event.reply('error-motor', error.message);
  }
});

// MANEJADOR IPC PARA VERIFICACIÓN REAL DE PROXIES
ipcMain.handle('verificar-proxy', async (event, proxyConfig) => {
  try {
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    const axiosModule = await import('axios');
    const axios = axiosModule.default || axiosModule;

    if (!proxyConfig || !proxyConfig.ip || !proxyConfig.puerto) {
      return { ok: false, exito: false, error: 'IP y Puerto son requeridos', mensaje: 'IP y Puerto son requeridos' };
    }

    let proxyUrl = 'http://';
    if (proxyConfig.usuario && (proxyConfig.password || proxyConfig.contrasena)) {
      const pass = proxyConfig.password || proxyConfig.contrasena;
      proxyUrl += `${encodeURIComponent(proxyConfig.usuario)}:${encodeURIComponent(pass)}@`;
    }
    proxyUrl += `${proxyConfig.ip}:${proxyConfig.puerto}`;

    const agent = new HttpsProxyAgent(proxyUrl);

    const respuesta = await axios.get('http://ip-api.com/json', {
      httpsAgent: agent,
      httpAgent: agent,
      proxy: false,
      timeout: 10000
    });

    if (respuesta.data && (respuesta.data.status === 'success' || respuesta.data.country || respuesta.data.query)) {
      const pais = respuesta.data.country || 'Verificado';
      const ip = respuesta.data.query || proxyConfig.ip;
      return {
        ok: true,
        exito: true,
        country: pais,
        ip: ip,
        mensaje: `Conectado: ${pais} - ${ip}`
      };
    } else {
      throw new Error('El proxy no devolvió una IP válida.');
    }
  } catch (error) {
    console.error('Error al verificar proxy:', error.message);
    return {
      ok: false,
      exito: false,
      error: error.message,
      mensaje: error.message
    };
  }
});

// IPC Handler para Limpieza Profunda de Caché
ipcMain.handle('limpiar-cache-motor', async () => {
  try {
    const tempDir = path.join(__dirname, 'userDataDir_temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    return { ok: true, exito: true, mensaje: 'Caché y archivos temporales del motor limpiados correctamente.' };
  } catch (err) {
    console.error('Error al limpiar caché:', err.message);
    return { ok: false, exito: false, error: err.message, mensaje: 'Error al limpiar caché: ' + err.message };
  }
});

// ------------------------------------------
// 3. CAPA 3: CIERRE DE PUERTAS TRASERAS (BLOQUEO DE DEVTOOLS Y ATAJOS)
// ------------------------------------------
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#050505',
    show: false,
    title: 'Sublicolor',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      devTools: false // Cierre de DevTools por configuración
    }
  });

  mainWindow.setMenuBarVisibility(false);

  // Bloqueo estricto de DevTools si se intenta abrir por algún medio
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow.webContents.closeDevTools();
    console.log('Intento de inspección bloqueado.');
  });

  // Bloqueo de atajos de teclado de inspección (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (
      input.key === 'F12' ||
      (input.control && input.shift && (input.key.toLowerCase() === 'i' || input.key.toLowerCase() === 'j' || input.key.toLowerCase() === 'c')) ||
      (input.control && input.key.toLowerCase() === 'u')
    ) {
      event.preventDefault();
      console.log('[Seguridad Nivel 4] Intento de inspección por atajo de teclado bloqueado.');
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    console.log('Error al ejecutar checkForUpdatesAndNotify:', err);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
