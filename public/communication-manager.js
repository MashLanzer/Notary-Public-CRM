// ============================================
// COMMUNICATION INTEGRATIONS
// Sistema de comunicaciones listo para integración con APIs reales
// ============================================

const CommunicationManager = {
    init() {
        this.setupSMSNotifications();
        this.setupWhatsAppIntegration();
        this.setupChatInterno();
        this.setupAutomatedFollowups();
    },

    // ============================================
    // SMS NOTIFICATIONS
    // Configurar con Twilio, Vonage u otro proveedor real
    // ============================================
    setupSMSNotifications() {
        this.smsConfig = {
            enabled: true,
            provider: 'twilio', // Configurar con credenciales reales
            from: '+1234567890' // Número de teléfono de su cuenta
        };
    },

    async sendSMS(to, message) {
        console.log('📱 Enviando SMS (configurar API real):');
        console.log(`To: ${to}`);
        console.log(`Message: ${message}`);

        // TODO: Integrar con API real de Twilio, Vonage, etc.
        // Ejemplo Twilio:
        // const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
        //     method: 'POST',
        //     headers: { 'Authorization': 'Basic ' + btoa('YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN') },
        //     body: new URLSearchParams({ To: to, From: this.smsConfig.from, Body: message })
        // });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Log to audit
        if (window.AuditManager) {
            AuditManager.logAction('SMS Enviado', to, message);
        }

        Toast.success('SMS Enviado', `Mensaje enviado a ${to}`);

        return {
            success: true,
            messageId: 'SM' + Date.now(),
            to,
            message
        };
    },

    sendAppointmentReminder(appointment) {
        if (!appointment.clientPhone) return;

        const client = window.NotaryCRM?.state.clients.find(c => c.id === appointment.clientId);
        const message = `Recordatorio: Tiene una cita el ${new Date(appointment.start).toLocaleDateString()} a las ${new Date(appointment.start).toLocaleTimeString()}. ${appointment.title}`;

        this.sendSMS(client?.phone || appointment.clientPhone, message);
    },

    // ============================================
    // WHATSAPP INTEGRATION
    // Configurar con WhatsApp Business API
    // ============================================
    setupWhatsAppIntegration() {
        this.whatsappConfig = {
            enabled: true,
            businessId: 'YOUR_BUSINESS_ID', // Configurar con ID real
            apiKey: 'YOUR_API_KEY' // Configurar con API Key real
        };
    },

    async sendWhatsApp(to, message, type = 'text') {
        console.log('💬 Enviando WhatsApp (configurar API real):');
        console.log(`To: ${to}`);
        console.log(`Type: ${type}`);
        console.log(`Message: ${message}`);

        // TODO: Integrar con WhatsApp Business API real
        // Ejemplo:
        // const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_ID/messages', {
        //     method: 'POST',
        //     headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN', 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ messaging_product: 'whatsapp', to: to, type: 'text', text: { body: message } })
        // });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Log to audit
        if (window.AuditManager) {
            AuditManager.logAction('WhatsApp Enviado', to, message);
        }

        Toast.success('WhatsApp Enviado', `Mensaje enviado a ${to}`);

        return {
            success: true,
            messageId: 'WA' + Date.now(),
            to,
            message,
            type
        };
    },

    sendWhatsAppTemplate(to, templateName, params) {
        console.log('💬 Enviando WhatsApp Template (configurar con plantillas aprobadas):');
        console.log(`Template: ${templateName}`);
        console.log(`Params:`, params);

        const message = this.getWhatsAppTemplate(templateName, params);
        return this.sendWhatsApp(to, message, 'template');
    },

    getWhatsAppTemplate(name, params) {
        const templates = {
            'appointment_reminder': `Hola ${params.name}, le recordamos su cita el ${params.date} a las ${params.time}. ${params.service}`,
            'case_update': `Hola ${params.name}, su caso ${params.caseNumber} ha sido actualizado. Estado: ${params.status}`,
            'payment_reminder': `Hola ${params.name}, le recordamos que tiene un pago pendiente de ${params.amount} para el caso ${params.caseNumber}.`
        };

        return templates[name] || 'Mensaje de Notary CRM';
    },

    // ============================================
    // CHAT INTERNO
    // ============================================
    setupChatInterno() {
        this.createChatUI();
        this.chatMessages = new Map(); // caseId -> messages[]
    },

    createChatUI() {
        // Add chat button to case cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.case-card')) {
                const card = e.target.closest('.case-card');
                if (!card.querySelector('.chat-toggle')) {
                    this.addChatButton(card);
                }
            }
        });
    },

    addChatButton(caseCard) {
        const caseId = caseCard.dataset.caseId;
        if (!caseId) return;

        const chatBtn = document.createElement('button');
        chatBtn.className = 'btn btn-sm btn-icon chat-toggle';
        chatBtn.title = 'Chat del caso';
        chatBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
        `;
        chatBtn.onclick = () => this.openChat(caseId);

        const actions = caseCard.querySelector('.case-actions') || caseCard;
        actions.appendChild(chatBtn);
    },

    openChat(caseId) {
        const modal = this.getOrCreateChatModal();
        const messages = this.chatMessages.get(caseId) || [];

        this.renderChatMessages(caseId, messages);

        if (window.NotaryCRM) {
            window.NotaryCRM.openModal('chat-modal');
        }
    },

    getOrCreateChatModal() {
        let modal = document.getElementById('chat-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'chat-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Chat del Caso</h3>
                        <button class="modal-close" onclick="NotaryCRM.closeModal('chat-modal')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="chat-messages" style="height: 400px; overflow-y: auto; margin-bottom: 1rem; padding: 1rem; background: var(--bg-app); border-radius: 8px;"></div>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="chat-input" class="form-input" placeholder="Escribe un mensaje..." style="flex: 1;">
                            <button class="btn btn-primary" onclick="CommunicationManager.sendChatMessage()">
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        return modal;
    },

    renderChatMessages(caseId, messages) {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        container.dataset.caseId = caseId;
        container.innerHTML = messages.map(msg => `
            <div style="margin-bottom: 1rem; ${msg.isOwn ? 'text-align: right;' : ''}">
                <div style="
                    display: inline-block;
                    max-width: 70%;
                    padding: 0.75rem;
                    border-radius: 12px;
                    background: ${msg.isOwn ? 'var(--color-primary)' : 'var(--color-gray-100)'};
                    color: ${msg.isOwn ? 'white' : 'var(--text-primary)'};
                ">
                    <div style="font-size: 0.9rem;">${msg.text}</div>
                    <div style="font-size: 0.7rem; margin-top: 0.25rem; opacity: 0.8;">
                        ${new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `).join('');

        container.scrollTop = container.scrollHeight;
    },

    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const container = document.getElementById('chat-messages');
        if (!input || !container) return;

        const caseId = container.dataset.caseId;
        const text = input.value.trim();
        if (!text) return;

        const message = {
            id: Date.now(),
            text,
            timestamp: new Date().toISOString(),
            isOwn: true,
            userId: window.NotaryCRM?.currentUser?.uid || 'current-user'
        };

        const messages = this.chatMessages.get(caseId) || [];
        messages.push(message);
        this.chatMessages.set(caseId, messages);

        this.renderChatMessages(caseId, messages);
        input.value = '';

        Toast.success('Mensaje Enviado', 'Tu mensaje ha sido enviado');
    },

    // ============================================
    // AUTOMATED FOLLOW-UPS
    // ============================================
    setupAutomatedFollowups() {
        this.followupRules = [
            {
                trigger: 'case_created',
                delay: 24 * 60 * 60 * 1000, // 24 hours
                action: 'send_email',
                template: 'case_followup'
            },
            {
                trigger: 'appointment_completed',
                delay: 2 * 60 * 60 * 1000, // 2 hours
                action: 'send_sms',
                template: 'feedback_request'
            },
            {
                trigger: 'payment_pending',
                delay: 7 * 24 * 60 * 60 * 1000, // 7 days
                action: 'send_whatsapp',
                template: 'payment_reminder'
            }
        ];
    },

    scheduleFollowup(trigger, entityId, data) {
        const rule = this.followupRules.find(r => r.trigger === trigger);
        if (!rule) return;

        console.log(`📅 Scheduled follow-up: ${trigger} for ${entityId}`);

        setTimeout(() => {
            this.executeFollowup(rule, entityId, data);
        }, rule.delay);
    },

    executeFollowup(rule, entityId, data) {
        console.log(`✉️ Executing follow-up: ${rule.action} - ${rule.template}`);

        switch (rule.action) {
            case 'send_email':
                // Email already implemented
                break;
            case 'send_sms':
                if (data.phone) {
                    this.sendSMS(data.phone, `Follow-up: ${rule.template}`);
                }
                break;
            case 'send_whatsapp':
                if (data.phone) {
                    this.sendWhatsApp(data.phone, `Follow-up: ${rule.template}`);
                }
                break;
        }
    },

    // ============================================
    // COMMUNICATION HISTORY
    // ============================================
    getCommunicationHistory(clientId) {
        // Mock implementation
        return [
            {
                type: 'email',
                date: new Date(),
                subject: 'Confirmación de cita',
                status: 'sent'
            },
            {
                type: 'sms',
                date: new Date(Date.now() - 86400000),
                message: 'Recordatorio de cita',
                status: 'delivered'
            },
            {
                type: 'whatsapp',
                date: new Date(Date.now() - 172800000),
                message: 'Actualización de caso',
                status: 'read'
            }
        ];
    }
};

if (typeof window !== 'undefined') {
    window.CommunicationManager = CommunicationManager;
}
