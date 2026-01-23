# Notary CRM

Aplicación personal de Notary CRM. Esta versión incluye:

- Frontend (vanilla JS) en `public/` con integración a Firebase (Auth, Firestore). (Storage eliminado)
- Un backend opcional en `server/` (Express + SQLite) para persistencia en SQL y sincronización local.

Este repositorio ya incluye reglas para Firestore (`firebase.rules`) y configuración mínima (`firebase.json`).

## Rápido resumen de lo que implementé

- Autenticación con Firebase Auth (email/password).
- Roles (`/users/{uid}`) con `role: 'user'` por defecto y posibilidad de promover a `admin`.
- CRUD completo para clientes y casos usando Firestore (realtime) y además sincronizando con un servidor SQL local (Express + SQLite).
-- En esta versión no se suben archivos a Firebase Storage; los casos no almacenan adjuntos en Storage.
-- Reglas de seguridad de Firestore para permitir acceso solo al `ownerId` o `admin`.
- Preparé `firebase.json` para Hosting y reglas.

## Estructura relevante

```
.
├── public/                 # Frontend static site (index.html, app.js, styles.css)
├── server/                 # Optional Express backend with SQLite (notary.db)
│   ├── index.js
│   └── package.json
├── firebase.rules
 
├── firebase.json
└── README.md
```

## Ejecutar localmente (recomendado flujo de desarrollo)

1) Backend SQL (opcional, para guardar también en SQL):

```powershell
cd server
npm install
npm start

# el servidor escuchará en http://localhost:5000
```

2) Servir `public/` desde un servidor estático (o Firebase Hosting después):

```powershell
# desde la raíz del repo
python -m http.server 5500 --directory public
# abrir http://localhost:5500
```

3) Usar Firebase (opcional pero necesario para Auth/Firestore reales):

```powershell
npm install -g firebase-tools
firebase login
# inicializar si no lo hiciste: firebase init (elige Hosting y Firestore)
firebase deploy --only hosting,firestore
```

Nota: el frontend intentará sincronizar con el backend SQL en `http://localhost:5000/api/...` si está activo. En producción deberías usar una API segura (Cloud Functions, Cloud Run, etc.).

## CI/CD (GitHub Actions)

También puedo añadir un workflow para desplegar automáticamente a Firebase cuando pushes a `main`. Necesitas un `FIREBASE_TOKEN` (ci token) en los Secrets de GitHub.

## Reminders / Recordatorios (local)

La aplicación ahora incluye una funcionalidad de recordatorios que se ejecuta completamente en el navegador sin necesidad de servidor:

- Abre el botón "Recordatorios" en el header para crear, listar y eliminar recordatorios.
- Los recordatorios se guardan en `localStorage` (clave `notary_reminders_v1`).
- Cuando llega la hora, la app intenta mostrar una notificación del navegador (Notification API). Si el navegador bloquea notificaciones, la app mostrará un `alert()` como fallback.
- No se envían datos a ningún servicio externo: todo se gestiona localmente.

## Tests

- Se añadió una prueba de humo (smoke) para validar la presencia de `public/index.html`.
- Ejecutar desde la carpeta `server`:

```powershell
cd server
npm run test:smoke
```

## Notas sobre deploy

- No pude ejecutar `firebase deploy` en este entorno porque no dispongo de las credenciales del proyecto del usuario. Para desplegar:

	- Localmente (interactivo):

	```powershell
	npm install -g firebase-tools
	firebase login
	firebase deploy --only hosting,firestore
	```

	- CI/GitHub Actions: añade `FIREBASE_TOKEN` en los Secrets y el workflow en `.github/workflows/firebase-deploy.yml` hará el deploy automático al hacer push a `main`.


## Seguridad y Reglas

- `firebase.rules` contiene las reglas de Firestore (ownerId + admin checks).
-- No hay reglas de Storage en este repo (Storage eliminado).

## Siguientes mejoras recomendadas (puedo implementarlas):

- Paginación y búsqueda avanzada (indexación Firestore).
- Cache offline con Firestore persistence.
- Exportar a CSV/JSON.
- Notificaciones y recordatorios (Cloud Functions + SendGrid / FCM).
- Crear GitHub Action para deploy automático.

---

Si quieres, procedo con:

- implementar paginación y búsqueda avanzada ahora (sugerido), o
- generar GitHub Action para CI/CD y luego intentar `firebase deploy` desde este entorno (nota: deploy requiere que el entorno esté autenticado o que proporciones un token CI).

Dime cuál prefieres y continúo.
