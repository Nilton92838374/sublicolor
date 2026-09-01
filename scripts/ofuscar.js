const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'js');
const distDir = path.join(__dirname, '..', 'dist_obfuscated', 'src', 'js');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const configOfuscacion = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

console.log('[Seguridad Nivel 4] Iniciando ofuscación militar del código fuente JavaScript...');

const archivos = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

archivos.forEach(archivo => {
  const rutaEntrada = path.join(srcDir, archivo);
  const rutaSalida = path.join(distDir, archivo);
  const codigo = fs.readFileSync(rutaEntrada, 'utf8');

  try {
    const resultado = JavaScriptObfuscator.obfuscate(codigo, configOfuscacion);
    fs.writeFileSync(rutaSalida, resultado.getObfuscatedCode(), 'utf8');
    console.log(`  ✓ Ofuscado: src/js/${archivo}`);
  } catch (err) {
    console.error(`  ✕ Error al ofuscar ${archivo}:`, err.message);
  }
});

console.log('[Seguridad Nivel 4] Ofuscación completada exitosamente.');
