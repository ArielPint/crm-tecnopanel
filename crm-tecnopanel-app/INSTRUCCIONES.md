# CRM TECNOPANEL — Setup local

## Pasos para correr el proyecto

### 1. Agregar el logo
Copia el archivo `logo horizontal.jpeg` a la carpeta `public/` de este proyecto.
El archivo original está en: https://crm-tecnopanel-app.vercel.app

### 2. Instalar dependencias
Abre una terminal en esta carpeta y ejecuta:
```
npm install
```

### 3. Correr en modo desarrollo
```
npm run dev
```
La app queda disponible en http://localhost:5173

### 4. Build para producción
```
npm run build
```

---

## Estructura del proyecto

```
crm-tecnopanel-app/
├── public/
│   └── logo horizontal.jpeg     ← agregar manualmente
├── src/
│   ├── components/Layout/       ← AppLayout, Sidebar
│   ├── components/OportunidadDrawer/
│   ├── contexts/                ← AuthContext, PermisosContext
│   ├── lib/supabase.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Oportunidades/
│   │   ├── Ingenieria/
│   │   ├── Cubicacion/
│   │   ├── Presupuestos/
│   │   ├── Credito/
│   │   ├── Clientes/
│   │   └── Usuarios/
│   └── types/database.ts
├── .env.local                   ← credenciales Supabase (ya configurado)
└── package.json
```

## Base de datos
El proyecto usa la misma base de datos Supabase del sitio en producción.
URL: https://nivhygjllnbnyeyzsvth.supabase.co

Las credenciales ya están en `.env.local`.
