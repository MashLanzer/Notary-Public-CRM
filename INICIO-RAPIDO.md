# 🚀 Inicio Rápido - Sistema de Pagos Real

## ⚡ Configuración en 3 Pasos

### Paso 1: Obtener Client ID de PayPal (5 minutos)

1. Ve a: https://developer.paypal.com/dashboard/
2. Inicia sesión con tu cuenta PayPal Business
3. Click en "My Apps & Credentials"
4. En la sección **"Live"** (NO Sandbox):
   - Si no tienes app: Click "Create App"
   - Si ya tienes app: Selecciónala
5. Copia tu **"Client ID"** (empieza con "A" y tiene muchos caracteres)

### Paso 2: Configurar en el CRM (1 minuto)

1. Abre tu Notary CRM
2. Ve a cualquier caso y click en "Procesar Pago"
3. Click en el ícono ⚙️ (configuración)
4. Pega tu Client ID de PayPal
5. Recarga la página

### Paso 3: ¡Listo para Recibir Pagos! 💰

Ya puedes procesar pagos reales. El dinero irá directamente a tu cuenta de PayPal.

---

## 📧 Plantillas de Email - Ya Está Listo

El sistema de plantillas de email **ya está completamente funcional**:

### Crear una Plantilla:

1. Click en pestaña **"Email"**
2. Click en **"Nueva Plantilla"**
3. Completa:
   - Nombre: "Confirmación de Servicio"
   - Asunto: "Confirmación - Caso {case_number}"
   - Contenido: Escribe tu mensaje usando variables
4. Click en **"Guardar Plantilla"**

### Variables Disponibles:

Click en las variables para insertarlas:
- `{client_name}` - Nombre del cliente
- `{case_number}` - Número de caso
- `{service_type}` - Tipo de servicio
- `{due_date}` - Fecha de vencimiento
- `{amount}` - Monto
- `{company_name}` - Tu empresa

### Enviar Email:

1. Desde un cliente o caso, click en el botón de email
2. Selecciona la plantilla
3. Revisa la vista previa
4. Click "Enviar Ahora"

---

## ⚠️ Importante

### Sistema de Pagos:
- ✅ Es REAL - El dinero va a tu cuenta PayPal
- ✅ Acepta PayPal, Tarjetas de Crédito/Débito
- ❌ NO usar Client IDs de Sandbox (los que empiezan con "sb")
- 💡 PayPal cobra sus comisiones estándar

### Seguridad:
- 🔒 Todas las transacciones son procesadas por PayPal
- 🔒 No se guardan datos de tarjetas en el CRM
- 🔒 El Client ID es público (no es secreto)

---

## 🆘 Problemas Comunes

**"PayPal Client ID no configurado"**
→ Sigue el Paso 1 y Paso 2 arriba

**"No se pudo cargar el sistema de pagos"**
→ Verifica que usaste el Client ID de **Live** (no Sandbox)
→ Recarga la página completamente

**Los botones de pago no aparecen**
→ Abre la consola (F12) para ver errores
→ Verifica tu conexión a internet

---

## 📚 Más Información

- **Guía Completa**: Ver `CONFIGURACION-PAGOS.md`
- **Cambios Realizados**: Ver `CAMBIOS-REALIZADOS.md`
- **Soporte PayPal**: https://www.paypal.com/us/smarthelp/contact-us

---

**¡Todo listo para recibir pagos reales! 💰**
