# 🎯 GUÍA VISUAL RÁPIDA

## ✅ PROBLEMAS SOLUCIONADOS

### 1. ⚙️ Botón de Configuración de PayPal

**ANTES:** ❌ No se veía el botón de configuración
**AHORA:** ✅ Botón visible en el header (esquina superior derecha)

**Ubicación:**
```
┌─────────────────────────────────────────────────────────┐
│ Notary Public CRM        [⚙️ Configurar PayPal] [🌙]    │
└─────────────────────────────────────────────────────────┘
```

**Cómo usar:**
1. Busca en la parte superior derecha de la pantalla
2. Verás un botón azul que dice "⚙️ Configurar PayPal"
3. Haz clic en él
4. Pega tu Client ID de PayPal
5. Recarga la página

---

### 2. ✨ Botón de Nueva Plantilla de Email

**ANTES:** ❌ No se veía el botón
**AHORA:** ✅ Botón grande y visible en la pestaña Email

**Cómo encontrarlo:**

**Paso 1:** Haz clic en la pestaña "Email"
```
┌──────────────────────────────────────────────┐
│ [Dashboard] [Clients] [Cases] [Email] ← AQUÍ│
└──────────────────────────────────────────────┘
```

**Paso 2:** Verás el botón grande
```
┌─────────────────────────────────────────────────────┐
│ 📧 Plantillas de Email                              │
│ Crea plantillas personalizadas...                   │
│                            [✨ Nueva Plantilla] ← AQUÍ│
└─────────────────────────────────────────────────────┘
```

---

## 📋 INSTRUCCIONES PASO A PASO

### Para Configurar PayPal:

1. **Obtener Client ID:**
   - Ve a: https://developer.paypal.com/dashboard/
   - Inicia sesión
   - Ve a "My Apps & Credentials"
   - En sección "Live" (NO Sandbox)
   - Copia el "Client ID"

2. **Configurar en el CRM:**
   - Haz clic en "⚙️ Configurar PayPal" (esquina superior derecha)
   - Pega tu Client ID
   - Haz clic en OK
   - Recarga la página (F5)

3. **Verificar:**
   - Abre un caso
   - Haz clic en "Procesar Pago"
   - Deberías ver los botones de PayPal

---

### Para Crear Plantilla de Email:

1. **Ir a Email:**
   - Haz clic en la pestaña "Email" en el menú principal
   - Está entre "Reports" y "Users"

2. **Crear Plantilla:**
   - Haz clic en "✨ Nueva Plantilla"
   - Completa el formulario:
     - Nombre: "Confirmación de Servicio"
     - Asunto: "Confirmación - Caso {case_number}"
     - Contenido: Tu mensaje

3. **Usar Variables:**
   - Haz clic en las etiquetas para insertar:
     - {client_name} - Nombre del cliente
     - {case_number} - Número de caso
     - {service_type} - Tipo de servicio
     - {due_date} - Fecha
     - {amount} - Monto
     - {company_name} - Tu empresa

4. **Guardar:**
   - Haz clic en "Guardar Plantilla"

5. **Usar:**
   - Ve a un cliente o caso
   - Haz clic en el botón de email
   - Selecciona tu plantilla
   - Enviar

---

## 🔍 UBICACIÓN DE LOS ELEMENTOS

### Header (Parte Superior):
```
┌──────────────────────────────────────────────────────────────┐
│ 🏛️ Notary Public CRM                                         │
│                                                               │
│                    [⚙️ Configurar PayPal] [🌙 Tema] [Salir] │
│                     ↑                                         │
│                     AQUÍ ESTÁ EL BOTÓN                       │
└──────────────────────────────────────────────────────────────┘
```

### Menú de Pestañas:
```
┌──────────────────────────────────────────────────────────────┐
│ [Dashboard] [Clients] [Cases] [Reminders] [Calendar]         │
│ [Reports] [Email] ← AQUÍ [Users] [Auditoría]                │
└──────────────────────────────────────────────────────────────┘
```

### Pestaña Email:
```
┌──────────────────────────────────────────────────────────────┐
│ 📧 Plantillas de Email                                       │
│ Crea plantillas personalizadas para enviar emails...         │
│                                      [✨ Nueva Plantilla]    │
│                                       ↑                       │
│                                       AQUÍ ESTÁ EL BOTÓN     │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ No hay plantillas creadas.                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚠️ SI AÚN NO VES LOS BOTONES

### Solución 1: Recargar la Página
- Presiona **F5** o **Ctrl + R**
- Esto recargará todos los cambios

### Solución 2: Limpiar Caché
- Presiona **Ctrl + Shift + R** (Windows/Linux)
- Presiona **Cmd + Shift + R** (Mac)
- Esto forzará la recarga sin caché

### Solución 3: Verificar Consola
- Presiona **F12** para abrir herramientas de desarrollo
- Ve a la pestaña "Console"
- Busca errores en rojo
- Compártelos si los hay

---

## 📸 CAPTURAS DE PANTALLA (Descripción)

### Botón de Configuración de PayPal:
- **Color:** Azul (btn-primary)
- **Ubicación:** Esquina superior derecha
- **Texto:** "⚙️ Configurar PayPal"
- **Tamaño:** Mediano, muy visible

### Botón de Nueva Plantilla:
- **Color:** Azul (btn-primary)
- **Ubicación:** Esquina superior derecha de la pestaña Email
- **Texto:** "✨ Nueva Plantilla"
- **Tamaño:** Grande (12px padding, 24px horizontal)

---

## 🆘 CONTACTO DE SOPORTE

Si después de seguir estos pasos aún no ves los botones:

1. Recarga la página completamente (Ctrl + Shift + R)
2. Verifica que estés en la pestaña correcta
3. Abre la consola (F12) y busca errores
4. Comparte cualquier mensaje de error que veas

---

**Última Actualización:** Enero 24, 2026
**Versión:** 2.1 - Botones Visibles
