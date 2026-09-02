// ==========================================
//   SUBLICOLOR - CONFIGURACIÓN SEGURA DE SUPABASE & DOTENV
// ==========================================

try {
  require('dotenv').config();
} catch (e) {
  // Carga en entorno navegador / bundle
}

const supabaseUrl = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_URL) 
  ? process.env.SUPABASE_URL 
  : 'https://tu-proyecto.supabase.co';

const supabaseKey = (typeof process !== 'undefined' && process.env && process.env.SUPABASE_KEY) 
  ? process.env.SUPABASE_KEY 
  : '';

let supabase = null;

if (typeof require !== 'undefined') {
  try {
    const { createClient } = require('@supabase/supabase-js');
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('tu-proyecto')) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  } catch (err) {
    console.warn('[Supabase Config] Advertencia al crear cliente Node:', err.message);
  }
}

if (typeof window !== 'undefined') {
  window.SUPABASE_URL = supabaseUrl;
  window.SUPABASE_KEY = supabaseKey;
  window.supabaseClient = supabase;

  window.initSupabaseClient = function() {
    if (!window.supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('tu-proyecto')) {
        window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
      }
    }
    return window.supabaseClient;
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = supabase;
}
