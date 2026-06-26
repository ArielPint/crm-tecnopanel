# CRM TECNOPANEL

Sistema web de gestión comercial — pipeline de ventas desde solicitud hasta cierre.

## Módulos

- **Oportunidades** — Pipeline kanban con etapas según tipo de venta
- **Ingeniería** — Gestión de tareas y planos (DWG/PDF)
- **Cubicación** — Carga de costos via Excel
- **Presupuestos** — Valorización y emisión de documentos
- **Evaluación Crediticia** — Revisión de clientes nuevos
- **Cierre** — OC ganada / pérdida con motivo

## Flujo según tipo de venta

| Tipo | Etapas |
|------|--------|
| Proyecto | Clasificación → Ingeniería → Cubicación → Presupuestos → Rev. Vendedor → Rev. Cliente → Eval. Crediticia |
| Producto | Clasificación → Presupuestos → Rev. Vendedor → Rev. Cliente → Eval. Crediticia |
| Kit | Clasificación → (Ingeniería → Cubicación)? → Presupuestos → Rev. Vendedor → Rev. Cliente → Eval. Crediticia |

## Roles

Admin · Gerente de Ventas · Vendedor · Jefe Ingeniería · Ingeniero · Cubicador · Presupuestista · Finanzas

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Deploy | GitHub Pages (maqueta) / Vercel (producción) |

## Estado del proyecto

- [x] Fase 1: Discovery y especificación técnica
- [x] Fase 2: Maqueta interactiva (este repo)
- [ ] Fase 3: MVP Oportunidades con Supabase + React
- [ ] Fase 4: Módulo Ingeniería (tareas + archivos)
- [ ] Fase 5: Cubicación + Presupuestos
- [ ] Fase 6: Evaluación Crediticia + Cierre
- [ ] Fase 7: Deploy a producción

## Ver maqueta

🔗 [https://arielpint.github.io/crm-tecnopanel](https://arielpint.github.io/crm-tecnopanel)
