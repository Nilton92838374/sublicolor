// Configuración de Supabase para Sublicolor
// Reemplaza las credenciales a continuación con las de tu proyecto de Supabase
const SUPABASE_CONFIG = {
  url: 'https://tu-proyecto.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1LXByb3llY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDA0MDAwMDAsImV4cCI6MTkyMDAwMDAwMH0.placeholder'
};

// Adjuntar cliente al objeto window para evitar redeclaraciones en scripts
window.supabaseClient = null;

function initSupabase() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return window.supabaseClient;
  }
  return null;
}

window.initSupabase = initSupabase;
