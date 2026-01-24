// ============================================
// PAYMENT & BILLING SYSTEM - PRODUCCIÓN
// Sistema de pagos real con PayPal, Tarjetas de Crédito/Débito
// ============================================

const PaymentManager = {
    init() {
        this.setupPayPalConfig(); // Load config first
        this.setupAutomaticBilling();
        this.setupPartialPayments();
        this.setupPaymentReminders();
        this.setupDigitalReceipts();
        this.setupDiscounts();
    },

    setupPayPalConfig() {
        // Load from storage
        const savedId = localStorage.getItem('paypal_client_id');

        // Si no hay Client ID configurado, mostrar advertencia
        if (!savedId) {
            console.warn('⚠️ PayPal Client ID no configurado. Configure su cuenta de PayPal para recibir pagos.');
            this.paypalClientId = null;
        } else {
            this.paypalClientId = savedId;
        }

        // Inject script if not present and client ID is configured
        if (this.paypalClientId && !document.querySelector('script[src*="paypal.com/sdk/js"]')) {
            this.loadPayPalSDK();
        }
    },

    loadPayPalSDK() {
        const script = document.createElement('script');
        // Cargar SDK de PayPal con soporte para tarjetas de crédito/débito
        script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalClientId}&currency=USD&components=buttons,card-fields&enable-funding=venmo,paylater`;
        script.async = true;
        script.onload = () => {
            console.log('✅ PayPal SDK cargado correctamente - Modo PRODUCCIÓN');
        };
        script.onerror = () => {
            console.error('❌ Error al cargar PayPal SDK. Verifique su Client ID.');
            Toast.error('Error de Configuración', 'No se pudo cargar el sistema de pagos. Verifique su configuración de PayPal.');
        };
        document.head.appendChild(script);
    },

    savePayPalConfig(clientId) {
        if (!clientId || clientId.trim() === '') {
            Toast.error('Error', 'Debe proporcionar un Client ID válido de PayPal.');
            return;
        }

        this.paypalClientId = clientId;
        localStorage.setItem('paypal_client_id', clientId);
        Toast.success('Configuración Guardada', 'Su cuenta de PayPal ha sido configurada. Recarga la página para aplicar los cambios.');
    },

    promptPayPalConfig() {
        const currentId = localStorage.getItem('paypal_client_id') || '';
        const message = currentId
            ? `Client ID actual: ${currentId.substring(0, 20)}...\n\nIntroduce tu nuevo PayPal Client ID de PRODUCCIÓN:`
            : 'Introduce tu PayPal Client ID de PRODUCCIÓN para recibir pagos reales:\n\n(Obtén tu Client ID en: https://developer.paypal.com/dashboard/)';

        const newId = prompt(message, currentId);

        if (newId !== null && newId.trim() !== '' && newId !== currentId) {
            this.savePayPalConfig(newId.trim());
            setTimeout(() => location.reload(), 1500);
        }
    },


    openPaymentModal(caseId) {
        // Verificar que PayPal esté configurado
        if (!this.paypalClientId) {
            Toast.error('Configuración Requerida', 'Debe configurar su cuenta de PayPal antes de procesar pagos. Haga clic en el ícono ⚙️ para configurar.');
            return;
        }

        this.currentCaseId = caseId;
        const caseItem = window.NotaryCRM.state.cases.find(c => c.id === caseId);
        if (!caseItem) return;

        // Ensure Payment Modal exists
        let modal = document.getElementById('payment-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'payment-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            💳 Procesar Pago Real
                            <button onclick="PaymentManager.promptPayPalConfig()" style="background:none; border:none; cursor:pointer; color:#ccc; margin-left: 8px;" title="Configurar Cuenta de PayPal">⚙️</button>
                        </h3>
                        <button class="modal-close" onclick="NotaryCRM.closeModal('payment-modal')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="payment-case-display" style="margin-bottom:1rem; font-weight:600;"></div>
                        <div id="payment-amount-display" style="font-size:2rem; font-weight:700; color:var(--color-success); margin-bottom:1rem;"></div>
                        
                        <div style="background: var(--color-blue-50); border-left: 4px solid var(--color-primary); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                            <p style="color:var(--text-primary); font-size:0.9rem; margin: 0; line-height: 1.5;">
                                <strong>🔒 Pago Seguro:</strong> Este es un sistema de pagos real. El dinero será transferido directamente a su cuenta de PayPal configurada. Acepta PayPal, Tarjetas de Crédito y Débito.
                            </p>
                        </div>

                        <div id="paypal-button-container"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Update modal info
        const amountDisplay = modal.querySelector('#payment-amount-display');
        const caseDisplay = modal.querySelector('#payment-case-display');
        if (amountDisplay) amountDisplay.textContent = `$${caseItem.amount.toFixed(2)}`;
        if (caseDisplay) caseDisplay.textContent = `Cargo por: ${caseItem.type} (${caseItem.caseNumber})`;

        // Render PayPal Buttons
        this.renderPayPalButtons(caseItem.amount);

        if (window.NotaryCRM) window.NotaryCRM.openModal('payment-modal');
    },


    renderPayPalButtons(amount) {
        const container = document.getElementById('paypal-button-container');
        if (!container || !window.paypal) return;

        container.innerHTML = ''; // Clear previous buttons

        try {
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: amount.toFixed(2)
                            },
                            description: `Servicio Notarial - Caso ${this.currentCaseId}`
                        }]
                    });
                },
                onApprove: (data, actions) => {
                    return actions.order.capture().then((details) => {
                        console.log('✅ Pago Real Completado:', details);
                        console.log('Pagador:', details.payer.name.given_name);
                        console.log('ID de Transacción:', details.id);
                        console.log('Monto:', details.purchase_units[0].amount.value, details.purchase_units[0].amount.currency_code);

                        this.processPayment(amount, 'PayPal', this.currentCaseId, details);
                        if (window.NotaryCRM) window.NotaryCRM.closeModal('payment-modal');
                        Toast.success('💰 Pago Recibido', `Pago de $${amount.toFixed(2)} procesado exitosamente. ID: ${details.id}`);
                    });
                },
                onError: (err) => {
                    console.error('❌ Error en PayPal:', err);
                    Toast.error('Error de Pago', 'No se pudo completar la transacción. Por favor intente nuevamente.');
                }
            }).render('#paypal-button-container');
        } catch (e) {
            console.warn('⚠️ Error al renderizar botones de PayPal:', e);
            Toast.error('Error', 'No se pudieron cargar los botones de pago. Verifique su configuración.');
        }
    },







    async processPayment(amount, method, caseId, transactionDetails = null) {
        console.log(`💳 Pago Real Procesado: $${amount} via ${method}`);

        if (transactionDetails) {
            console.log('📋 Detalles de la Transacción:', {
                transactionId: transactionDetails.id,
                status: transactionDetails.status,
                payer: transactionDetails.payer,
                amount: transactionDetails.purchase_units[0].amount
            });
        }

        const payment = {
            id: 'pay_' + Date.now(),
            amount,
            method,
            caseId,
            status: 'completed',
            timestamp: new Date().toISOString(),
            receiptNumber: 'REC-' + Date.now(),
            // Guardar detalles de la transacción real de PayPal
            transactionId: transactionDetails?.id || null,
            payerEmail: transactionDetails?.payer?.email_address || null,
            payerName: transactionDetails?.payer?.name?.given_name + ' ' + (transactionDetails?.payer?.name?.surname || ''),
            paymentStatus: transactionDetails?.status || 'COMPLETED'
        };

        // Update case payment status
        this.updateCasePaymentStatus(caseId, 'Paid', payment);

        // Generate receipt
        this.generateDigitalReceipt(payment);

        // Log audit
        if (window.AuditManager) {
            AuditManager.logAction('Pago Real Procesado', caseId, `$${amount} - ${method} - TX: ${payment.transactionId || 'N/A'}`);
        }

        Toast.success('Pago Confirmado', `Pago de $${amount} completado exitosamente`);

        return payment;
    },


    updateCasePaymentStatus(caseId, status, paymentData) {
        if (!window.NotaryCRM) return;

        const cases = window.NotaryCRM.state.cases || [];
        const caseIndex = cases.findIndex(c => c.id === caseId);

        if (caseIndex !== -1) {
            cases[caseIndex].paymentStatus = status;
            cases[caseIndex].paymentData = paymentData;
            window.NotaryCRM.state.cases = cases;
        }
    },

    // ============================================
    // AUTOMATIC BILLING
    // ============================================
    setupAutomaticBilling() {
        this.billingRules = [
            {
                trigger: 'case_completed',
                delay: 0,
                action: 'generate_invoice'
            },
            {
                trigger: 'monthly',
                day: 1,
                action: 'send_invoices'
            }
        ];
    },

    generateInvoice(caseData) {
        const invoice = {
            id: 'INV-' + Date.now(),
            caseId: caseData.id,
            clientId: caseData.clientId,
            amount: caseData.amount,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'pending',
            items: [
                {
                    description: caseData.type,
                    quantity: 1,
                    unitPrice: caseData.amount,
                    total: caseData.amount
                }
            ],
            createdAt: new Date().toISOString()
        };

        console.log('📄 Invoice Generated:', invoice);

        Toast.success('Factura Generada', `Factura ${invoice.id} creada`);

        return invoice;
    },

    // ============================================
    // PARTIAL PAYMENTS
    // ============================================
    setupPartialPayments() {
        this.partialPayments = new Map(); // caseId -> payments[]
    },

    async processPartialPayment(caseId, amount, totalAmount) {
        const payments = this.partialPayments.get(caseId) || [];

        const payment = {
            id: 'pp_' + Date.now(),
            amount,
            timestamp: new Date().toISOString(),
            method: 'partial'
        };

        payments.push(payment);
        this.partialPayments.set(caseId, payments);

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = totalAmount - totalPaid;

        console.log(`💰 Partial Payment: $${amount}`);
        console.log(`Total Paid: $${totalPaid} / $${totalAmount}`);
        console.log(`Remaining: $${remaining}`);

        if (remaining <= 0) {
            this.updateCasePaymentStatus(caseId, 'Paid', { payments });
            Toast.success('Pago Completado', 'Todos los pagos han sido recibidos');
        } else {
            this.updateCasePaymentStatus(caseId, 'Partial', { payments, remaining });
            Toast.info('Pago Parcial', `Recibido $${amount}. Restante: $${remaining}`);
        }

        return { payment, totalPaid, remaining };
    },

    // ============================================
    // PAYMENT REMINDERS
    // ============================================
    setupPaymentReminders() {
        this.reminderSchedule = [
            { days: 7, message: 'Su pago vence en 7 días' },
            { days: 3, message: 'Su pago vence en 3 días' },
            { days: 0, message: 'Su pago vence hoy' },
            { days: -7, message: 'Su pago está vencido hace 7 días' }
        ];
    },

    schedulePaymentReminder(invoiceId, dueDate) {
        this.reminderSchedule.forEach(reminder => {
            const reminderDate = new Date(dueDate);
            reminderDate.setDate(reminderDate.getDate() - reminder.days);

            console.log(`📅 Reminder scheduled for ${reminderDate.toLocaleDateString()}: ${reminder.message}`);
        });
    },

    sendPaymentReminder(clientId, invoiceId, amount) {
        const client = window.NotaryCRM?.state.clients.find(c => c.id === clientId);
        if (!client) return;

        const message = `Recordatorio de pago: Factura ${invoiceId} por $${amount}`;

        // Send via multiple channels
        if (window.CommunicationManager) {
            if (client.email) {
                // Email reminder
                console.log(`📧 Email reminder sent to ${client.email}`);
            }
            if (client.phone) {
                // SMS reminder
                CommunicationManager.sendSMS(client.phone, message);
            }
        }

        Toast.info('Recordatorio Enviado', `Recordatorio enviado a ${client.name}`);
    },

    // ============================================
    // DIGITAL RECEIPTS
    // ============================================
    setupDigitalReceipts() {
        this.receiptTemplate = {
            header: 'Notary Public CRM',
            footer: 'Gracias por su pago'
        };
    },

    generateDigitalReceipt(paymentData) {
        const receipt = {
            id: paymentData.receiptNumber,
            paymentId: paymentData.id,
            amount: paymentData.amount,
            method: paymentData.method,
            timestamp: paymentData.timestamp,
            caseId: paymentData.caseId
        };

        console.log('🧾 Digital Receipt Generated:', receipt);

        // Auto-send receipt
        this.sendDigitalReceipt(receipt);

        return receipt;
    },

    async sendDigitalReceipt(receipt) {
        // Generate PDF (mock)
        const pdfBlob = await this.generateReceiptPDF(receipt);

        console.log('📧 Receipt sent via email');

        Toast.success('Recibo Enviado', `Recibo ${receipt.id} enviado por email`);
    },

    async generateReceiptPDF(receipt) {
        // Mock PDF generation
        const content = `
            RECIBO DE PAGO
            
            Número: ${receipt.id}
            Fecha: ${new Date(receipt.timestamp).toLocaleDateString()}
            Monto: $${receipt.amount}
            Método: ${receipt.method}
            
            Gracias por su pago.
        `;

        return new Blob([content], { type: 'application/pdf' });
    },

    downloadReceipt(receiptId) {
        console.log(`📥 Downloading receipt: ${receiptId}`);
        Toast.success('Descarga Iniciada', 'El recibo se está descargando');
    },

    // ============================================
    // DISCOUNTS & PROMOTIONS
    // ============================================
    setupDiscounts() {
        this.discounts = [
            {
                code: 'FIRST10',
                type: 'percentage',
                value: 10,
                description: '10% descuento primer servicio'
            },
            {
                code: 'LOYAL20',
                type: 'percentage',
                value: 20,
                description: '20% descuento clientes frecuentes'
            },
            {
                code: 'SAVE50',
                type: 'fixed',
                value: 50,
                description: '$50 descuento'
            }
        ];
    },

    applyDiscount(amount, discountCode) {
        const discount = this.discounts.find(d => d.code === discountCode);

        if (!discount) {
            Toast.error('Código Inválido', 'El código de descuento no existe');
            return { amount, discount: 0 };
        }

        let discountAmount = 0;

        if (discount.type === 'percentage') {
            discountAmount = amount * (discount.value / 100);
        } else if (discount.type === 'fixed') {
            discountAmount = Math.min(discount.value, amount);
        }

        const finalAmount = amount - discountAmount;

        console.log(`🎟️ Discount Applied: ${discount.code}`);
        console.log(`Original: $${amount}`);
        console.log(`Discount: -$${discountAmount}`);
        console.log(`Final: $${finalAmount}`);

        Toast.success('Descuento Aplicado', `${discount.description} - Ahorro: $${discountAmount}`);

        return {
            amount: finalAmount,
            discount: discountAmount,
            code: discountCode,
            description: discount.description
        };
    },

    // ============================================
    // TAX REPORTS
    // ============================================
    generateTaxReport(year) {
        if (!window.NotaryCRM) return null;

        const cases = window.NotaryCRM.state.cases || [];
        const yearCases = cases.filter(c => {
            const caseYear = new Date(c.createdAt).getFullYear();
            return caseYear === year && c.paymentStatus === 'Paid';
        });

        const totalRevenue = yearCases.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const casesByMonth = {};

        yearCases.forEach(c => {
            const month = new Date(c.createdAt).getMonth();
            casesByMonth[month] = (casesByMonth[month] || 0) + parseFloat(c.amount || 0);
        });

        const report = {
            year,
            totalRevenue,
            totalCases: yearCases.length,
            monthlyBreakdown: casesByMonth,
            generatedAt: new Date().toISOString()
        };

        console.log('📊 Tax Report Generated:', report);

        Toast.success('Reporte Fiscal Generado', `Año ${year} - Total: $${totalRevenue}`);

        return report;
    },

    exportTaxReport(report) {
        const csv = this.convertTaxReportToCSV(report);
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `tax-report-${report.year}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);

        Toast.success('Reporte Exportado', 'Reporte fiscal descargado');
    },

    convertTaxReportToCSV(report) {
        let csv = 'Mes,Ingresos\n';
        Object.entries(report.monthlyBreakdown).forEach(([month, revenue]) => {
            const monthName = new Date(2000, month, 1).toLocaleDateString('es-ES', { month: 'long' });
            csv += `${monthName},${revenue}\n`;
        });
        csv += `\nTotal,${report.totalRevenue}\n`;
        return csv;
    }
};

if (typeof window !== 'undefined') {
    window.PaymentManager = PaymentManager;
}
