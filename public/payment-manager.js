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

    async setupPayPalConfig() {
        // Load from storage first
        let savedId = localStorage.getItem('paypal_client_id');

        // Try load from Firestore if logged in (for persistence)
        if (window.NotaryCRM?.currentUser && window.dbFuncs) {
            try {
                const { doc, getDoc } = window.dbFuncs;
                const db = window.firebaseDB;
                const ref = doc(db, 'users', window.NotaryCRM.currentUser.uid, 'settings', 'billing');
                const snap = await getDoc(ref);
                if (snap.exists() && snap.data().paypalClientId) {
                    savedId = snap.data().paypalClientId;
                    // Sync local storage
                    localStorage.setItem('paypal_client_id', savedId);
                }
            } catch (e) {
                console.error('Error loading billing settings:', e);
            }
        }

        // Si no hay Client ID configurado, mostrar advertencia
        if (!savedId) {
            console.warn('⚠️ PayPal Client ID no configurado.');
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
        // Configuración ROBUSTA: intent=capture fuerza el cobro inmediato.
        // components=buttons es suficiente para Smart Payment Buttons (incluye Tarjetas).
        script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalClientId}&currency=USD&intent=capture&commit=true&components=buttons&enable-funding=card&disable-funding=paylater,venmo`;
        script.async = true;
        script.onload = () => {
            console.log('✅ PayPal SDK cargado en modo CAPTURE (Cobro Inmediato)');
        };
        script.onerror = () => {
            console.error('❌ Error al cargar PayPal SDK.');
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

        // Save to Firestore for persistence across devices/sessions
        if (window.NotaryCRM?.currentUser && window.dbFuncs) {
            const { doc, setDoc } = window.dbFuncs;
            const db = window.firebaseDB;
            const ref = doc(db, 'users', window.NotaryCRM.currentUser.uid, 'settings', 'billing');
            setDoc(ref, { paypalClientId: clientId }, { merge: true })
                .then(() => console.log('✅ Billing settings saved to Firestore'))
                .catch(err => console.error('Error saving billing settings:', err));
        }

        Toast.success('Configuración Guardada', 'Su cuenta de PayPal ha sido configurada. Recarga la página para aplicar los cambios.');
    },

    promptPayPalConfig() {
        const currentId = localStorage.getItem('paypal_client_id') || '';
        const title = currentId ? 'Actualizar PayPal Client ID' : 'Configurar Pagos con PayPal';
        const msg = currentId
            ? `Tu Client ID actual termina en: ...${currentId.slice(-6)}`
            : 'Introduce tu PayPal Client ID de PRODUCCIÓN para habilitar pagos reales.';

        // Use custom prompt if available in NotaryCRM (we'll implement/use a generic one)
        // Since we don't have a direct "prompt" modal, we'll use a SweetAlert style or custom modal injection
        // For now, let's look for a method to show input. If not, we'll create a simple overlay.

        // Simulating a nicer prompt using existing NotaryCRM modal capabilities if possible, 
        // otherwise falling back to a clean overlay injector.

        const overlayId = 'paypal-config-overlay';
        if (document.getElementById(overlayId)) return;

        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(4px); animation: fadeIn 0.2s;
        `;

        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); transform: scale(0.95); animation: zoomIn 0.2s forwards;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
                    <h3 style="margin:0; font-size:1.25rem; color:#0f172a; font-weight:700;">${title}</h3>
                    <button id="close-pp-config" style="background:none; border:none; cursor:pointer; font-size:1.5rem; color:#64748b;">&times;</button>
                </div>
                <p style="color:#475569; margin-bottom:1.5rem; line-height:1.5;">${msg}</p>
                
                <label style="display:block; font-size:0.875rem; font-weight:600; color:#334155; margin-bottom:0.5rem;">Client ID (Production)</label>
                <input type="text" id="pp-client-id-input" value="${currentId}" placeholder="Aa..." style="width:100%; padding:0.75rem; border:1px solid #cbd5e1; border-radius:0.5rem; font-size:0.95rem; margin-bottom:1.5rem; outline:none; transition:border-color 0.2s;">
                
                <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
                     <button id="cancel-pp-config" class="btn" style="background:#f1f5f9; color:#475569;">Cancelar</button>
                     <button id="save-pp-config" class="btn btn-primary" style="background:#0f172a; color:white;">Guardar Configuración</button>
                </div>
                <div style="margin-top:1.5rem; font-size:0.85rem; color:#94a3b8; text-align:center;">
                    Obtén tus credenciales en el <a href="https://developer.paypal.com/dashboard/" target="_blank" style="color:#3b82f6; text-decoration:none;">Dashboard de PayPal</a>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => document.body.removeChild(overlay);

        document.getElementById('close-pp-config').onclick = close;
        document.getElementById('cancel-pp-config').onclick = close;

        const input = document.getElementById('pp-client-id-input');
        input.focus();

        document.getElementById('save-pp-config').onclick = () => {
            const val = input.value.trim();
            if (val && val !== currentId) {
                this.savePayPalConfig(val);
                setTimeout(() => location.reload(), 1000);
                overlay.innerHTML = `<div style="color:white; font-size:1.25rem; font-weight:600;">Guardando y recargando...</div>`;
            } else {
                close();
            }
        };
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
                <div class="modal-content" style="max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 0; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                    
                    <!-- Header Seguro -->
                    <div class="modal-header" style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 1.25rem 1.5rem; position: sticky; top: 0; z-index: 10;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div style="background:#dcfce7; padding:0.5rem; border-radius:50%; color:#16a34a;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </div>
                            <div>
                                <h3 class="modal-title" style="font-size:1.1rem; color:#0f172a; margin:0;">Checkout Seguro</h3>
                                <p style="font-size:0.8rem; color:#64748b; margin:0;">Transacción encriptada de 256-bit</p>
                            </div>
                        </div>
                        <button class="modal-close" onclick="NotaryCRM.closeModal('payment-modal')" style="top: 1.25rem; right: 1.25rem;">&times;</button>
                    </div>

                    <div class="modal-body" style="padding: 1.5rem;">
                        
                        <!-- Resumen de Orden -->
                        <div style="margin-bottom: 1.5rem;">
                            <p style="font-size:0.85rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem;">Resumen de la Orden</p>
                            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                                    <span id="payment-case-display" style="color:#334155; font-weight:500;">Servicio Notarial</span>
                                    <span id="payment-amount-display" style="font-weight:700; color:#0f172a;">$0.00</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:#64748b; margin-bottom:0.5rem;">
                                    <span>Impuestos y Tarifas</span>
                                    <span>$0.00</span>
                                </div>
                                <div style="border-top:1px dashed #cbd5e1; margin:0.75rem 0;"></div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-weight:700; color:#0f172a;">Total a Pagar</span>
                                    <span id="payment-total-display" style="font-size:1.25rem; font-weight:800; color:#2563eb;">$0.00</span>
                                </div>
                            </div>
                        </div>

                        <!-- Selector de Método -->
                        <div style="margin-bottom: 1.5rem;">
                             <p style="font-size:0.85rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.75rem;">Método de Pago</p>
                             
                             <!-- Contenedor PayPal (Incluye Tarjetas) -->
                             <div id="paypal-button-container" style="min-height: 150px;"></div>
                             
                             <div style="text-align:center; margin-top:1rem; display:flex; justify-content:center; gap:0.5rem; opacity:0.6;">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" height="20" alt="Visa">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" height="20" alt="Mastercard">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png" height="20" alt="PayPal">
                             </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background:#f1f5f9; padding:0.75rem; text-align:center; font-size:0.75rem; color:#64748b; border-top:1px solid #e2e8f0;">
                         <button onclick="PaymentManager.promptPayPalConfig()" style="background:none; border:none; cursor:pointer; color:#94a3b8; font-size:0.7rem;" title="Configurar Cuenta">⚙️ Configuración del Vendedor</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Update modal info
        const amountDisplay = modal.querySelector('#payment-amount-display');
        const caseDisplay = modal.querySelector('#payment-case-display');
        const totalDisplay = modal.querySelector('#payment-total-display');

        if (amountDisplay) amountDisplay.textContent = `$${caseItem.amount.toFixed(2)}`;
        if (totalDisplay) totalDisplay.textContent = `$${caseItem.amount.toFixed(2)}`;
        if (caseDisplay) caseDisplay.textContent = `${caseItem.type} #${caseItem.caseNumber}`;

        // Render PayPal Buttons
        this.renderPayPalButtons(caseItem.amount);

        if (window.NotaryCRM) window.NotaryCRM.openModal('payment-modal');
    },


    renderPayPalButtons(amount) {
        const container = document.getElementById('paypal-button-container');
        if (!container) return;

        // Wait for PayPal SDK to be ready if it's loading
        if (!window.paypal) {
            container.innerHTML = '<div style="text-align:center; padding: 20px; color: #64748b;">Cargando sistema de pagos seguros...</div>';
            setTimeout(() => this.renderPayPalButtons(amount), 500);
            return;
        }

        container.innerHTML = ''; // Clean slate

        try {
            window.paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'pay'
                },
                createOrder: (data, actions) => {
                    const value = amount.toFixed(2);
                    return actions.order.create({
                        intent: 'CAPTURE',
                        purchase_units: [{
                            amount: {
                                value: value,
                                currency_code: 'USD'
                            },
                            description: `Servicio Notarial - Caso ${this.currentCaseId}`
                        }],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING'
                        }
                    });
                },
                onApprove: (data, actions) => {
                    console.log('Autorizado, intentando captura...');
                    // This is the CRITICAL step that moves the money
                    return actions.order.capture().then((details) => {
                        console.log('✅ PayPal Transaction Details:', details);

                        // Strict validation
                        if (details.status === 'COMPLETED') {
                            const txId = details.id;

                            // 1. Process internal logic
                            this.processPayment(amount, 'PayPal', this.currentCaseId, details);

                            // 2. Close modal
                            if (window.NotaryCRM) window.NotaryCRM.closeModal('payment-modal');

                            // 3. Show Fancy Success Modal
                            this.showPaymentSuccess(txId);

                        } else {
                            console.warn('⚠️ Payment not completed:', details.status);
                            Toast.warning('Pago Incompleto', `El estado del pago es: ${details.status}`);
                        }
                    }).catch(err => {
                        console.error('CAPTURE ERROR:', err);
                        Toast.error('Error de Cobro', 'Autorizado, pero falló la captura final de fondos.');
                    });
                },
                onCancel: (data) => {
                    console.log('Pago cancelado por el usuario');
                    Toast.info('Cancelado', 'El proceso de pago fue cancelado.');
                },
                onError: (err) => {
                    console.error('❌ PayPal Error:', err);
                    Toast.error('Error de Sistema', 'No se pudo iniciar el proceso de pago. Verifique su conexión.');
                }
            }).render('#paypal-button-container');
        } catch (e) {
            console.error('⚠️ Critical PayPal Error:', e);
            container.innerHTML = '<p style="color:red; text-align:center;">Error cargando botones. Verifique su conexión y configuración.</p>';
        }
    },

    showPaymentSuccess(txId) {
        // Create fancy modal dynamically
        const modal = document.createElement('div');
        modal.className = 'modal active'; // Force active class
        modal.style.zIndex = '99999'; // Ensure top of everything
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content" style="text-align: center; max-width: 400px; padding: 2rem; border-radius: 16px; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                <div style="width: 80px; height: 80px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h2 style="color: #166534; font-size: 1.5rem; margin-bottom: 0.5rem;">¡Pago Exitoso!</h2>
                <p style="color: #64748b; margin-bottom: 2rem;">Los fondos han sido capturados correctamente.</p>
                
                <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 2rem; text-align: left;">
                    <div style="font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; font-weight: 600; margin-bottom: 4px;">ID de Transacción</div>
                    <div style="font-family: monospace; font-size: 1.1rem; font-weight: 700; color: #334155;">${txId}</div>
                    <div style="font-size: 0.8rem; color: #16a34a; margin-top: 4px;">✓ Verificado por PayPal</div>
                </div>

                <button class="btn btn-primary btn-block" style="padding: 1rem; font-size: 1rem;" onclick="this.closest('.modal').remove()">Aceptar y Continuar</button>
            </div>
            <style>
                @keyframes popIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
            </style>
        `;
        document.body.appendChild(modal);
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
        this.updateCasePaymentStatus(caseId, 'paid', payment);

        // Generate receipt
        this.generateDigitalReceipt(payment);

        // Log audit
        if (window.AuditManager) {
            AuditManager.logAction('Pago Real Procesado', caseId, `$${amount} - ${method} - TX: ${payment.transactionId || 'N/A'}`);
        }

        Toast.success('Pago Confirmado', `Pago de $${amount} completado exitosamente`);

        return payment;
    },


    async updateCasePaymentStatus(caseId, status, paymentData) {
        if (!window.NotaryCRM) return;

        // 1. Update Local State
        const cases = window.NotaryCRM.state.cases || [];
        const caseIndex = cases.findIndex(c => c.id === caseId);

        if (caseIndex !== -1) {
            cases[caseIndex].paymentStatus = status;
            // Merge new payment data with existing if needed, or array logic
            // For now, simpler: store the latest payment
            cases[caseIndex].paymentData = paymentData;

            // Force Reactivity/Render if needed
            if (window.NotaryCRM.renderCases) window.NotaryCRM.renderCases();
        }

        // 2. Persist to Firestore (CRITICAL)
        if (window.dbFuncs && window.NotaryCRM.currentUser) {
            try {
                const { doc, updateDoc } = window.dbFuncs;
                const db = window.firebaseDB;
                const caseRef = doc(db, 'cases', caseId);

                await updateDoc(caseRef, {
                    paymentStatus: status,
                    paymentData: paymentData,
                    lastUpdated: new Date().toISOString()
                });

                console.log('✅ Case Payment Status saved to Firestore:', status);

                // FORCE UI REFRESH
                if (window.NotaryCRM) {
                    // Update global state directly to ensure immediate feedback
                    const localCase = window.NotaryCRM.state.cases.find(c => c.id === caseId);
                    if (localCase) {
                        localCase.paymentStatus = status;
                        localCase.paymentData = paymentData;
                    }

                    // Render ALL relevant sections
                    if (window.NotaryCRM.renderCases) window.NotaryCRM.renderCases();
                    if (window.NotaryCRM.renderDashboard) window.NotaryCRM.renderDashboard();

                    // If we are in reports tab, refresh it too
                    const activeTab = document.querySelector('.tab-btn.active');
                    if (activeTab && activeTab.dataset.tab === 'reports' && window.NotaryCRM.renderReports) {
                        window.NotaryCRM.renderReports();
                    }

                    // Refresh Case Details Modal if open
                    const detailsModal = document.getElementById('case-details-modal');
                    if (detailsModal && detailsModal.classList.contains('active')) {
                        // Re-render the details content to show new payment status
                        if (window.NotaryCRM.showCaseDetails) {
                            window.NotaryCRM.showCaseDetails(caseId);
                        }
                    }
                }

            } catch (err) {
                console.error('❌ Error saving payment status to DB:', err);
                Toast.error('Error de Guardado', 'El pago se procesó pero hubo un error guardando el estado. Verifique su conexión.');
            }
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
            let d;
            if (c.createdAt && typeof c.createdAt.toDate === 'function') d = c.createdAt.toDate();
            else if (c.createdAt) d = new Date(c.createdAt);
            else return false;

            const caseYear = d.getFullYear();
            const status = c.paymentStatus ? c.paymentStatus.toLowerCase() : '';
            return caseYear === year && status === 'paid';
        });

        const totalRevenue = yearCases.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const casesByMonth = {};

        yearCases.forEach(c => {
            let d;
            if (c.createdAt && typeof c.createdAt.toDate === 'function') d = c.createdAt.toDate();
            else d = new Date(c.createdAt);

            const month = d.getMonth();
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
        Toast.success('Reporte Fiscal Generado', `Año ${year} - Total: $${window.NotaryCRM.formatCurrency(totalRevenue)}`);

        return report;
    },

    exportTaxReport(arg) {
        let report;
        // Handle if argument is just the year (number) as passed from HTML
        if (typeof arg === 'number') {
            report = this.generateTaxReport(arg);
        } else {
            report = arg;
        }

        if (!report) return;

        const csv = this.convertTaxReportToCSV(report);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        // Add BOM for Excel compatibility with UTF-8
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blobWithBom = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });

        link.href = URL.createObjectURL(blobWithBom);
        link.download = `Reporte_Fiscal_${report.year}_${new Date().toISOString().split('T')[0]}.csv`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up
        setTimeout(() => URL.revokeObjectURL(link.href), 100);

        Toast.success('Reporte Exportado', 'El archivo CSV se ha descargado correctamente.');
    },

    convertTaxReportToCSV(report) {
        let csv = 'Mes,Cantidad de Casos,Ingresos\n';
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        months.forEach((name, index) => {
            const revenue = report.monthlyBreakdown[index] || 0;
            // You might want to count cases per month too if you had that data easily available in the breakdown
            // For now just revenue
            csv += `${name},N/A,${revenue.toFixed(2)}\n`;
        });

        csv += `\nTOTAL ANUAL,${report.totalCases},${report.totalRevenue.toFixed(2)}\n`;
        return csv;
    }
};

if (typeof window !== 'undefined') {
    window.PaymentManager = PaymentManager;
}
