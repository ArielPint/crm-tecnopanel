# CRM TECNOPANEL — Especificación Técnica Final
## Fase 1: Discovery (Aprobada)
**Fecha:** 2026-06-25  
**Versión:** 2.0 (incorpora revisión de diagramas de flujo reales)

---

## 1. CONTEXTO

Sistema CRM web para gestionar el ciclo de venta completo desde la solicitud de cotización hasta el cierre (ganado/perdido). Alcance inicial: **pre-venta**. Diseñado para ser extensible a post-venta (fabricación, despacho, facturación) en fases futuras.

---

## 2. TIPOS DE VENTA Y FLUJOS

Existen 3 tipos de venta, cada uno con un flujo de etapas diferente:

### Tipo A — Proyecto
```
Clasificación → Ingeniería → Cubicación → Presupuestos → Revisión Vendedor → Revisión Cliente → Evaluación Crediticia → [Ganado | Perdido]
```

### Tipo B — Producto
```
Clasificación → Presupuestos → Revisión Vendedor → Revisión Cliente → Evaluación Crediticia → [Ganado | Perdido]
```
*(Salta Ingeniería y Cubicación)*

### Tipo C — Kit
```
Clasificación → [Ingeniería → Cubicación]? → Presupuestos → Revisión Vendedor → Revisión Cliente → Evaluación Crediticia → [Ganado | Perdido]
```
*(Ingeniería es opcional según el producto. Se indica con el campo `requiere_ingenieria`)*

---

## 3. DESCRIPCIÓN DE ETAPAS

| Etapa | Responsable | Descripción |
|---|---|---|
| Clasificación | Vendedor | Valida datos de la solicitud. Si están incompletos, pide más info al cliente. |
| Ingeniería | Jefe Ingeniería | Asigna equipo, crea carpetas, genera planos. Produce Documento de Cubicación. |
| Cubicación | Cubicador | Carga Excel con estructura de costos por línea. Produce Documento de Cubicación valorizable. |
| Presupuestos | Presupuestista | Recibe doc de cubicación, valoriza con parámetros de precio. Produce Documento de Presupuesto. |
| Revisión Vendedor | Vendedor | Revisa presupuesto. Puede ajustar el valor (requiere aprobación de Gerencia). |
| Revisión Cliente | Vendedor | Envía presupuesto al cliente. Cliente aprueba, rechaza, o negocia. |
| Evaluación Crediticia | Finanzas | Verifica estado crediticio del cliente. Cliente antiguo con crédito → OC directo. Cliente nuevo → evaluación Finanzas. |
| Ganado | Admin/Vendedor | Se carga OC y se registra monto final. |
| Perdido | Admin/Vendedor | Se registra motivo de pérdida y observaciones. |

### Reglas de transición
- No se puede avanzar de etapa sin completar la anterior.
- Para Productos y Kits sin ingeniería: el sistema salta automáticamente Ingeniería y Cubicación.
- El ajuste de precio en "Revisión Vendedor" requiere aprobación del Gerente antes de avanzar.
- En "Revisión Cliente": si el cliente negocia, vuelve a "Revisión Vendedor" (loop, no cierra).
- En "Evaluación Crediticia": si se rechaza, la oportunidad pasa a "Perdido" con motivo "Crédito rechazado".

---

## 4. MÓDULOS Y RESPONSABLES

### 4.1 Oportunidades (MVP Priority 1)
**Responsable:** Vendedor

Campos:
- `nombre` — texto
- `tipo_venta` — 'Proyecto' | 'Producto' | 'Kit'
- `requiere_ingenieria` — booleano (solo aplica a Kits)
- `importe_estimado` — decimal
- `fecha_cierre_estimada` — fecha
- `etapa` — ver lista de etapas
- `observaciones` — texto largo
- `cliente_id` — FK a clientes
- `responsable_id` — FK a profiles (vendedor asignado)
- `probabilidad` — 0–100%
- `fuente` — texto

### 4.2 Ingeniería (Priority 2)
**Responsable:** Jefe de Ingeniería → Ingenieros de Línea

- Recibe oportunidades desde "Clasificación"
- Crea carpeta de trabajo y asigna tareas a ingenieros/dibujantes
- Cada tarea: nombre, descripción, responsable, horas estimadas, estado
- Adjuntos por tarea: DWG y PDF (máx 50MB)
- Producto final: Documento de Cubicación (base para el área de Cubicación)

### 4.3 Cubicación (Priority 3)
**Responsable:** Cubicador

- Recibe documento de Ingeniería
- Carga Excel con estructura de costos por línea
- Sistema parsea Excel y almacena costo total
- Producto final: Documento de Cubicación valorizable (enviado a Presupuestos)

### 4.4 Presupuestos (Priority 4) — NUEVO
**Responsable:** Presupuestista

- Recibe documento de Cubicación
- Valoriza con parámetros de precio configurados
- Genera Documento de Presupuesto
- Adjunto: PDF de presupuesto interno
- Envía a Vendedor para revisión

### 4.5 Revisión Vendedor (Priority 4b)
**Responsable:** Vendedor (+ Gerente para aprobar ajustes)

- Vendedor revisa el presupuesto generado
- Puede ajustar el valor (requiere aprobación de `gerente_ventas` o `gerente_general`)
- Registra: valor original, valor ajustado, motivo ajuste, aprobado_por
- Envía presupuesto final al cliente

### 4.6 Revisión Cliente (Priority 4c)
**Responsable:** Vendedor

- Registra respuesta del cliente: 'Aprobado' | 'Rechazado' | 'Negociando'
- Si negocia → vuelve a "Revisión Vendedor"
- Si rechaza → "Perdido" con motivo "Rechazo de presupuesto"
- Si aprueba → avanza a "Evaluación Crediticia"

### 4.7 Evaluación Crediticia (Priority 5) — NUEVO
**Responsable:** Finanzas

- Tipo de cliente: 'antiguo_con_credito' | 'nuevo'
- Si antiguo con crédito → genera OC directamente
- Si nuevo → evaluación formal: resultado 'Aprobado' | 'Rechazado'
- Si rechazado → "Perdido" con motivo "Crédito rechazado"

### 4.8 Cierre (Priority 6)
**Responsable:** Vendedor / Admin

**Ganado:**
- Carga OC (PDF)
- Monto final confirmado
- Fecha de cierre real

**Perdido:**
- Motivo: 'Precio' | 'Competencia' | 'Cliente desistió' | 'Crédito rechazado' | 'Rechazo de presupuesto' | 'Otra'
- Observaciones

---

## 5. MODELO DE DATOS (SQL COMPLETO)

```sql
-- =============================================
-- EXTENSIÓN UUID
-- =============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES (extiende auth.users con roles)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN (
    'admin', 'gerente_ventas', 'gerente_general',
    'vendedor', 'jefe_ingenieria', 'ingeniero',
    'cubicador', 'presupuestista', 'finanzas'
  )),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- CLIENTES
-- =============================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  rut VARCHAR(20),
  email VARCHAR(255),
  telefono VARCHAR(20),
  industria VARCHAR(100),
  tipo_cliente VARCHAR(20) DEFAULT 'nuevo' CHECK (tipo_cliente IN ('nuevo', 'antiguo')),
  tiene_credito BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- OPORTUNIDADES
-- =============================================
CREATE TABLE oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  nombre VARCHAR(255) NOT NULL,
  tipo_venta VARCHAR(20) NOT NULL CHECK (tipo_venta IN ('Proyecto', 'Producto', 'Kit')),
  requiere_ingenieria BOOLEAN DEFAULT TRUE, -- solo relevante para tipo 'Kit'
  importe_estimado DECIMAL(14, 2),
  fecha_cierre_estimada DATE,
  etapa VARCHAR(50) NOT NULL DEFAULT 'Clasificación' CHECK (etapa IN (
    'Clasificación', 'Ingeniería', 'Cubicación', 'Presupuestos',
    'Revisión Vendedor', 'Revisión Cliente', 'Evaluación Crediticia',
    'Ganado', 'Perdido'
  )),
  probabilidad INTEGER CHECK (probabilidad BETWEEN 0 AND 100),
  fuente VARCHAR(100),
  observaciones TEXT,
  responsable_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- TAREAS DE INGENIERÍA
-- =============================================
CREATE TABLE tareas_ingenieria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidad_id UUID NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  responsable_id UUID REFERENCES profiles(id),
  horas_estimadas INTEGER,
  estado VARCHAR(30) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En progreso', 'Completada')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ARCHIVOS DE INGENIERÍA (DWG, PDF)
-- =============================================
CREATE TABLE archivos_ingenieria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tareas_ingenieria(id) ON DELETE CASCADE,
  oportunidad_id UUID NOT NULL REFERENCES oportunidades(id),
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) CHECK (tipo IN ('DWG', 'PDF')),
  url_storage VARCHAR(500) NOT NULL,
  tamano_mb DECIMAL(6, 2),
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- CUBICACIÓN
-- =============================================
CREATE TABLE cubicacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidad_id UUID NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  nombre VARCHAR(255),
  responsable_id UUID REFERENCES profiles(id),
  horas_estimadas INTEGER,
  costo_total DECIMAL(14, 2),
  estado VARCHAR(30) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Análisis', 'Completada')),
  archivo_excel_url VARCHAR(500),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- PRESUPUESTOS (Área de Presupuestos — valorización interna)
-- =============================================
CREATE TABLE presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidad_id UUID NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  responsable_id UUID REFERENCES profiles(id), -- presupuestista
  cubicacion_id UUID REFERENCES cubicacion(id),
  monto_cubicacion DECIMAL(14, 2),   -- valor recibido de cubicación
  monto_presupuesto DECIMAL(14, 2),  -- valor valorizado por presupuestos
  archivo_pdf_url VARCHAR(500),
  observaciones TEXT,
  estado VARCHAR(30) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Emitido')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- REVISIÓN DE PRESUPUESTO (Vendedor + aprobación Gerencia)
-- =============================================
CREATE TABLE revision_presupuesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidad_id UUID NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  presupuesto_id UUID REFERENCES presupuestos(id),
  vendedor_id UUID REFERENCES profiles(id),
  monto_original DECIMAL(14, 2),
  monto_ajustado DECIMAL(14, 2),     -- NULL si no hubo ajuste
  requiere_aprobacion BOOLEAN DEFAULT FALSE,
  aprobado_por UUID REFERENCES profiles(id),
  aprobado_at TIMESTAMP,
  motivo_ajuste TEXT,
  estado VARCHAR(30) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Ajustado', 'Aprobado', 'Enviado a Cliente')),
  fecha_envio_cliente TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- REVISIÓN CLIENTE
-- =============================================
CREATE TABLE revision_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidad_id UUID NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  respuesta VARCHAR(20) CHECK (respuesta IN ('Aprobado', 'Rechazado', 'Negociando')),
  observaciones TEXT,
  fecha_respuesta TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- EVALUACIÓN CREDITICIA
-- =============================================
CREATE TABLE evaluacion_crediticia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidad_id UUID NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  responsable_id UUID REFERENCES profiles(id), -- finanzas
  tipo_cliente VARCHAR(30) CHECK (tipo_cliente IN ('antiguo_con_credito', 'nuevo')),
  resultado VARCHAR(20) DEFAULT 'Pendiente' CHECK (resultado IN ('Pendiente', 'Aprobado', 'Rechazado')),
  observaciones TEXT,
  fecha_evaluacion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- CIERRES
-- =============================================
CREATE TABLE cierres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidad_id UUID NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  tipo_cierre VARCHAR(10) NOT NULL CHECK (tipo_cierre IN ('Ganado', 'Perdido')),
  monto_final DECIMAL(14, 2),
  archivo_oc_url VARCHAR(500),
  motivo_perdida VARCHAR(50) CHECK (motivo_perdida IN (
    'Precio', 'Competencia', 'Cliente desistió',
    'Crédito rechazado', 'Rechazo de presupuesto', 'Otra'
  )),
  observaciones TEXT,
  fecha_cierre DATE,
  registrado_por UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. BUCKETS DE SUPABASE STORAGE

| Bucket | Ruta | Acceso |
|---|---|---|
| `ingenieria` | `/{oportunidad_id}/{tarea_id}/{archivo}` | Privado |
| `cubicacion` | `/{oportunidad_id}/{archivo}` | Privado |
| `presupuestos` | `/{oportunidad_id}/{archivo}` | Privado |
| `ordenes_compra` | `/{oportunidad_id}/{archivo}` | Privado |

Todos los buckets son privados. Las URLs se generan con signed URLs de corta duración (1 hora).

---

## 7. ROLES Y PERMISOS

| Rol | Descripción | Puede ver | Puede crear/editar |
|---|---|---|---|
| `admin` | Administrador total | Todo | Todo + configuración |
| `gerente_general` | Aprobación de ajustes de precio | Todas las oportunidades | Aprobar ajustes |
| `gerente_ventas` | Gestión del equipo de ventas | Oportunidades de su equipo | Crear oportunidades, aprobar ajustes |
| `vendedor` | Agente de ventas | Sus oportunidades | Crear/editar oportunidades, cargar OC |
| `jefe_ingenieria` | Lider de ingeniería | Proyectos asignados | Asignar tareas, crear tareas |
| `ingeniero` | Ingeniero de línea | Tareas asignadas a él | Cargar archivos, actualizar tareas |
| `cubicador` | Área de cubicación | Cubicaciones asignadas | Cargar Excel, actualizar cubicación |
| `presupuestista` | Área de presupuestos | Presupuestos asignados | Crear y emitir presupuestos |
| `finanzas` | Evaluación crediticia | Evaluaciones asignadas | Registrar resultado crediticio |

---

## 8. REGLAS DE NEGOCIO CLAVE

1. **Flujo según tipo de venta:** El sistema debe calcular automáticamente qué etapas aplican al crear la oportunidad.
2. **Ajuste de precio:** Si `monto_ajustado != monto_original`, se activa flag `requiere_aprobacion`. La oportunidad no puede avanzar hasta que `aprobado_por` tenga valor.
3. **Loop de negociación:** Si `revision_cliente.respuesta = 'Negociando'`, la etapa vuelve a 'Revisión Vendedor' y se crea nuevo registro en `revision_presupuesto`.
4. **Crédito automático:** Si `clientes.tipo_cliente = 'antiguo'` y `clientes.tiene_credito = TRUE`, se puede crear el cierre directamente sin evaluación manual.
5. **Archivos:** Validar tipo MIME en frontend y backend. Máximo 50MB por archivo.
6. **RLS:** Cada usuario solo ve datos según su rol. Se implementa con Supabase Row Level Security.

---

## 9. ETAPAS POR TIPO DE VENTA (para lógica frontend)

```javascript
const etapasPorTipo = {
  'Proyecto': [
    'Clasificación', 'Ingeniería', 'Cubicación', 'Presupuestos',
    'Revisión Vendedor', 'Revisión Cliente', 'Evaluación Crediticia'
  ],
  'Producto': [
    'Clasificación', 'Presupuestos',
    'Revisión Vendedor', 'Revisión Cliente', 'Evaluación Crediticia'
  ],
  'Kit (sin ingeniería)': [
    'Clasificación', 'Presupuestos',
    'Revisión Vendedor', 'Revisión Cliente', 'Evaluación Crediticia'
  ],
  'Kit (con ingeniería)': [
    'Clasificación', 'Ingeniería', 'Cubicación', 'Presupuestos',
    'Revisión Vendedor', 'Revisión Cliente', 'Evaluación Crediticia'
  ]
}
// Cierre (Ganado/Perdido) aplica a todos los tipos
```

---

## 10. WORKFLOW DE DESARROLLO (ACTUALIZADO)

| Fase | Contenido | Estado |
|---|---|---|
| Fase 1 | Discovery — flujos, modelo de datos, roles | ✅ Completada |
| Fase 2 | Schema en Supabase + RLS + estructura React + rutas | 🔜 Pendiente aprobación |
| Fase 3 | MVP Oportunidades (CRUD + auth + dashboard) | ⏳ |
| Fase 4 | Módulo Ingeniería (tareas + archivos) | ⏳ |
| Fase 5 | Módulo Cubicación (Excel + costos) | ⏳ |
| Fase 6 | Módulo Presupuestos + Revisión Vendedor/Cliente | ⏳ |
| Fase 7 | Evaluación Crediticia + Cierre | ⏳ |
| Fase 8 | Reportes + producción | ⏳ |

---

## 11. PENDIENTES CONFIRMADOS ANTES DE FASE 2

- [x] Flujos por tipo de venta definidos
- [x] Etapas completas definidas
- [x] Roles completos definidos
- [x] Modelo de datos corregido
- [x] Buckets de storage definidos
- [ ] **¿Quién tiene el rol de aprobar ajustes de precio: `gerente_ventas` o `gerente_general`?** (o ambos)
- [ ] **Datos de prueba:** ¿ficticios o reales?

---

*Documento generado en Fase 1 Discovery — CRM TECNOPANEL*
