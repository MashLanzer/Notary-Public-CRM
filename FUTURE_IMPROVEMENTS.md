# 🚀 Hoja de Ruta: Futuras Mejoras e Implementaciones

Este documento detalla oportunidades de mejora y nuevas funcionalidades sugeridas para el ecosistema **Notary CRM**, divididas por módulo.

---

## 🏢 1. CRM Dashboard (`index.html` + `app.js`)
*El centro de control administrativo.*

### ✅ Funcionalidad & Productividad
- [ ] **Sincronización Bidireccional con Google Calendar API:** Actualmente usamos enlaces estáticos. Implementar la API real permitiría leer eventos externos (ej: reuniones personales) para evitar conflictos automáticamente.
- [ ] **Gestor Documental con OCR:** Permitir subir fotos de DNI/Pasaportes y que el sistema extraiga automáticamente nombre, cédula y fecha de nacimiento.
- [ ] **Generador de Documentos PDF:** Crear plantillas (Poderes, Affidavits) donde se rellenen automáticamente los datos del cliente seleccionado y se descargue el PDF listo para firmar.
- [ ] **Firma Digital Integrada:** Integrar DocuSign o una solución nativa de firma en pantalla (canvas) para que los clientes firmen en la tablet del notario.

### 🎨 UI/UX (Interfaz)
- [ ] **Modo Oscuro "True Black":** Optimizar el tema oscuro para pantallas OLED (actualmente fuerza modo claro en algunas secciones).
- [ ] **Vistas Kanban para Casos:** Visualizar los trámites como tarjetas en columnas (Pendiente -> En Proceso -> Firmado -> Completado) tipo Trello.
- [ ] **Búsqueda Global Inteligente (Cmd+K):** Una barra de comandos para navegar rápido ("Ir a cliente Juan", "Nuevo trámite", "Cambiar tema").

---

## 🌐 2. Landing Page (`landing.html`)
*La cara pública venta y captación de clientes.*

### 📈 Conversión & Marketing
- [ ] **Testimonios Dinámicos (Google Reviews):** Conectar con la API de Google Maps para mostrar reseñas reales y frescas automáticamente.
- [ ] **Chatbot IA de Captación:** Un asistente simple que responda preguntas frecuentes ("¿Qué precio tiene un poder?", "¿Abren los sábados?") y derive al Booking.
- [ ] **Pop-up de "Exit Intent":** Si el usuario mueve el mouse para cerrar la pestaña, ofrecer un descuento o guía gratuita ("Descarga la Checklist para tu Trámite Notarial").

### ⚡ Performance & SEO
- [ ] **Blog Notarial:** Una sección `/blog` generada dinámicamente para artículos como "Requisitos para Apostilla 2024", vital para atraer tráfico orgánico de Google.
- [ ] **Schema Markup JSON-LD:** Añadir metadatos estructurados avanzados para que Google muestre "Precio", "Horario" y "Valoración" directamente en los resultados de búsqueda.

---

## 📅 3. Portal de Reservas (`booking.html`)
*Donde los clientes agendan sus citas.*

### 💳 Pagos & Monetización
- [ ] **Pasarela de Pagos Stripe/PayPal Real:** Cobrar un depósito (ej: $20) para confirmar la cita y reducir el ausentismo (No-Show).
- [ ] **Cupones de Descuento:** Campo para códigos promocionales (ej: "APERTURA2025").

### 👤 Experiencia de Usuario
- [ ] **Recordatorios SMS (Twilio):** Enviar un SMS 2 horas antes de la cita (más efectivo que el email).
- [ ] **Reprogramación por el Cliente:** Permitir que el cliente mueva su cita por sí mismo mediante enlace seguro, sin tener que llamar.
- [ ] **Detección de Zona Horaria:** Si atiendes clientes internacionales, mostrar horas en su zona local y la tuya.

---

## 🔍 4. Portal de Estado (`status.html`)
*Donde los clientes consultan cómo va su trámite.*

### 🔒 Seguridad & Valor
- [ ] **Área Privada de Descarga:** Que el cliente pueda descargar su borrador o factura directamente tras ingresar su número de caso y un PIN de seguridad.
- [ ] **Línea de Tiempo Visual:** Un gráfico de progreso (step-wizard) mostrando exactamente en qué paso está su documento (ej: "En Notaría" -> "Enviado a Apostilla" -> "Listo").

---

## 🛠️ 5. Infraestructura Técnica (Backend/Firebase)
- [ ] **Firebase Cloud Functions:**
    - *Auto-Emails:* Enviar emails automáticos cuando cambia el estado de un caso.
    - *Backups Diarios:* Script que exporte todo el JSON de Firestore a Google Cloud Storage cada noche.
- [ ] **Reglas de Seguridad Estrictas:** Auditar `firestore.rules` para asegurar que nadie pueda leer datos de otros clientes mediante inyección o consultas manipuladas (aislamiento total por `ownerId` y `clientId`).
- [ ] **PWA (Progressive Web App):** Completar el `manifest.json` y `sw.js` para que la web permita instalación real en iPhone/Android y funcione sin internet (modo consulta).

---

## 📊 6. Analítica Avanzada
- [ ] **Dashboard Financiero:** Gráficos de ingresos mensuales, proyección de ganancias y ticket promedio real.
- [ ] **Mapa de Calor de Citas:** Visualizar qué días y horas son los más demandados para ajustar horarios de atención.
