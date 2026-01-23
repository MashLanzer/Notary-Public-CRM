// ============================================
// NOTARY CRM - VANILLA JAVASCRIPT APPLICATION
// ============================================

// Global error catchers to show issues directly in the UI
function showFatalError(msg) {
    try {
        let banner = document.getElementById('notary-error-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'notary-error-banner';
            banner.style.position = 'fixed';
            banner.style.top = '0';
            banner.style.left = '0';
            banner.style.right = '0';
            banner.style.background = '#ffebee';
            banner.style.color = '#611a15';
            banner.style.padding = '12px 16px';
            banner.style.zIndex = 99999;
            banner.style.fontWeight = '600';
            banner.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
            document.body.appendChild(banner);
        }
        banner.textContent = 'ERROR: ' + String(msg);
    } catch (e) {
        console.error('Could not show fatal error banner', e);
    }
}

window.addEventListener('error', (ev) => {
    console.error('Global error caught', ev.error || ev.message, ev);
    showFatalError(ev.error ? (ev.error.message || ev.error) : ev.message || 'Unknown error');
});

window.addEventListener('unhandledrejection', (ev) => {
    console.error('Unhandled promise rejection', ev.reason);
    showFatalError(ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason));
});

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

const Toast = {
    container: null,

    init() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            console.warn('Toast container not found');
        }
    },

    show(options) {
        if (!this.container) this.init();

        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            dismissible = true
        } = options;

        const toast = this.createToast(type, title, message, dismissible);
        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('toast-show'), 10);

        // Auto dismiss
        if (duration > 0) {
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.animationDuration = `${duration}ms`;
            }

            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        return toast;
    },

    createToast(type, title, message, dismissible) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>`,
            error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`,
            info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>`
        };

        const titleHtml = title ? `<h4 class="toast-title">${this.escapeHtml(title)}</h4>` : '';
        const messageHtml = message ? `<p class="toast-message">${this.escapeHtml(message)}</p>` : '';

        toast.innerHTML = `
            <div class="toast-icon">
                ${icons[type] || icons.info}
            </div>
            <div class="toast-content">
                ${titleHtml}
                ${messageHtml}
            </div>
            ${dismissible ? `
                <button class="toast-close" aria-label="Cerrar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            ` : ''}
            <div class="toast-progress"></div>
        `;

        if (dismissible) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => this.dismiss(toast));
        }

        return toast;
    },

    dismiss(toast) {
        toast.classList.add('toast-hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Convenience methods
    success(title, message, duration) {
        return this.show({ type: 'success', title, message, duration });
    },

    error(title, message, duration) {
        return this.show({ type: 'error', title, message, duration });
    },

    warning(title, message, duration) {
        return this.show({ type: 'warning', title, message, duration });
    },

    info(title, message, duration) {
        return this.show({ type: 'info', title, message, duration });
    }
};

// Initialize Toast on page load
if (typeof window !== 'undefined') {
    window.Toast = Toast;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Toast.init());
    } else {
        Toast.init();
    }
}

// ============================================
// FORM VALIDATION SYSTEM
// ============================================

const FormValidator = {
    validators: {
        required: (value) => {
            const isValid = value.toString().trim() !== '';
            return {
                valid: isValid,
                message: isValid ? '' : 'Este campo es requerido'
            };
        },

        email: (value) => {
            if (!value) return { valid: true, message: '' };
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValid = emailRegex.test(value);
            return {
                valid: isValid,
                message: isValid ? '' : 'Email inválido (ej: usuario@ejemplo.com)'
            };
        },

        phone: (value) => {
            if (!value) return { valid: true, message: '' };
            // Acepta formatos: (555) 123-4567, 555-123-4567, 5551234567, +1 555 123 4567
            const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
            const isValid = phoneRegex.test(value.replace(/\s/g, ''));
            return {
                valid: isValid,
                message: isValid ? '' : 'Número de teléfono inválido'
            };
        },

        minLength: (min) => (value) => {
            if (!value) return { valid: true, message: '' };
            const isValid = value.length >= min;
            return {
                valid: isValid,
                message: isValid ? '' : `Mínimo ${min} caracteres`
            };
        },

        maxLength: (max) => (value) => {
            if (!value) return { valid: true, message: '' };
            const isValid = value.length <= max;
            return {
                valid: isValid,
                message: isValid ? '' : `Máximo ${max} caracteres`
            };
        },

        number: (value) => {
            if (!value) return { valid: true, message: '' };
            const isValid = !isNaN(value) && value.toString().trim() !== '';
            return {
                valid: isValid,
                message: isValid ? '' : 'Debe ser un número válido'
            };
        },

        min: (minValue) => (value) => {
            if (!value) return { valid: true, message: '' };
            const numValue = parseFloat(value);
            const isValid = !isNaN(numValue) && numValue >= minValue;
            return {
                valid: isValid,
                message: isValid ? '' : `Valor mínimo: ${minValue}`
            };
        },

        max: (maxValue) => (value) => {
            if (!value) return { valid: true, message: '' };
            const numValue = parseFloat(value);
            const isValid = !isNaN(numValue) && numValue <= maxValue;
            return {
                valid: isValid,
                message: isValid ? '' : `Valor máximo: ${maxValue}`
            };
        },

        date: (value) => {
            if (!value) return { valid: true, message: '' };
            const date = new Date(value);
            const isValid = date instanceof Date && !isNaN(date);
            return {
                valid: isValid,
                message: isValid ? '' : 'Fecha inválida'
            };
        },

        futureDate: (value) => {
            if (!value) return { valid: true, message: '' };
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isValid = date >= today;
            return {
                valid: isValid,
                message: isValid ? '' : 'La fecha debe ser hoy o posterior'
            };
        },

        pattern: (regex, customMessage) => (value) => {
            if (!value) return { valid: true, message: '' };
            const isValid = regex.test(value);
            return {
                valid: isValid,
                message: isValid ? '' : (customMessage || 'Formato inválido')
            };
        }
    },

    validateField(input, rules) {
        const value = input.value;
        let isValid = true;
        let message = '';

        // Ejecutar todas las reglas de validación
        for (const rule of rules) {
            const result = rule(value);
            if (!result.valid) {
                isValid = false;
                message = result.message;
                break; // Detener en el primer error
            }
        }

        return { isValid, message };
    },

    showValidation(input, isValid, message) {
        const formGroup = input.closest('.form-group');
        if (!formGroup) return;

        // Remover clases y elementos anteriores
        input.classList.remove('is-valid', 'is-invalid');
        const oldIcon = formGroup.querySelector('.validation-icon');
        const oldMessage = formGroup.querySelector('.validation-message');
        if (oldIcon) oldIcon.remove();
        if (oldMessage) oldMessage.remove();

        // Si el campo está vacío y no es requerido, no mostrar nada
        if (!input.value && !input.hasAttribute('required')) {
            return;
        }

        // Agregar clase apropiada
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');

        // Crear icono de validación
        const icon = document.createElement('div');
        icon.className = `validation-icon ${isValid ? 'valid' : 'invalid'}`;
        icon.innerHTML = isValid
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>`;

        // Insertar icono después del input
        input.parentNode.insertBefore(icon, input.nextSibling);

        // Mostrar mensaje de error
        if (!isValid && message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'validation-message error';
            messageEl.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>${message}</span>
            `;
            formGroup.appendChild(messageEl);
        }
    },

    setupValidation(formElement, validationRules) {
        if (!formElement) return;

        Object.keys(validationRules).forEach(fieldName => {
            const input = formElement.querySelector(`[name="${fieldName}"]`);
            if (!input) return;

            const rules = validationRules[fieldName];

            // Validar en tiempo real (al escribir)
            input.addEventListener('input', () => {
                const { isValid, message } = this.validateField(input, rules);
                this.showValidation(input, isValid, message);
            });

            // Validar al perder el foco
            input.addEventListener('blur', () => {
                const { isValid, message } = this.validateField(input, rules);
                this.showValidation(input, isValid, message);
            });
        });

        // Validar todo el formulario antes de enviar
        formElement.addEventListener('submit', (e) => {
            let hasErrors = false;

            Object.keys(validationRules).forEach(fieldName => {
                const input = formElement.querySelector(`[name="${fieldName}"]`);
                if (!input) return;

                const rules = validationRules[fieldName];
                const { isValid, message } = this.validateField(input, rules);
                this.showValidation(input, isValid, message);

                if (!isValid) {
                    hasErrors = true;
                    // Hacer scroll al primer error
                    if (hasErrors && input === formElement.querySelector('.is-invalid')) {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        input.focus();
                    }
                }
            });

            if (hasErrors) {
                e.preventDefault();
                Toast.error('Formulario Inválido', 'Por favor corrige los errores antes de continuar.');
                return false;
            }
        });
    },

    // Marcar campos requeridos visualmente
    markRequiredFields(formElement) {
        if (!formElement) return;

        const requiredInputs = formElement.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            const label = formElement.querySelector(`label[for="${input.id}"]`)
                || input.closest('.form-group')?.querySelector('.form-label');
            if (label && !label.classList.contains('required')) {
                label.classList.add('required');
            }
        });
    }
};

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.FormValidator = FormValidator;
}

// ============================================
// DASHBOARD CUSTOMIZATION MANAGER
// ============================================

const DashboardManager = {
    defaultConfig: {
        'total-clients': { visible: true, title: 'Total Clientes', description: 'Número total de clientes registrados' },
        'total-cases': { visible: true, title: 'Total Casos', description: 'Número total de expedientes' },
        'completed-cases': { visible: true, title: 'Casos Completados', description: 'Total de servicios finalizados' },
        'total-revenue': { visible: true, title: 'Ingresos Totales', description: 'Recaudación total confirmada' },
        'recent-cases': { visible: true, title: 'Casos Recientes', description: 'Tabla de los últimos movimientos' }
    },

    config: {},

    init() {
        this.loadConfig();
        this.applyConfig();
        this.attachListeners();
    },

    loadConfig() {
        const saved = localStorage.getItem('notary_dashboard_config');
        if (saved) {
            this.config = JSON.parse(saved);
            // Merge with defaults to ensure new widgets are included
            Object.keys(this.defaultConfig).forEach(id => {
                if (this.config[id] === undefined) {
                    this.config[id] = { ...this.defaultConfig[id] };
                }
            });
        } else {
            this.config = JSON.parse(JSON.stringify(this.defaultConfig));
        }
    },

    saveConfig() {
        localStorage.setItem('notary_dashboard_config', JSON.stringify(this.config));

        // If logged in, save to Firestore too
        if (NotaryCRM.currentUser && NotaryCRM.useFirestore) {
            const { doc, setDoc } = window.dbFuncs;
            const db = window.firebaseDB;
            const ref = doc(db, 'users', NotaryCRM.currentUser.uid, 'settings', 'dashboard');
            setDoc(ref, this.config).catch(err => console.error('Error saving dashboard to Firestore:', err));
        }
    },

    applyConfig() {
        Object.keys(this.config).forEach(id => {
            const element = document.querySelector(`[data-widget-id="${id}"]`);
            if (element) {
                if (this.config[id].visible) {
                    element.classList.remove('widget-hidden');
                } else {
                    element.classList.add('widget-hidden');
                }
            }
        });
    },

    openCustomization() {
        const container = document.getElementById('widgets-config');
        if (!container) return;

        container.innerHTML = Object.keys(this.config).map(id => {
            const widget = this.config[id];
            return `
                <div class="widget-toggle" data-id="${id}">
                    <div class="widget-toggle-info">
                        <div class="widget-toggle-icon">
                            ${this.getWidgetIcon(id)}
                        </div>
                        <div class="widget-toggle-text">
                            <h4>${widget.title}</h4>
                            <p>${widget.description}</p>
                        </div>
                    </div>
                    <div class="toggle-switch ${widget.visible ? 'active' : ''}" onclick="DashboardManager.toggleWidget('${id}', this)"></div>
                </div>
            `;
        }).join('');

        NotaryCRM.openModal('customize-dashboard-modal');
    },

    toggleWidget(id, element) {
        element.classList.toggle('active');
        this.config[id].visible = element.classList.contains('active');
    },

    getWidgetIcon(id) {
        const icons = {
            'total-clients': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>',
            'total-cases': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
            'completed-cases': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            'total-revenue': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
            'recent-cases': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
        };
        return icons[id] || icons['total-cases'];
    },

    attachListeners() {
        const customBtn = document.getElementById('customize-dashboard-btn');
        if (customBtn) customBtn.addEventListener('click', () => this.openCustomization());

        const saveBtn = document.getElementById('save-dashboard-config');
        if (saveBtn) saveBtn.addEventListener('click', () => {
            this.saveConfig();
            this.applyConfig();
            NotaryCRM.closeModal('customize-dashboard-modal');
            Toast.success('Configuración Guardada', 'El dashboard se ha actualizado correctamente.');
        });

        const resetBtn = document.getElementById('reset-dashboard-config');
        if (resetBtn) resetBtn.addEventListener('click', () => {
            this.config = JSON.parse(JSON.stringify(this.defaultConfig));
            this.saveConfig();
            this.applyConfig();
            this.openCustomization(); // Re-render toggles
            Toast.info('Dashboard Restablecido', 'Se han restaurado los widgets predeterminados.');
        });
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.DashboardManager = DashboardManager;
}

// Application State
window.NotaryCRM = {
    state: {
        clients: [],
        cases: [],
        appointments: [],
        users: [],
        activeTab: 'dashboard',
        clientsPage: 1,
        casesPage: 1,
        clientsPageSize: 6,
        casesPageSize: 6,
        searchClientQuery: '',
        searchCaseQuery: ''
    },
    currentUser: null,

    // Initialize application
    init() {
        this.useFirestore = !!window.firebaseDB && !!window.dbFuncs;
        this.attachEventListeners();

        // ensure no stray active modals block clicks
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';

        if (this.useFirestore && window.authFuncs && window.authFuncs.onAuthStateChanged) {
            // Wait for auth state to initialize app
            window.authFuncs.onAuthStateChanged(window.firebaseAuth, (user) => {
                this.handleAuthState(user);
            });
            // Reminders: load and schedule on init
            Reminders.init();
        } else {

            // No Firebase available — fall back
            this.loadData();
            this.render();
        }

        // Initialize form validation
        this.initFormValidation();

        // Initialize dashboard customization
        DashboardManager.init();
    },

    // Initialize form validation
    initFormValidation() {
        // Client form validation
        const clientForm = document.getElementById('client-form');
        if (clientForm) {
            const V = FormValidator.validators;

            FormValidator.setupValidation(clientForm, {
                name: [V.required, V.minLength(2)],
                email: [V.required, V.email],
                phone: [V.required, V.phone],
                address: [V.required, V.minLength(5)]
            });

            FormValidator.markRequiredFields(clientForm);
        }

        // Case form validation
        const caseForm = document.getElementById('case-form');
        if (caseForm) {
            const V = FormValidator.validators;

            FormValidator.setupValidation(caseForm, {
                clientId: [V.required],
                type: [V.required],
                amount: [V.required, V.number, V.min(0)],
                dueDate: [V.required, V.date],
                description: [V.required, V.minLength(10)]
            });

            FormValidator.markRequiredFields(caseForm);
        }

        // Calendar/Appointment form validation
        const calendarForm = document.getElementById('calendar-form');
        if (calendarForm) {
            const V = FormValidator.validators;

            FormValidator.setupValidation(calendarForm, {
                clientId: [V.required],
                date: [V.required, V.date, V.futureDate],
                time: [V.required],
                type: [V.required]
            });

            FormValidator.markRequiredFields(calendarForm);
        }

        // Auth form validation
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            const V = FormValidator.validators;

            FormValidator.setupValidation(authForm, {
                email: [V.required, V.email],
                password: [V.required, V.minLength(6)]
            });

            FormValidator.markRequiredFields(authForm);
        }
    },

    // Load data from localStorage
    loadData() {
        const clientsData = localStorage.getItem('notary_clients');
        const casesData = localStorage.getItem('notary_cases');

        if (clientsData) {
            this.state.clients = JSON.parse(clientsData);
        } else {
            // Initialize with sample data
            this.state.clients = [
                {
                    id: '1',
                    name: 'John Smith',
                    email: 'john@example.com',
                    phone: '(555) 123-4567',
                    address: '123 Main St, NY',
                    joinDate: '2024-01-15'
                },
                {
                    id: '2',
                    name: 'Maria Garcia',
                    email: 'maria@example.com',
                    phone: '(555) 234-5678',
                    address: '456 Oak Ave, CA',
                    joinDate: '2024-02-20'
                }
            ];
        }

        if (casesData) {
            this.state.cases = JSON.parse(casesData);
        } else {
            // Initialize with sample data
            this.state.cases = [
                {
                    id: '1',
                    caseNumber: 'NC-2024-001',
                    clientName: 'John Smith',
                    type: 'Document Notarization',
                    status: 'completed',
                    amount: 150,
                    dueDate: '2024-01-20',
                    description: 'Power of Attorney Notarization'
                },
                {
                    id: '2',
                    caseNumber: 'NC-2024-002',
                    clientName: 'Maria Garcia',
                    type: 'Affidavit',
                    status: 'in-progress',
                    amount: 200,
                    dueDate: '2024-03-15',
                    description: 'Statutory Affidavit'
                },
                {
                    id: '3',
                    caseNumber: 'NC-2024-003',
                    clientName: 'John Smith',
                    type: 'Acknowledgment',
                    status: 'pending',
                    amount: 100,
                    dueDate: '2024-03-25',
                    description: 'Real Estate Acknowledgment'
                }
            ];
        }
    },

    // Save data to localStorage
    saveData() {
        localStorage.setItem('notary_clients', JSON.stringify(this.state.clients));
        localStorage.setItem('notary_cases', JSON.stringify(this.state.cases));
    },

    // Initialize Firestore realtime listeners
    initFirestore() {
        const { collection, query, orderBy, onSnapshot } = window.dbFuncs;
        const db = window.firebaseDB;

        try {
            const { where } = window.dbFuncs;
            const clientsCol = collection(db, 'clients');
            const casesCol = collection(db, 'cases');

            // Listen to data belonging ONLY to the current user for real-time updates
            const clientsQuery = query(clientsCol, where('ownerId', '==', this.currentUser.uid));
            onSnapshot(clientsQuery, snapshot => {
                this.state.clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                this.renderClients();
                this.renderDashboard();
                console.log('Real-time clients update received');
            }, err => console.error('Clients snapshot failed', err));

            const casesQuery = query(casesCol, where('ownerId', '==', this.currentUser.uid));
            onSnapshot(casesQuery, snapshot => {
                this.state.cases = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                this.renderCases();
                this.renderDashboard();
                this.renderReports();
                console.log('Real-time cases update received');
            }, err => console.error('Cases snapshot failed', err));

            const appointmentsCol = collection(db, 'appointments');
            const appQuery = query(appointmentsCol, where('ownerId', '==', this.currentUser.uid));
            onSnapshot(appQuery, snapshot => {
                this.state.appointments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                this.renderCalendar();
                console.log('Real-time appointments update received');
            }, err => console.error('Appointments snapshot failed', err));

            // Users listener is only attached for admins
            this.state.users = this.state.users || [];
        } catch (err) {
            console.error('Firestore listeners failed', err);
            // fallback to localStorage
            this.loadData();
            this.render();
        }
    },

    // Start listening to users collection (admin only)
    startUsersListener() {
        if (!this.useFirestore) return;
        const { collection, query, orderBy, onSnapshot } = window.dbFuncs;
        const db = window.firebaseDB;
        try {
            const usersCol = collection(db, 'users');
            onSnapshot(query(usersCol, orderBy('createdAt', 'desc')), snapshot => {
                this.state.users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                this.renderUsers();
            });
        } catch (e) {
            console.error('Users listener failed', e);
        }
    },

    // Render users list for admin
    renderUsers() {
        const container = document.getElementById('users-list');
        if (!container) return;
        if (!this.state.users || this.state.users.length === 0) {
            container.innerHTML = '<p class="empty-state">No users available.</p>';
            return;
        }

        container.innerHTML = this.state.users.map(u => `
            <div class="user-row">
                <div style="flex:1">
                    <strong>${u.email || '(no email)'}</strong>
                    <div class="muted">Role: ${u.role || 'user'}</div>
                </div>
                <div>
                    ${u.role === 'admin' ? `<button class="btn" onclick="NotaryCRM.setUserRole('${u.id}','user')">Revoke admin</button>` : `<button class="btn" onclick="NotaryCRM.setUserRole('${u.id}','admin')">Make admin</button>`}
                </div>
            </div>
        `).join('');
    },

    async setUserRole(uid, role) {
        if (!this.useFirestore) return alert('Firebase no disponible');
        if (!this.isAdmin) return alert('No estás autorizado');
        const { doc, updateDoc } = window.dbFuncs;
        try {
            const ref = doc(window.firebaseDB, 'users', uid);
            await updateDoc(ref, { role });
        } catch (e) {
            console.error('setUserRole failed', e);
            alert('Error al cambiar rol: ' + (e.message || e));
        }
    },

    // Attach event listeners
    attachEventListeners() {
        // Tab switching
        try {
            const tabButtons = document.querySelectorAll('.tab-btn');
            if (!tabButtons || tabButtons.length === 0) console.warn('No tab buttons found');
            tabButtons.forEach(btn => {
                // ensure clickable
                btn.style.pointerEvents = 'auto';
                btn.setAttribute('tabindex', '0');
                btn.addEventListener('click', (e) => {
                    const tab = e.currentTarget.getAttribute('data-tab');
                    this.switchTab(tab);
                });
            });
        } catch (e) {
            console.error('Failed to attach tab listeners', e);
        }

        // Modal controls
        const calForm = document.getElementById('calendar-form');
        if (calForm) calForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAppointment(e.target);
        });

        const addClientBtn = document.getElementById('add-client-btn');
        if (addClientBtn) addClientBtn.addEventListener('click', () => this.openModal('client-modal'));

        const addCaseBtn = document.getElementById('add-case-btn');
        if (addCaseBtn) addCaseBtn.addEventListener('click', () => this.openModal('case-modal'));

        const remindersPanelBtn = document.getElementById('open-reminders-panel');
        if (remindersPanelBtn) {
            remindersPanelBtn.addEventListener('click', () => {
                this.switchTab('reminders');
            });
        }

        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Form submissions
        const clientForm = document.getElementById('client-form');
        if (clientForm) clientForm.addEventListener('submit', (e) => { e.preventDefault(); this.addClient(e.target); });

        const caseForm = document.getElementById('case-form');
        if (caseForm) caseForm.addEventListener('submit', (e) => { e.preventDefault(); this.addCase(e.target); });

        // Search functionality
        const searchClients = document.getElementById('search-clients');
        if (searchClients) searchClients.addEventListener('input', (e) => { this.state.searchClientQuery = e.target.value.toLowerCase(); this.state.clientsPage = 1; this.renderClients(); });

        const searchCases = document.getElementById('search-cases');
        if (searchCases) searchCases.addEventListener('input', (e) => { this.state.searchCaseQuery = e.target.value.toLowerCase(); this.state.casesPage = 1; this.renderCases(); });

        // Pagination controls
        const clientsPrev = document.getElementById('clients-prev');
        const clientsNext = document.getElementById('clients-next');
        const clientsPageSize = document.getElementById('clients-page-size');
        if (clientsPrev) clientsPrev.addEventListener('click', () => { if (this.state.clientsPage > 1) { this.state.clientsPage--; this.renderClients(); } });
        if (clientsNext) clientsNext.addEventListener('click', () => { this.state.clientsPage++; this.renderClients(); });
        if (clientsPageSize) clientsPageSize.addEventListener('change', (e) => { this.state.clientsPageSize = parseInt(e.target.value, 10); this.state.clientsPage = 1; this.renderClients(); });

        const casesPrev = document.getElementById('cases-prev');
        const casesNext = document.getElementById('cases-next');
        const casesPageSize = document.getElementById('cases-page-size');
        if (casesPrev) casesPrev.addEventListener('click', () => { if (this.state.casesPage > 1) { this.state.casesPage--; this.renderCases(); } });
        if (casesNext) casesNext.addEventListener('click', () => { this.state.casesPage++; this.renderCases(); });
        if (casesPageSize) casesPageSize.addEventListener('change', (e) => { this.state.casesPageSize = parseInt(e.target.value, 10); this.state.casesPage = 1; this.renderCases(); });

        // Export buttons
        const exportClientsCsv = document.getElementById('export-clients-csv');
        const exportClientsJson = document.getElementById('export-clients-json');
        const exportCasesCsv = document.getElementById('export-cases-csv');
        const exportCasesJson = document.getElementById('export-cases-json');
        if (exportClientsCsv) exportClientsCsv.addEventListener('click', () => this.exportClients('csv'));
        if (exportClientsJson) exportClientsJson.addEventListener('click', () => this.exportClients('json'));
        if (exportCasesCsv) exportCasesCsv.addEventListener('click', () => this.exportCases('csv'));
        if (exportCasesJson) exportCasesJson.addEventListener('click', () => this.exportCases('json'));

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });

        // Auth UI
        const signInBtn = document.getElementById('sign-in-btn');
        if (signInBtn) signInBtn.addEventListener('click', () => this.openModal('auth-modal'));

        const googleLoginBtn = document.getElementById('google-login-btn');
        if (googleLoginBtn) googleLoginBtn.addEventListener('click', () => this.googleLogin());

        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) registerBtn.addEventListener('click', () => this.registerFromForm());

        const authForm = document.getElementById('auth-form');
        if (authForm) authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.signIn(e.target);
        });

        // Ensure modal close buttons also work for auth modal
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = btn.getAttribute('data-modal');
                if (modalId) this.closeModal(modalId);
            });
        });
    },

    // Handle auth state
    handleAuthState(user) {
        this.currentUser = user;
        const authArea = document.getElementById('auth-area');
        if (user) {
            document.body.classList.add('authenticated');
            // show user email and sign out
            if (authArea) authArea.innerHTML = `
                <span class="user-email">${user.email}</span> 
                <button class="btn btn-signout" id="sign-out-btn">Cerrar sesión</button>
            `;
            const signOutBtn = document.getElementById('sign-out-btn');
            if (signOutBtn) signOutBtn.addEventListener('click', () => this.signOutUser());
            this.closeModal('auth-modal');

            // initialize Firestore realtime listeners once authenticated
            if (this.useFirestore) this.initFirestore();

            // fetch user profile to check role
            (async () => {
                try {
                    const { doc, getDoc, setDoc } = window.dbFuncs;
                    const db = window.firebaseDB;
                    const userRef = doc(db, 'users', user.uid);

                    // Also ensure user document exists in 'users' collection
                    const userSnap = await getDoc(userRef);
                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            email: user.email,
                            role: 'user',
                            createdAt: new Date().toISOString()
                        });
                    }

                    const data = userSnap.exists() ? userSnap.data() : { role: 'user' };
                    this.isAdmin = data && data.role === 'admin';

                    // show users tab if admin
                    const usersBtn = document.getElementById('users-tab-btn');
                    if (this.isAdmin && usersBtn) usersBtn.style.display = '';

                    if (this.isAdmin) {
                        this.startUsersListener();
                    }
                } catch (e) {
                    console.error('Failed to fetch user profile', e);
                }
            })();
        } else {
            document.body.classList.remove('authenticated');
            if (authArea) authArea.innerHTML = `<button class="btn" id="sign-in-btn">Iniciar sesión</button>`;
            const signInBtn = document.getElementById('sign-in-btn');
            if (signInBtn) signInBtn.addEventListener('click', () => this.openModal('auth-modal'));

            // clear data until sign-in
            this.state.clients = [];
            this.state.cases = [];
            this.render();
        }
    },

    // Sign in with Google
    async googleLogin() {
        if (!this.useFirestore) {
            Toast.error('Firebase No Disponible', 'El servicio de autenticación no está disponible.');
            return;
        }
        try {
            const provider = new window.authFuncs.GoogleAuthProvider();
            await window.authFuncs.signInWithPopup(window.firebaseAuth, provider);
            Toast.success('¡Bienvenido!', 'Has iniciado sesión con Google exitosamente.');
        } catch (err) {
            console.error('Google Sign-in failed', err);
            Toast.error('Error de Google', 'No se pudo iniciar sesión con Google: ' + (err.message || err));
        }
    },

    // Sign in with email/password
    async signIn(form) {
        if (!this.useFirestore) {
            Toast.error('Firebase No Disponible', 'El servicio de autenticación no está disponible.');
            return;
        }
        const fd = new FormData(form);
        const email = fd.get('email');
        const password = fd.get('password');
        try {
            await window.authFuncs.signInWithEmailAndPassword(window.firebaseAuth, email, password);
            // onAuthStateChanged will handle UI changes
        } catch (err) {
            console.error('Sign-in failed', err);
            Toast.error('Error de Autenticación', 'No se pudo iniciar sesión: ' + (err.message || err));
        }
    },

    // Register new user (quick flow)
    async registerFromForm() {
        const authForm = document.getElementById('auth-form');
        if (!authForm) return;
        const fd = new FormData(authForm);
        const email = fd.get('email');
        const password = fd.get('password');
        if (!email || !password) {
            Toast.warning('Campos Requeridos', 'Por favor proporciona email y contraseña.');
            return;
        }
        try {
            const cred = await window.authFuncs.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            const uid = cred.user.uid;
            // create user profile doc with role=user
            try {
                const { doc, setDoc, serverTimestamp } = window.dbFuncs;
                const db = window.firebaseDB;
                await setDoc(doc(db, 'users', uid), { email, role: 'user', createdAt: serverTimestamp() });
            } catch (e) {
                console.warn('Could not create user profile doc', e);
            }
            Toast.success('¡Cuenta Creada!', 'Tu cuenta ha sido creada exitosamente. Inicia sesión ahora.');
        } catch (err) {
            console.error('Register failed', err);
            Toast.error('Error de Registro', 'No se pudo crear la cuenta: ' + (err.message || err));
        }
    },

    // Sign out
    async signOutUser() {
        if (!this.useFirestore) return;
        try {
            await window.authFuncs.signOut(window.firebaseAuth);
        } catch (err) {
            console.error('Sign-out failed', err);
        }
    },

    // Switch tabs
    switchTab(tabName) {
        this.state.activeTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Trigger specific renders
        if (tabName === 'reports') this.renderReports();
        if (tabName === 'calendar') this.renderCalendar();
    },

    // Modal controls
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Auto-populate client selects if they exist in the modal
        const clientSelects = ['case-client-select', 'cal-client-select'];
        clientSelects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const currentVal = select.value;
                select.innerHTML = '<option value="">Selecciona un cliente</option>' +
                    this.state.clients.map(c => `<option value="${c.id}" ${c.id === currentVal ? 'selected' : ''}>${c.name}</option>`).join('');
            }
        });
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    },

    // Custom Confirmation Dialog
    confirmAction(title, message, onProceed) {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const proceedBtn = document.getElementById('confirm-proceed');
        const cancelBtn = document.getElementById('confirm-cancel');

        titleEl.textContent = title;
        messageEl.textContent = message;

        const handleProceed = () => {
            onProceed();
            this.closeModal('confirm-modal');
            proceedBtn.removeEventListener('click', handleProceed);
        };

        const handleCancel = () => {
            this.closeModal('confirm-modal');
            proceedBtn.removeEventListener('click', handleProceed);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        proceedBtn.addEventListener('click', handleProceed);
        cancelBtn.addEventListener('click', handleCancel);

        this.openModal('confirm-modal');
    },

    // Add client
    addClient(form) {
        const formData = new FormData(form);
        const id = formData.get('id');
        const client = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            birthDate: formData.get('birthDate'),
            idType: formData.get('idType'),
            idNumber: formData.get('idNumber'),
            maritalStatus: formData.get('maritalStatus'),
            occupation: formData.get('occupation'),
            notes: formData.get('notes'),
            joinDate: new Date().toISOString()
        };

        // If id exists -> update, else create
        if (id) {
            this.updateClient(id, client);
            this.closeModal('client-modal');
            return;
        }

        if (this.useFirestore) {
            if (!this.currentUser) {
                Toast.warning('Autenticación Requerida', 'Debes iniciar sesión para añadir clientes.');
                return;
            }
            const { collection, addDoc } = window.dbFuncs;
            const clientsCol = collection(window.firebaseDB, 'clients');
            // attach ownerId and createdAt server timestamp
            const toInsert = Object.assign({}, client, { ownerId: this.currentUser ? this.currentUser.uid : null, createdAt: window.dbFuncs.serverTimestamp() });
            addDoc(clientsCol, toInsert)
                .then(async (docRef) => {
                    this.closeModal('client-modal');
                    Toast.success('Cliente Agregado', `${client.name} ha sido añadido exitosamente.`);
                    // also save to SQL backend (if available)
                    try {
                        const api = getApiBase();
                        await fetch(api + '/api/clients', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(Object.assign({ id: docRef.id }, client, { ownerId: this.currentUser ? this.currentUser.uid : null, createdAt: new Date().toISOString() }))
                        });
                    } catch (e) {
                        console.warn('Sync to SQL failed', e);
                    }
                })
                .catch(err => {
                    console.error('Add client failed', err);
                    Toast.error('Error', 'No se pudo agregar el cliente.');
                });
        } else {
            client.id = Date.now().toString();
            this.state.clients.push(client);
            this.saveData();
            this.closeModal('client-modal');
            Toast.success('Cliente Agregado', `${client.name} ha sido añadido exitosamente.`);
            this.render();
        }
    },

    // Delete client
    deleteClient(id) {
        this.confirmAction(
            '¿Eliminar Cliente?',
            'Esta acción eliminará todos los datos asociados a este cliente.',
            () => {
                if (this.useFirestore) {
                    if (!this.currentUser) {
                        Toast.warning('Autenticación Requerida', 'Debes iniciar sesión para eliminar clientes.');
                        return;
                    }
                    const { doc, deleteDoc } = window.dbFuncs;
                    const clientRef = doc(window.firebaseDB, 'clients', id);
                    deleteDoc(clientRef)
                        .then(() => Toast.success('Cliente Eliminado', 'El cliente ha sido eliminado correctamente.'))
                        .catch(err => {
                            console.error('Delete client failed', err);
                            Toast.error('Error', 'No se pudo eliminar el cliente.');
                        });
                } else {
                    this.state.clients = this.state.clients.filter(c => c.id !== id);
                    this.saveData();
                    Toast.success('Cliente Eliminado', 'El cliente ha sido eliminado correctamente.');
                    this.render();
                }

                // also call backend to delete from SQL
                (async () => {
                    try {
                        const api = getApiBase();
                        await fetch(api + `/api/clients/${id}`, { method: 'DELETE' });
                    } catch (e) {
                        console.warn('SQL delete failed', e);
                    }
                })();
            }
        );
    },

    // Add case
    addCase(form) {
        const formData = new FormData(form);
        const id = formData.get('id');
        const clientId = formData.get('clientId');
        const client = this.state.clients.find(c => c.id === clientId) || {};

        const caseItem = {
            caseNumber: id ? formData.get('caseNumber') : this.generateCaseNumber(formData.get('type')),
            clientId: clientId,
            clientName: client.name || 'Unknown',
            type: formData.get('type'),
            location: formData.get('location'),
            amount: parseFloat(formData.get('amount')) || 0,
            paymentStatus: formData.get('paymentStatus') || 'pending',
            dueDate: formData.get('dueDate'),
            description: formData.get('description'),
            status: formData.get('status') || 'pending'
        };

        if (id) {
            this.updateCase(id, caseItem);
            this.closeModal('case-modal');
            return;
        }

        if (this.useFirestore) {
            if (!this.currentUser) {
                Toast.warning('Autenticación Requerida', 'Debes iniciar sesión para añadir casos.');
                return;
            }
            const { collection, addDoc, serverTimestamp } = window.dbFuncs;
            const casesCol = collection(window.firebaseDB, 'cases');
            const toInsert = Object.assign({}, caseItem, {
                ownerId: this.currentUser.uid,
                createdAt: serverTimestamp()
            });

            addDoc(casesCol, toInsert)
                .then(async (docRef) => {
                    try {
                        const api = getApiBase();
                        if (api) {
                            await fetch(api + '/api/cases', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(Object.assign({ id: docRef.id }, caseItem, {
                                    ownerId: this.currentUser.uid,
                                    createdAt: new Date().toISOString()
                                }))
                            });
                        }
                    } catch (e) {
                        console.warn('Sync case to SQL failed', e);
                    }

                    // Crear automáticamente una cita en el calendario con la fecha de vencimiento
                    if (caseItem.dueDate) {
                        try {
                            const appointmentsCol = collection(window.firebaseDB, 'appointments');
                            const appointment = {
                                clientId: caseItem.clientId,
                                clientName: caseItem.clientName,
                                date: caseItem.dueDate,
                                time: '09:00', // Hora por defecto para vencimiento de casos
                                type: `Vencimiento: ${caseItem.type}`,
                                ownerId: this.currentUser.uid,
                                createdAt: new Date().toISOString(),
                                caseId: docRef.id, // Referencia al caso
                                caseNumber: caseItem.caseNumber
                            };
                            await addDoc(appointmentsCol, appointment);
                            console.log('Cita de vencimiento creada automáticamente');
                        } catch (err) {
                            console.warn('No se pudo crear la cita automática:', err);
                        }
                    }

                    this.closeModal('case-modal');
                    Toast.success('Caso Creado', `Caso ${caseItem.caseNumber} ha sido creado exitosamente.`);
                })
                .catch(err => {
                    console.error('Add case failed', err);
                    Toast.error('Error al Crear Caso', 'No se pudo crear el caso: ' + (err.message || err));
                });
        } else {
            caseItem.id = Date.now().toString();
            this.state.cases.push(caseItem);
            this.saveData();
            this.closeModal('case-modal');
            Toast.success('Caso Creado', `Caso ${caseItem.caseNumber} ha sido creado exitosamente.`);
            this.render();
        }
    },

    // Delete case
    deleteCase(id) {
        this.confirmAction(
            '¿Eliminar Caso?',
            '¿Estás seguro de que deseas eliminar este expediente notarial?',
            () => {
                if (this.useFirestore) {
                    if (!this.currentUser) {
                        Toast.warning('Autenticación Requerida', 'Debes iniciar sesión para eliminar casos.');
                        return;
                    }
                    const { doc, deleteDoc } = window.dbFuncs;
                    const caseRef = doc(window.firebaseDB, 'cases', id);
                    deleteDoc(caseRef)
                        .then(() => Toast.success('Caso Eliminado', 'El caso ha sido eliminado correctamente.'))
                        .catch(err => {
                            console.error('Delete case failed', err);
                            Toast.error('Error', 'No se pudo eliminar el caso.');
                        });
                } else {
                    this.state.cases = this.state.cases.filter(c => c.id !== id);
                    this.saveData();
                    this.render();
                }

                // also call backend to delete from SQL
                (async () => {
                    try {
                        const api = getApiBase();
                        await fetch(api + `/api/cases/${id}`, { method: 'DELETE' });
                    } catch (e) {
                        console.warn('SQL delete failed', e);
                    }
                })();
            }
        );
    },

    // Open client modal populated for editing
    editClientPrompt(id) {
        const client = this.state.clients.find(c => c.id === id) || {};
        const form = document.getElementById('client-form');
        if (!form) return;
        form.querySelector('input[name="id"]').value = id || '';
        form.querySelector('input[name="name"]').value = client.name || '';
        form.querySelector('input[name="email"]').value = client.email || '';
        form.querySelector('input[name="phone"]').value = client.phone || '';
        form.querySelector('input[name="address"]').value = client.address || '';

        // New fields
        if (form.querySelector('input[name="birthDate"]')) form.querySelector('input[name="birthDate"]').value = client.birthDate || '';
        if (form.querySelector('select[name="idType"]')) form.querySelector('select[name="idType"]').value = client.idType || 'DNI';
        if (form.querySelector('input[name="idNumber"]')) form.querySelector('input[name="idNumber"]').value = client.idNumber || '';
        if (form.querySelector('select[name="maritalStatus"]')) form.querySelector('select[name="maritalStatus"]').value = client.maritalStatus || 'Single';
        if (form.querySelector('select[name="occupation"]')) form.querySelector('select[name="occupation"]').value = client.occupation || 'Empleado';
        if (form.querySelector('textarea[name="notes"]')) form.querySelector('textarea[name="notes"]').value = client.notes || '';

        this.openModal('client-modal');
    },

    async updateClient(id, updates) {
        if (this.useFirestore) {
            if (!this.currentUser) return alert('Debes iniciar sesión para editar clientes.');
            const { doc, updateDoc } = window.dbFuncs;
            const ref = doc(window.firebaseDB, 'clients', id);
            try {
                await updateDoc(ref, updates);
            } catch (err) {
                console.error('Update client failed', err);
            }
        } else {
            this.state.clients = this.state.clients.map(c => c.id === id ? Object.assign({}, c, updates) : c);
            this.saveData();
            this.render();
        }

        // sync update to SQL backend
        (async () => {
            try {
                const api = getApiBase();
                await fetch(api + `/api/clients/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.assign({ id }, updates))
                });
            } catch (e) {
                console.warn('SQL update client failed', e);
            }
        })();
    },

    // Open case modal populated for editing
    editCasePrompt(id) {
        const caseItem = this.state.cases.find(c => c.id === id) || {};
        const form = document.getElementById('case-form');
        if (!form) return;
        form.querySelector('input[name="id"]').value = id || '';
        form.querySelector('input[name="caseNumber"]').value = caseItem.caseNumber || '';
        if (form.querySelector('select[name="clientId"]')) form.querySelector('select[name="clientId"]').value = caseItem.clientId || '';
        form.querySelector('select[name="type"]').value = caseItem.type || 'Acknowledgment';
        if (form.querySelector('select[name="location"]')) form.querySelector('select[name="location"]').value = caseItem.location || 'Oficina';
        form.querySelector('input[name="amount"]').value = caseItem.amount || '';
        if (form.querySelector('select[name="paymentStatus"]')) form.querySelector('select[name="paymentStatus"]').value = caseItem.paymentStatus || 'pending';
        form.querySelector('input[name="dueDate"]').value = caseItem.dueDate ? (new Date(caseItem.dueDate)).toISOString().split('T')[0] : '';
        if (form.querySelector('select[name="status"]')) form.querySelector('select[name="status"]').value = caseItem.status || 'pending';
        form.querySelector('textarea[name="description"]').value = caseItem.description || '';
        this.openModal('case-modal');
    },

    async updateCase(id, updates) {
        if (this.useFirestore) {
            if (!this.currentUser) return alert('Debes iniciar sesión para editar casos.');
            const { doc, updateDoc, getDoc } = window.dbFuncs;
            const ref = doc(window.firebaseDB, 'cases', id);
            try {
                // update basic fields
                await updateDoc(ref, updates);
            } catch (err) {
                console.error('Update case failed', err);
            }
        } else {
            this.state.cases = this.state.cases.map(c => c.id === id ? Object.assign({}, c, updates) : c);
            this.saveData();
            this.render();
        }

        // sync update to SQL backend (strip _attachmentFile)
        (async () => {
            try {
                const payload = Object.assign({}, updates);
                const api = getApiBase();
                await fetch(api + `/api/cases/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.assign({ id }, payload))
                });
            } catch (e) {
                console.warn('SQL update case failed', e);
            }
        })();
    },

    // Render entire UI
    render() {
        this.renderDashboard();
        this.renderClients();
        this.renderCases();
    },

    // Render dashboard
    renderDashboard() {
        // Update statistics
        document.getElementById('total-clients').textContent = this.state.clients.length;
        document.getElementById('total-cases').textContent = this.state.cases.length;

        const completedCases = this.state.cases.filter(c => c.status === 'completed').length;
        document.getElementById('completed-cases').textContent = completedCases;

        const totalRevenue = this.state.cases.reduce((sum, c) => sum + c.amount, 0);
        document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;

        // Render recent cases table
        const tbody = document.getElementById('recent-cases-table');

        if (this.state.cases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No cases yet</td></tr>';
            return;
        }

        const recentCases = this.state.cases.slice(0, 5);
        tbody.innerHTML = recentCases.map(c => `
            <tr>
                <td style="font-weight: 500; color: var(--color-primary);">${c.caseNumber}</td>
                <td style="color: var(--color-gray-700);">${c.clientName}</td>
                <td style="color: var(--color-gray-700);">${c.type}</td>
                <td>${this.renderStatusBadge(c.status)}</td>
                <td style="font-weight: 600; color: var(--color-gray-900);">$${c.amount}</td>
            </tr>
        `).join('');
    },

    // Render clients
    renderClients() {
        const container = document.getElementById('clients-grid');
        if (!container) return;

        // Populate client select for cases modal
        const clientSelect = document.getElementById('case-client-select');
        if (clientSelect) {
            const currentVal = clientSelect.value;
            clientSelect.innerHTML = '<option value="">Select a client</option>' +
                this.state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            if (currentVal) clientSelect.value = currentVal;
        }

        const query = (this.state.searchClientQuery || '').toLowerCase();
        const filteredClients = this.state.clients.filter(client => {
            const name = (client.name || '').toLowerCase();
            const email = (client.email || '').toLowerCase();
            const idNum = (client.idNumber || '').toLowerCase();
            return name.includes(query) || email.includes(query) || idNum.includes(query);
        });

        if (filteredClients.length === 0) {
            container.innerHTML = '<p class="empty-state">No clients found.</p>';
            const indi = document.getElementById('clients-page-indicator'); if (indi) indi.textContent = 'Page 0';
            return;
        }

        // Pagination
        const pageSize = this.state.clientsPageSize || 6;
        const totalItems = filteredClients.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (this.state.clientsPage > totalPages) this.state.clientsPage = totalPages;
        if (this.state.clientsPage < 1) this.state.clientsPage = 1;
        const start = (this.state.clientsPage - 1) * pageSize;
        const pageItems = filteredClients.slice(start, start + pageSize);

        container.innerHTML = pageItems.map(client => `
            <div class="client-card premium-card">
                <div class="client-header">
                    <div class="client-info">
                        <div class="client-avatar">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div>
                            <h3 class="client-name">${client.name}</h3>
                            <p class="client-id">${client.idType || 'ID'}: ${client.idNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="NotaryCRM.editClientPrompt('${client.id}')" title="Editar Cliente">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon btn-danger" onclick="NotaryCRM.deleteClient('${client.id}')" title="Eliminar Cliente">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="client-details">
                    <div class="client-detail">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <span>${client.email || 'No email'}</span>
                    </div>
                    <div class="client-detail">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        <span>${client.phone || 'No phone'}</span>
                    </div>
                    <div class="client-detail">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>${client.address || 'No address'}</span>
                    </div>
                    <div class="client-tags">
                        ${client.maritalStatus ? `<span class="tag">${client.maritalStatus}</span>` : ''}
                        ${client.occupation ? `<span class="tag">${client.occupation}</span>` : ''}
                    </div>
                </div>
                ${client.notes ? `<div class="client-notes"><strong>Notas:</strong> ${client.notes}</div>` : ''}
                <div class="client-footer">
                    <span>Registrado: ${this.formatDate(client.joinDate)}</span>
                    <button class="btn btn-primary btn-sm" onclick="NotaryCRM.showClientDetails('${client.id}')">Expediente Completo</button>
                </div>
            </div>
        `).join('');

        // Update pagination
        const indicator = document.getElementById('clients-page-indicator');
        if (indicator) indicator.textContent = `Page ${this.state.clientsPage} / ${totalPages}`;
        const prevBtn = document.getElementById('clients-prev');
        const nextBtn = document.getElementById('clients-next');
        if (prevBtn) prevBtn.disabled = this.state.clientsPage <= 1;
        if (nextBtn) nextBtn.disabled = this.state.clientsPage >= totalPages;
    },

    // Render cases
    renderCases() {
        const container = document.getElementById('cases-list');
        if (!container) return;

        const filteredCases = this.state.cases.filter(c =>
            c.caseNumber.toLowerCase().includes(this.state.searchCaseQuery) ||
            c.clientName.toLowerCase().includes(this.state.searchCaseQuery)
        );

        if (filteredCases.length === 0) {
            container.innerHTML = '<p class="empty-state">No cases found.</p>';
            const indi = document.getElementById('cases-page-indicator'); if (indi) indi.textContent = 'Page 0';
            return;
        }

        const pageSize = this.state.casesPageSize || 6;
        const totalItems = filteredCases.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (this.state.casesPage > totalPages) this.state.casesPage = totalPages;
        if (this.state.casesPage < 1) this.state.casesPage = 1;
        const start = (this.state.casesPage - 1) * pageSize;
        const pageItems = filteredCases.slice(start, start + pageSize);

        container.innerHTML = pageItems.map(caseItem => `
            <div class="case-card premium-case-card">
                <div class="case-header">
                    <div style="flex:1">
                        <div class="case-title-row">
                            <h3 class="case-number">${caseItem.caseNumber}</h3>
                            <div style="display:flex; gap:0.5rem; flex-wrap: wrap;">
                                ${this.renderStatusBadge(caseItem.status)}
                                <span class="payment-badge ${caseItem.paymentStatus || 'pending'}">${(caseItem.paymentStatus || 'PENDIENTE').toUpperCase()}</span>
                            </div>
                        </div>
                        <p class="case-description">${caseItem.description}</p>
                        <button class="btn btn-sm" style="background:#f1f5f9; color:#475569; margin-top:0.5rem;" onclick="NotaryCRM.showCaseDetails('${caseItem.id}')">Ver Detalle Completo</button>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="const link = window.location.origin + '/status.html?case=${caseItem.caseNumber}'; NotaryCRM.copyToClipboard(link)" title="Copiar Enlace de Seguimiento">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </button>
                        <button class="btn-icon btn-invoice" onclick="NotaryCRM.generateInvoice('${caseItem.id}')" title="Generar Recibo/Factura">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                        <button class="btn-icon btn-sign" onclick="NotaryCRM.sendForSignature('${caseItem.id}')" title="Enviar para Firma Digital">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="btn-icon" onclick="NotaryCRM.editCasePrompt('${caseItem.id}')" title="Editar Caso">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn-icon btn-danger" onclick="NotaryCRM.deleteCase('${caseItem.id}')" title="Eliminar Caso">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="case-details-grid">
                    <div class="case-detail-item">
                        <p class="case-detail-label">Cliente</p>
                        <p class="case-detail-value">${caseItem.clientName}</p>
                    </div>
                    <div class="case-detail-item">
                        <p class="case-detail-label">Servicio</p>
                        <p class="case-detail-value">${caseItem.type}</p>
                    </div>
                    <div class="case-detail-item">
                        <p class="case-detail-label">Costo</p>
                        <p class="case-detail-value amount">$${(caseItem.amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}</p>
                    </div>
                    <div class="case-detail-item">
                        <p class="case-detail-label">Lugar</p>
                        <p class="case-detail-value">${caseItem.location || 'Oficina'}</p>
                    </div>
                    <div class="case-detail-item">
                        <p class="case-detail-label">Vencimiento</p>
                        <p class="case-detail-value">${this.formatDate(caseItem.dueDate)}</p>
                    </div>
                </div>
            </div>
        `).join('');

        const indicator = document.getElementById('cases-page-indicator');
        if (indicator) indicator.textContent = `Page ${this.state.casesPage} / ${totalPages}`;
        const prevBtn = document.getElementById('cases-prev');
        const nextBtn = document.getElementById('cases-next');
        if (prevBtn) prevBtn.disabled = this.state.casesPage <= 1;
        if (nextBtn) nextBtn.disabled = this.state.casesPage >= totalPages;
    },

    // Render status badge
    renderStatusBadge(status) {
        const statusConfig = {
            'completed': {
                class: 'status-completed',
                icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
                text: 'Completed'
            },
            'in-progress': {
                class: 'status-in-progress',
                icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
                text: 'In Progress'
            },
            'pending': {
                class: 'status-pending',
                icon: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
                text: 'Pending'
            }
        };

        const config = statusConfig[status] || statusConfig['pending'];

        return `
            <span class="status-badge ${config.class}">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${config.icon}
                </svg>
                ${config.text}
            </span>
        `;
    },

    // Format date (handles ISO strings and Firestore Timestamps)
    formatDate(value) {
        if (!value) return 'N/A';
        let dateObj;
        try {
            if (value && typeof value.toDate === 'function') {
                dateObj = value.toDate();
            } else {
                dateObj = new Date(value);
            }
        } catch (e) {
            return 'N/A';
        }
        if (isNaN(dateObj.getTime())) return 'N/A';
        return dateObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    copyToClipboard(text) {
        if (!navigator.clipboard) {
            // Fallback for non-https environments or old browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert('Enlace copiado al portapapeles');
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textArea);
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            alert('Enlace copiado al portapapeles');
        }).catch(err => {
            console.error('Async: Could not copy text: ', err);
        });
    },

    // Utility: download blob
    downloadBlob(filename, content, mime) {
        const blob = new Blob([content], { type: mime || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    },

    // Convert array of objects to CSV (simple, uses keys of first object)
    toCSV(items) {
        if (!items || items.length === 0) return '';
        const keys = Object.keys(items[0]);
        const header = keys.join(',');
        const rows = items.map(it => keys.map(k => {
            const v = it[k] == null ? '' : String(it[k]).replace(/"/g, '""');
            return '"' + v + '"';
        }).join(','));
        return [header].concat(rows).join('\n');
    },

    // --- Reports Rendering (Chart.js) ---
    renderReports() {
        const revenueCtx = document.getElementById('revenueChart');
        const servicesCtx = document.getElementById('servicesChart');
        const statusCtx = document.getElementById('statusChart');
        const locationCtx = document.getElementById('locationChart');
        const filterVal = document.getElementById('report-filter')?.value || 'all';

        if (!revenueCtx || !servicesCtx || !statusCtx || !locationCtx || this.state.cases.length === 0) return;

        // Filter cases by date
        const now = new Date();
        const filteredCases = this.state.cases.filter(c => {
            let d;
            if (c.createdAt && typeof c.createdAt.toDate === 'function') d = c.createdAt.toDate();
            else if (c.createdAt) d = new Date(c.createdAt);
            else return true;

            if (filterVal === 'week') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return d >= oneWeekAgo;
            } else if (filterVal === 'month') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            } else if (filterVal === 'lastMonth') {
                const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear();
            } else if (filterVal === 'year') {
                return d.getFullYear() === now.getFullYear();
            }
            return true;
        });

        // Update Total Revenue Stat
        const totalRev = filteredCases.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const totalEl = document.getElementById('report-total-revenue');
        if (totalEl) totalEl.textContent = `$${totalRev.toFixed(2)}`;

        // Cleanup existing charts if any
        if (this.revenueChart) this.revenueChart.destroy();
        if (this.servicesChart) this.servicesChart.destroy();
        if (this.statusChart) this.statusChart.destroy();
        if (this.locationChart) this.locationChart.destroy();

        // 1. Revenue by Month
        const monthlyRevenue = {};
        filteredCases.forEach(c => {
            let date;
            if (c.createdAt && typeof c.createdAt.toDate === 'function') {
                date = c.createdAt.toDate();
            } else if (c.createdAt) {
                date = new Date(c.createdAt);
            } else {
                date = new Date();
            }
            const month = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (parseFloat(c.amount) || 0);
        });

        this.revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: Object.keys(monthlyRevenue),
                datasets: [{
                    label: 'Ingresos ($)',
                    data: Object.values(monthlyRevenue),
                    borderColor: '#1e3a8a',
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });

        // 2. Most Requested Services
        const serviceCounts = {};
        filteredCases.forEach(c => {
            serviceCounts[c.type] = (serviceCounts[c.type] || 0) + 1;
        });

        this.servicesChart = new Chart(servicesCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(serviceCounts),
                datasets: [{
                    data: Object.values(serviceCounts),
                    backgroundColor: ['#1e3a8a', '#3b82f6', '#93c5fd', '#bfdbfe', '#dbeafe']
                }]
            },
            options: { responsive: true }
        });

        // 3. Case Status Distribution
        const statusCounts = { 'pending': 0, 'in-progress': 0, 'completed': 0 };
        filteredCases.forEach(c => {
            const s = c.status || 'pending';
            if (statusCounts[s] !== undefined) statusCounts[s]++;
        });

        this.statusChart = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: ['Pendiente', 'En Proceso', 'Completado'],
                datasets: [{
                    data: [statusCounts['pending'], statusCounts['in-progress'], statusCounts['completed']],
                    backgroundColor: ['#fee2e2', '#fef9c3', '#dcfce7'],
                    borderColor: ['#991b1b', '#854d0e', '#166534'],
                    borderWidth: 1
                }]
            },
            options: { responsive: true }
        });

        // 4. Revenue by Location
        const locationRevenue = { 'Oficina': 0, 'Casa': 0, 'Online': 0 };
        filteredCases.forEach(c => {
            const loc = c.location || 'Oficina';
            if (locationRevenue[loc] !== undefined) {
                locationRevenue[loc] += (parseFloat(c.amount) || 0);
            }
        });

        this.locationChart = new Chart(locationCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(locationRevenue),
                datasets: [{
                    label: 'Ingresos por Ubicación',
                    data: Object.values(locationRevenue),
                    backgroundColor: ['#1e3a8a', '#3b82f6', '#93c5fd']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    },

    // --- Calendar Rendering (FullCalendar) ---
    renderCalendar() {
        const calendarEl = document.getElementById('calendar-view');
        if (!calendarEl || !window.FullCalendar) return;

        if (this.fullCalendar) this.fullCalendar.destroy();

        const events = this.state.appointments.map(app => ({
            title: `${app.clientName} - ${app.type}`,
            start: `${app.date}T${app.time}`,
            color: '#1e3a8a'
        }));

        this.fullCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            events: events,
            themeSystem: 'standard',
            height: 'auto',
            dayMaxEvents: true,
            dateClick: (info) => {
                this.showDayDetails(info.dateStr);
            },
            eventClick: (info) => {
                const dateStr = info.event.start.toISOString().split('T')[0];
                this.showDayDetails(dateStr);
            }
        });

        this.fullCalendar.render();
    },

    showDayDetails(dateStr) {
        const appointments = this.state.appointments.filter(app => app.date === dateStr);
        const listEl = document.getElementById('day-appointments-list');
        const titleEl = document.getElementById('day-details-title');

        const dateObj = new Date(dateStr + 'T00:00:00');
        titleEl.textContent = `Citas: ${dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`;

        if (appointments.length === 0) {
            listEl.innerHTML = `<p style="text-align:center; color:var(--color-gray-500); padding: 2rem 0;">No hay citas programadas para este día.</p>`;
        } else {
            listEl.innerHTML = appointments.map(app => `
                <div class="timeline-item" style="padding-left: 0; margin-bottom: 1rem;">
                    <div class="timeline-card" style="margin-left: 0; border-left: 4px solid var(--color-primary); display: flex; align-items: center; justify-content: space-between;">
                        <div style="flex:1">
                            <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.25rem;">
                                <span class="timeline-time" style="background: var(--color-primary-light); color: var(--color-primary);">${app.time}</span>
                                <span style="font-size: 0.75rem; font-weight: 600; color: var(--color-gray-400);">${app.type}</span>
                            </div>
                            <div class="timeline-title">${app.clientName}</div>
                        </div>
                        <button class="btn-icon btn-danger" onclick="NotaryCRM.deleteAppointment('${app.id}')" title="Eliminar Cita">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        const addBtn = document.getElementById('add-from-day-btn');
        addBtn.onclick = () => {
            this.closeModal('day-details-modal');
            this.openModal('calendar-modal');
            const dateInput = document.querySelector('#calendar-modal input[name="date"]');
            if (dateInput) dateInput.value = dateStr;
        };

        this.openModal('day-details-modal');
    },

    async shareDayAgenda() {
        const titleEl = document.getElementById('day-details-title');
        const appointments = Array.from(document.querySelectorAll('#day-appointments-list .timeline-item'));

        if (appointments.length === 0) return alert('No hay citas para compartir.');

        let message = `*📅 Agenda ${titleEl.textContent}*\n\n`;

        appointments.forEach(item => {
            const time = item.querySelector('.timeline-time').textContent;
            const client = item.querySelector('.timeline-title').textContent;
            const type = item.querySelector('span[style*="font-size: 0.75rem"]').textContent;
            message += `⏰ *${time}* - ${client} (${type})\n`;
        });

        message += `\nGenerado desde *NotaryCRM*`;
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    },

    showClientDetails(id) {
        const client = this.state.clients.find(c => c.id === id);
        if (!client) return;

        const clientCases = this.state.cases.filter(c => c.clientId === id);
        const clientApps = this.state.appointments.filter(a => a.clientId === id);

        const content = document.getElementById('client-details-content');
        content.innerHTML = `
            <div class="case-details-grid" style="margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
                <div class="case-detail-item"><p class="case-detail-label">Nombre</p><p class="case-detail-value">${client.name}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">DNI/ID</p><p class="case-detail-value">${client.idType}: ${client.idNumber}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Email</p><p class="case-detail-value">${client.email}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Teléfono</p><p class="case-detail-value">${client.phone}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Ocupación</p><p class="case-detail-value">${client.occupation || 'N/A'}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Estado Civil</p><p class="case-detail-value">${client.maritalStatus || 'N/A'}</p></div>
            </div>
            
            <h4 style="margin-bottom: 1rem; color: var(--color-primary);">Historial de Casos (${clientCases.length})</h4>
            <div class="table-container" style="margin-bottom: 2rem;">
                <table class="data-table">
                    <thead>
                        <tr><th>Caso #</th><th>Servicio</th><th>Estado</th><th>Monto</th></tr>
                    </thead>
                    <tbody>
                        ${clientCases.map(c => `
                            <tr>
                                <td><strong>${c.caseNumber}</strong></td>
                                <td>${c.type}</td>
                                <td>${this.renderStatusBadge(c.status)}</td>
                                <td>$${c.amount}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <h4 style="margin-bottom: 1rem; color: var(--color-primary);">Próximas Citas</h4>
            <div class="reminders-timeline">
                ${clientApps.length === 0 ? '<p>No hay citas programadas.</p>' : clientApps.map(a => `
                    <div class="timeline-item" style="padding-left:0;">
                        <div class="timeline-card" style="margin-left:0; border-left: 4px solid #10b981;">
                            <strong>${a.date} a las ${a.time}</strong> - ${a.type}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.openModal('client-details-modal');
    },

    showCaseDetails(id) {
        const caseItem = this.state.cases.find(c => c.id === id);
        if (!caseItem) return;

        const client = this.state.clients.find(cl => cl.id === caseItem.clientId) || {};

        const content = document.getElementById('case-details-content');
        content.innerHTML = `
            <div class="case-details-featured">
                <div class="case-details-main">
                    <div class="section-header">
                        <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        <h4>Información del Expediente</h4>
                    </div>
                    
                    <div class="case-info-grid">
                        <div class="info-item">
                            <span class="info-label">Número de Caso</span>
                            <span class="info-value highlight">${caseItem.caseNumber}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estado Actual</span>
                            <div class="info-value">${this.renderStatusBadge(caseItem.status)}</div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estado de Pago</span>
                            <div class="info-value">
                                <span class="payment-badge ${caseItem.paymentStatus || 'pending'}">
                                    ${(caseItem.paymentStatus || 'PENDIENTE').toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Costo Total</span>
                            <span class="info-value amount">$${(parseFloat(caseItem.amount) || 0).toFixed(2)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha de Trámite</span>
                            <span class="info-value">${this.formatDate(caseItem.createdAt || new Date())}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Fecha de Vencimiento</span>
                            <span class="info-value">${this.formatDate(caseItem.dueDate)}</span>
                        </div>
                    </div>

                    <div class="case-description-box">
                        <span class="info-label">Descripción del Trámite</span>
                        <p>${caseItem.description || 'Sin descripción detallada.'}</p>
                    </div>

                    <div style="margin-top: 1.5rem; display: flex; gap: 1rem; align-items: center; background: #fffbeb; padding: 1rem; border-radius: 12px; border: 1px solid #fef3c7;">
                        <svg style="color: #d97706; width: 24px; height: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <div>
                            <span style="display:block; font-size: 0.75rem; font-weight: 700; color: #92400e; text-transform: uppercase;">Ubicación del Archivo</span>
                            <span style="font-weight: 600; color: #d97706;">${caseItem.location || 'Oficina Central'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="case-details-sidebar">
                    <div class="client-mini-card">
                        <div class="section-header">
                            <svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <h4>Cliente</h4>
                        </div>
                        
                        <div class="client-data-list">
                            <div class="client-data-item">
                                <span class="data-label">Nombre Completo</span>
                                <span class="data-value">${client.name || caseItem.clientName}</span>
                            </div>
                            <div class="client-data-item">
                                <span class="data-label">Identificación</span>
                                <span class="data-value">${client.idNumber || 'N/A'}</span>
                            </div>
                            <div class="client-data-item">
                                <span class="data-label">Teléfono</span>
                                <span class="data-value">${client.phone || 'N/A'}</span>
                            </div>
                            <div class="client-data-item">
                                <span class="data-label">Email</span>
                                <span class="data-value">${client.email || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="case-actions-panel">
                        <button class="btn btn-primary btn-block" onclick="NotaryCRM.generateInvoice('${caseItem.id}')">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Descargar Recibo
                        </button>
                        <button class="btn btn-block btn-outline-purple" onclick="NotaryCRM.sendForSignature('${caseItem.id}')">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            Solicitar Firma
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.openModal('case-details-modal');
    },

    // --- Appointment Management ---
    async addAppointment(form) {
        if (!this.currentUser) return alert('Debes iniciar sesión.');

        const formData = new FormData(form);
        const clientId = formData.get('clientId');
        const client = this.state.clients.find(c => c.id === clientId);

        const appointment = {
            clientId: clientId,
            clientName: client ? client.name : 'Unknown',
            date: formData.get('date'),
            time: formData.get('time'),
            type: formData.get('type'),
            ownerId: this.currentUser.uid,
            createdAt: new Date().toISOString()
        };

        try {
            const { addDoc, collection } = window.dbFuncs;
            const db = window.firebaseDB;
            await addDoc(collection(db, 'appointments'), appointment);

            form.reset();
            this.closeModal('calendar-modal');
        } catch (err) {
            console.error('Error adding appointment:', err);
            alert('Error al programar la cita.');
        }
    },

    deleteAppointment(id) {
        this.confirmAction(
            '¿Eliminar Cita?',
            '¿Estás seguro de que deseas cancelar esta cita?',
            () => {
                const { doc, deleteDoc } = window.dbFuncs;
                const appRef = doc(window.firebaseDB, 'appointments', id);
                deleteDoc(appRef).then(() => {
                    this.closeModal('day-details-modal');
                }).catch(err => console.error('Delete appointment failed', err));
            }
        );
    },

    exportClients(format) {
        const data = this.state.clients || [];
        if (format === 'json') {
            this.downloadBlob('clients.json', JSON.stringify(data, null, 2), 'application/json');
        } else {
            const csv = this.toCSV(data);
            this.downloadBlob('clients.csv', csv, 'text/csv');
        }
    },

    exportCases(format) {
        const data = this.state.cases || [];
        if (format === 'json') {
            this.downloadBlob('cases.json', JSON.stringify(data, null, 2), 'application/json');
        } else {
            const csv = this.toCSV(data);
            this.downloadBlob('cases.csv', csv, 'text/csv');
        }
    },

    async generateInvoice(caseId) {
        const caseItem = this.state.cases.find(c => c.id === caseId);
        if (!caseItem) return alert('Caso no encontrado.');

        const client = this.state.clients.find(cl => cl.id === caseItem.clientId) || {};

        // Robust jsPDF detection
        let jsPDFClass = null;
        if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFClass = window.jspdf.jsPDF;
        } else if (window.jsPDF) {
            jsPDFClass = window.jsPDF;
        }

        if (!jsPDFClass) {
            return alert('Error: La librería PDF no se cargó correctamente. Por favor refresca la página.');
        }

        const doc = new jsPDFClass();

        // 🎨 Design Colors
        const primaryColor = [30, 58, 138]; // Navy Blue
        const secondaryColor = [107, 114, 128]; // Gray

        // 🏦 Header - Notary Logo/Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('NOTARY PUBLIC SERVICES', 20, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Professional Legal Document Authentication', 20, 32);

        // 📄 Invoice Info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('RECIBO / FACTURA', 140, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nº Control: ${caseItem.caseNumber}`, 140, 32);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 140, 38);

        // 👨‍💼 Notary Details (Static Placeholder)
        doc.setFont('helvetica', 'bold');
        doc.text('NOTARIO:', 20, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(this.currentUser?.displayName || 'Notario Profesional', 20, 60);
        doc.text(this.currentUser?.email || 'notaria@servicio.com', 20, 65);

        // 👤 Client Details
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENTE:', 110, 55);
        doc.setFont('helvetica', 'normal');

        // Prefer data from current state, fallback to saved case name
        const clientName = client.name || caseItem.clientName || 'N/A';
        doc.text(clientName, 110, 60);
        doc.text(`ID/DNI: ${client.idNumber || 'N/A'}`, 110, 65);
        doc.text(`Tel: ${client.phone || 'N/A'}`, 110, 70);

        const address = client.address || 'Sin dirección registrada';
        const splitAddress = doc.splitTextToSize(address, 70);
        doc.text(splitAddress, 110, 75);

        // 📊 Table Header
        doc.setFillColor(243, 244, 246);
        doc.rect(20, 85, 170, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('Descripción del Servicio', 25, 92);
        doc.text('TOTAL', 160, 92);

        // 📋 Service Details
        doc.setFont('helvetica', 'normal');
        doc.text(caseItem.type, 25, 105);
        doc.text(`(Ubicación: ${caseItem.location || 'Oficina'})`, 25, 110);

        const amountStr = `$${(caseItem.amount || 0).toFixed(2)}`;
        doc.text(amountStr, 160, 105);

        // 💰 Summary
        doc.line(20, 120, 190, 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('TOTAL A PAGAR:', 110, 135);
        doc.text(amountStr, 160, 135);

        doc.setFontSize(10);
        doc.text('ESTADO DE PAGO:', 110, 145);
        if (caseItem.paymentStatus === 'paid') {
            doc.setTextColor(22, 163, 74);
        } else {
            doc.setTextColor(220, 38, 38);
        }
        doc.text((caseItem.paymentStatus || 'pendiente').toUpperCase(), 160, 145);

        // 📝 Notes
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        if (caseItem.description) {
            doc.text('Notas adicionales:', 20, 165);
            doc.setFont('helvetica', 'normal');
            const splitNotes = doc.splitTextToSize(caseItem.description, 170);
            doc.text(splitNotes, 20, 172);
        }

        // 🖋️ Signature Area
        doc.line(130, 220, 180, 220);
        doc.text('Firma del Notario', 140, 225);

        // 👣 Footer
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Gracias por su confianza. Este documento sirve como comprobante legal de los servicios prestados.', 105, 280, { align: 'center' });

        // 🚀 Save PDF
        doc.save(`Recibo_${caseItem.caseNumber}.pdf`);
    },

    // --- Helper: Generate Case Number ---
    generateCaseNumber(serviceType) {
        const initialsMap = {
            'Apostille': 'AP',
            'Power of Attorney': 'PA',
            'Affidavit': 'AF',
            'Real Estate Deed': 'RD',
            'Wills / Trusts': 'WT',
            'Certified Copies': 'CC',
            'Oath / Affirmation': 'OA',
            'Loan Signing': 'LS',
            'Acknowledgment': 'AC',
            'Other': 'OT'
        };
        const initials = initialsMap[serviceType] || 'NT';
        const date = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
        const random = Math.floor(1000 + Math.random() * 9000); // 4 digits
        return `${initials}${date}${random}`;
    },

    // Digital Signature Integration
    async sendForSignature(caseId) {
        const caseItem = this.state.cases.find(c => c.id === caseId);
        if (!caseItem) return alert('Caso no encontrado.');

        const client = this.state.clients.find(cl => cl.id === caseItem.clientId);
        if (!client) return alert('Información del cliente no disponible.');

        // Generate full tracking link
        const baseUrl = window.location.origin;
        const trackingLink = `${baseUrl}/status.html?case=${caseItem.caseNumber}`;

        const message = `Hola ${client.name}, le envío el documento correspondiente al caso ${caseItem.caseNumber} (${caseItem.type}) para su firma digital. \n\nPuede rastrear el avance de su trámite en este enlace directo: ${trackingLink}`;
        const encodedMsg = encodeURIComponent(message);

        // Options: WhatsApp or Email
        const action = confirm('¿Desea enviar la solicitud de firma por WhatsApp? (Cancelar para enviar por Email)');

        if (action) {
            const phone = client.phone ? client.phone.replace(/\D/g, '') : '';
            window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
        } else {
            const subject = encodeURIComponent(`Firma Digital - Caso ${caseItem.caseNumber}`);
            window.location.href = `mailto:${client.email}?subject=${subject}&body=${encodedMsg}`;
        }
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Copiado al portapapeles: ' + text);
        }).catch(err => {
            console.error('Error al copiar: ', err);
        });
    }
};

// Reminders Management
const Reminders = {
    state: {
        items: []
    },
    init() {
        this.load();
        this.attachListeners();
        this.render();
        console.info('Reminders initialized');
    },
    load() {
        const saved = localStorage.getItem('notary_reminders');
        if (saved) {
            this.state.items = JSON.parse(saved);
        }
    },
    save() {
        localStorage.setItem('notary_reminders', JSON.stringify(this.state.items));
    },
    attachListeners() {
        const openBtn = document.getElementById('open-reminders');
        if (openBtn) openBtn.addEventListener('click', () => NotaryCRM.openModal('reminders-modal'));

        const form = document.getElementById('reminder-form');
        if (form) form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.add(new FormData(e.target));
            e.target.reset();
        });

        const refreshBtn = document.getElementById('refresh-reminders-btn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.render());
    },
    add(formData) {
        const item = {
            id: Date.now().toString(),
            title: formData.get('title'),
            message: formData.get('message'),
            when: formData.get('when'),
            createdAt: new Date().toISOString()
        };
        this.state.items.push(item);
        this.save();
        this.render();
        alert('Recordatorio guardado');
    },
    delete(id) {
        this.state.items = this.state.items.filter(it => it.id !== id);
        this.save();
        this.render();
    },
    render() {
        const list = document.getElementById('reminders-list');
        const timeline = document.getElementById('reminders-tab-timeline');
        if (!list && !timeline) return;

        const sorted = [...this.state.items].sort((a, b) => new Date(a.when) - new Date(b.when));
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Grouping for Timeline
        const groups = {
            today: { title: 'Hoy', items: [] },
            upcoming: { title: 'Próximamente', items: [] },
            past: { title: 'Historial / Pasados', items: [] }
        };

        sorted.forEach(it => {
            const itDate = new Date(it.when);
            const itDateStr = itDate.toISOString().split('T')[0];

            if (itDate < now && itDateStr !== todayStr) {
                groups.past.items.push(it);
            } else if (itDateStr === todayStr) {
                groups.today.items.push(it);
            } else {
                groups.upcoming.items.push(it);
            }
        });

        // 1. Render Modal List (simplified)
        if (list) {
            if (sorted.length === 0) {
                list.innerHTML = '<p class="empty-state">No hay recordatorios.</p>';
            } else {
                list.innerHTML = sorted.map(it => `
                    <div class="reminder-item" style="border-bottom: 1px solid var(--color-gray-100); padding: 8px 0; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="font-size:0.9rem;">${it.title}</strong>
                            <div style="font-size:0.75rem; color:var(--color-primary);">${new Date(it.when).toLocaleString()}</div>
                        </div>
                        <button class="btn-icon btn-danger" onclick="Reminders.delete('${it.id}')">
                            <svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `).join('');
            }
        }

        // 2. Render Timeline Tab
        if (timeline) {
            if (sorted.length === 0) {
                timeline.innerHTML = '<p class="empty-state">No tienes recordatorios creados. Comienza añadiendo uno arriba.</p>';
            } else {
                let html = '';
                [groups.today, groups.upcoming, groups.past].forEach(group => {
                    if (group.items.length > 0) {
                        html += `<div class="timeline-group">
                            <div class="timeline-header">${group.title}</div>
                            ${group.items.map(it => {
                            const d = new Date(it.when);
                            const isPast = d < now;
                            return `
                                    <div class="timeline-item ${isPast ? 'past' : ''}">
                                        <div class="timeline-dot"></div>
                                        <div class="timeline-card">
                                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                                <div>
                                                    <span class="timeline-time">${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                                    <h4 class="timeline-title">${it.title}</h4>
                                                    <p class="timeline-msg">${it.message}</p>
                                                </div>
                                                <button class="btn-icon btn-danger" onclick="Reminders.delete('${it.id}')" title="Eliminar">
                                                    <svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                        }).join('')}
                        </div>`;
                    }
                });
                timeline.innerHTML = html || '<p class="empty-state">No hay nada en tu agenda.</p>';
            }
        }
    }
};

// Expose to global for onclick handlers
window.Reminders = Reminders;
window.NotaryCRM = NotaryCRM;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotaryCRM.init());
} else {
    NotaryCRM.init();
}

// Helper to determine API base for SQL backend
function getApiBase() {
    // If running on localhost, target port 5000; otherwise assume same origin and path /api
    try {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return `${window.location.protocol}//${host}:5000`;
        }
    } catch (e) { }
    return '';
}
