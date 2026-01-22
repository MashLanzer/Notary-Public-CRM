# Notary CRM - Versión Vanilla (HTML, CSS, JavaScript)

## 📋 Descripción

Aplicación CRM para servicios de notaría pública convertida a **HTML, CSS y JavaScript puro** (sin frameworks ni dependencias).

## 🚀 Características

- ✅ **100% Vanilla** - Sin React, Vite, TypeScript, TailwindCSS ni dependencias
- ✅ **Sistema de Pestañas** - Dashboard, Clientes, Casos
- ✅ **CRUD Completo** - Crear, Leer, Actualizar, Eliminar
- ✅ **Persistencia de Datos** - LocalStorage para guardar información
- ✅ **Búsqueda en Tiempo Real** - Filtrado de clientes y casos
- ✅ **Diseño Responsivo** - Móvil, tablet y escritorio
- ✅ **Modales Interactivos** - Formularios para agregar clientes y casos
- ✅ **Estadísticas en Vivo** - Dashboard con métricas calculadas dinámicamente

## 📁 Estructura de Archivos

```
vanilla/
├── index.html    # Estructura HTML completa
├── styles.css    # Sistema de diseño CSS personalizado
├── app.js        # Lógica JavaScript de la aplicación
└── README.md     # Este archivo
```

## 🎯 Cómo Usar

### Opción 1: Abrir Directamente
1. Abre el archivo `index.html` en tu navegador web
2. ¡Listo! La aplicación ya está funcionando

### Opción 2: Con Servidor Local (Recomendado)

Si tienes Python instalado:
```bash
cd vanilla
python -m http.server 8000
```

Si tienes Node.js instalado:
```bash
cd vanilla
npx serve
```

Luego abre `http://localhost:8000` en tu navegador.

## 🎨 Personalización

### Colores
Edita las variables CSS en `styles.css`:
```css
:root {
    --color-primary: #1e3a8a;      /* Azul principal */
    --color-success: #16a34a;       /* Verde (completado) */
    --color-warning: #eab308;       /* Amarillo (pendiente) */
    --color-danger: #dc2626;        /* Rojo (eliminar) */
}
```

### Tipografía
Por defecto usa Google Fonts (Inter y Poppins). Cambia en `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=TuFuente&display=swap" rel="stylesheet">
```

## 💾 Almacenamiento de Datos

Los datos se guardan automáticamente en `localStorage`:
- `notary_clients` - Lista de clientes
- `notary_cases` - Lista de casos

Para limpiar los datos:
```javascript
localStorage.clear();
location.reload();
```

## 🔧 Funcionalidades

### Dashboard
- Total de clientes
- Total de casos
- Casos completados
- Ingresos totales
- Tabla de casos recientes

### Gestión de Clientes
- Agregar nuevos clientes
- Buscar clientes por nombre
- Ver detalles (email, teléfono, dirección)
- Eliminar clientes
- Fecha de registro automática

### Gestión de Casos
- Agregar nuevos casos
- Buscar por número de caso o cliente
- Estados: Pendiente, En Progreso, Completado
- Seguimiento de montos y fechas
- Eliminar casos

## 🌐 Compatibilidad de Navegadores

- ✅ Chrome/Edge (Chromium) - Última versión
- ✅ Firefox - Última versión
- ✅ Safari - Última versión
- ⚠️ Internet Explorer - No soportado

## 📱 Responsive Design

La aplicación se adapta automáticamente a:
- 📱 Móvil: < 640px
- 📱 Tablet: 640px - 1024px
- 💻 Desktop: > 1024px

## 🎓 Estructura del Código

### JavaScript (app.js)
```javascript
NotaryCRM.init()           // Inicializar aplicación
NotaryCRM.render()         // Renderizar UI completa
NotaryCRM.addClient()      // Agregar cliente
NotaryCRM.addCase()        // Agregar caso
NotaryCRM.deleteClient()   // Eliminar cliente
NotaryCRM.deleteCase()     // Eliminar caso
```

### Datos de Ejemplo
La aplicación viene con datos de ejemplo para demostración. Se cargan automáticamente la primera vez que abres la app.

## 🔒 Seguridad

⚠️ **Nota Importante**: Esta es una aplicación de cliente (frontend only). Los datos se almacenan localmente en el navegador del usuario. Para un entorno de producción, deberías:

1. Implementar un backend (Node.js, PHP, Python, etc.)
2. Usar una base de datos (MySQL, PostgreSQL, MongoDB, etc.)
3. Agregar autenticación de usuarios
4. Implementar validación del lado del servidor

## 📝 Notas de Conversión

Esta versión vanilla fue convertida desde:
- React 19.2.1
- Vite 7.1.7
- TypeScript 5.6.3
- TailwindCSS 4.1.14
- Radix UI Components

Toda la funcionalidad se mantiene sin dependencias externas.

## 🤝 Contribuciones

Para agregar nuevas características:

1. **Nuevo campo en formulario**: Edita el HTML del modal y actualiza las funciones `addClient()` o `addCase()` en `app.js`

2. **Nuevo estado de caso**: Agrega al objeto `statusConfig` en el método `renderStatusBadge()`

3. **Nuevo estilo**: Agrega clases CSS en `styles.css` siguiendo el patrón BEM

## 📄 Licencia

MIT License - Libre para uso personal y comercial

---

**Desarrollado con ❤️ usando Vanilla JavaScript**
