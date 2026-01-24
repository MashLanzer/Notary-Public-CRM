# Sistema de Pagos Real - Notary CRM

## 🔐 Configuración de PayPal para Producción

Este sistema utiliza **PayPal en modo PRODUCCIÓN** para procesar pagos reales. Todo el dinero recibido se transferirá directamente a su cuenta de PayPal.

### Pasos para Configurar

#### 1. Obtener su Client ID de PayPal

1. Visite [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Inicie sesión con su cuenta de PayPal Business
3. Vaya a **"My Apps & Credentials"**
4. En la sección **"Live"** (NO Sandbox), cree una nueva aplicación o use una existente
5. Copie su **Client ID** de producción (Live)

#### 2. Configurar en el CRM

1. Abra la aplicación Notary CRM
2. Intente procesar un pago o haga clic en el ícono ⚙️ en el modal de pagos
3. Pegue su **Client ID de producción** cuando se le solicite
4. Recargue la página para aplicar los cambios

### ✅ Características del Sistema de Pagos

- ✔️ **Pagos Reales**: Todo el dinero va directamente a su cuenta de PayPal
- ✔️ **Múltiples Métodos**: Acepta PayPal, Tarjetas de Crédito y Débito
- ✔️ **Seguro**: Procesamiento seguro mediante PayPal
- ✔️ **Recibos Automáticos**: Generación automática de recibos digitales
- ✔️ **Historial Completo**: Registro de todas las transacciones con ID de PayPal
- ✔️ **Auditoría**: Logs de auditoría para cada transacción

### 📋 Información Guardada por Transacción

Cada pago procesado guarda:
- ID de Transacción de PayPal
- Monto y moneda
- Email del pagador
- Nombre del pagador
- Estado de la transacción
- Fecha y hora
- Número de recibo

### ⚠️ Importante

- **NO use Client IDs de Sandbox (sb)**: Estos son solo para pruebas y no procesarán pagos reales
- **Cuenta Business**: Asegúrese de tener una cuenta PayPal Business para recibir pagos
- **Verificación**: Verifique su cuenta de PayPal para evitar límites de recepción
- **Comisiones**: PayPal cobrará sus comisiones estándar por cada transacción

### 🔄 Cambiar de Cuenta de PayPal

Si necesita cambiar a una cuenta de PayPal diferente:

1. Haga clic en el ícono ⚙️ en el modal de pagos
2. Ingrese el nuevo Client ID
3. Recargue la página

### 🆘 Solución de Problemas

**Error: "PayPal Client ID no configurado"**
- Configure su Client ID siguiendo los pasos anteriores

**Error: "No se pudo cargar el sistema de pagos"**
- Verifique que su Client ID sea válido
- Asegúrese de estar usando el Client ID de **Live** (no Sandbox)
- Verifique su conexión a internet

**Los botones de pago no aparecen**
- Abra la consola del navegador (F12) para ver errores
- Verifique que el Client ID esté configurado correctamente
- Recargue la página completamente

### 📞 Soporte

Para problemas con PayPal, contacte:
- [Soporte de PayPal](https://www.paypal.com/us/smarthelp/contact-us)
- [Documentación de PayPal](https://developer.paypal.com/docs/)

---

## 📧 Sistema de Plantillas de Email

### Crear Nueva Plantilla

1. Vaya a la pestaña **"Email"** en el CRM
2. Haga clic en **"Nueva Plantilla"**
3. Complete:
   - Nombre de la plantilla
   - Asunto del correo
   - Contenido del mensaje
4. Use las variables disponibles para personalizar:
   - `{client_name}` - Nombre del cliente
   - `{case_number}` - Número de caso
   - `{service_type}` - Tipo de servicio
   - `{due_date}` - Fecha de vencimiento
   - `{amount}` - Monto
   - `{company_name}` - Nombre de su empresa
5. Haga clic en **"Guardar Plantilla"**

### Usar Plantillas

1. Desde la tarjeta de un cliente o caso, haga clic en el botón de email
2. Seleccione la plantilla que desea usar
3. Revise la vista previa con los datos reales
4. Haga clic en **"Enviar Ahora"**

### Editar o Eliminar Plantillas

- **Editar**: Haga clic en "Editar" en la tarjeta de la plantilla
- **Eliminar**: Haga clic en "Eliminar" y confirme la acción

---

**Última actualización**: Enero 2026
