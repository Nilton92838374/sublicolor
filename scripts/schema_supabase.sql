-- ==========================================
-- SUBLICOLOR SAAS - TABLA DE CLIENTES Y CONTROL DE DISPOSITIVOS
-- COPIAR Y PEGAR EN EL "SQL EDITOR" DE SUPABASE
-- ==========================================

-- 1. Crear tabla 'clientes'
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    device_id_activo TEXT DEFAULT NULL,
    suscripcion_vence TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    plan VARCHAR(50) DEFAULT 'Enterprise',
    tarifa_mensual NUMERIC(10, 2) DEFAULT 29.99,
    grupos_permitidos JSONB DEFAULT '["General"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ACTIVAR REALTIME WEBSOCKETS EN LA TABLA CLIENTES
ALTER PUBLICATION supabase_realtime ADD TABLE public.clientes;

-- 3. Crear índices de rendimiento por usuario y dispositivo
CREATE INDEX IF NOT EXISTS idx_clientes_usuario ON public.clientes(usuario);
CREATE INDEX IF NOT EXISTS idx_clientes_device ON public.clientes(device_id_activo);

-- 4. Habilitar Row Level Security (RLS) y Políticas de Acceso
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica de clientes" ON public.clientes;
CREATE POLICY "Permitir lectura publica de clientes" ON public.clientes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica de clientes" ON public.clientes;
CREATE POLICY "Permitir actualizacion publica de clientes" ON public.clientes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de clientes" ON public.clientes;
CREATE POLICY "Permitir insercion publica de clientes" ON public.clientes FOR INSERT WITH CHECK (true);

-- 5. Insertar registros iniciales de prueba
INSERT INTO public.clientes (usuario, password, device_id_activo, plan)
VALUES 
  ('admin', '••••••••', 'HWID_INICIAL_ADMIN', 'Enterprise'),
  ('juanperez', '••••••••', 'HWID_INICIAL_CLIENTE', 'Basic')
ON CONFLICT (usuario) DO NOTHING;
