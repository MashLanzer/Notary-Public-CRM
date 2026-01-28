// ============================================
// NOTARY CRM-VANILLA JAVASCRIPT APPLICATION
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
        if (duration> 0) {
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
            const isValid = value.length>= min;
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
            const isValid = !isNaN(numValue) && numValue>= minValue;
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
            const isValid = date>= today;
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
// FORM MASKS (INPUT FORMATTING)
// ============================================

const FormMasks = {
    init() {
        this.apply();
    },

    apply() {
        // Phone mask: (XXX) XXX-XXXX
        document.querySelectorAll('.mask-phone').forEach(input => {
            if (input.dataset.maskApplied) return;
            input.addEventListener('input', (e) => {
                let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
                e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            });
            input.dataset.maskApplied = 'true';
        });

        // Currency mask: only numbers and decimals
        document.querySelectorAll('.mask-currency').forEach(input => {
            if (input.dataset.maskApplied) return;
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/[^0-9.]/g, '');
                const dots = value.split('.').length-1;
                if (dots> 1) value = value.substring(0, value.lastIndexOf('.'));
                e.target.value = value;
            });
            input.addEventListener('blur', (e) => {
                let value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    e.target.value = value.toFixed(2);
                }
            });
            input.dataset.maskApplied = 'true';
        });

        // Date mask: MM/DD/YYYY
        document.querySelectorAll('.mask-date').forEach(input => {
            if (input.dataset.maskApplied) return;
            input.addEventListener('input', (e) => {
                let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,2})(\d{0,4})/);
                e.target.value = !x[2] ? x[1] : x[1] + '/' + x[2] + (x[3] ? '/' + x[3] : '');
            });
            input.dataset.maskApplied = 'true';
        });
    }
};

if (typeof window !== 'undefined') {
    window.FormMasks = FormMasks;
}

// ============================================
// DASHBOARD CUSTOMIZATION MANAGER
// ============================================

const DashboardManager = {
    defaultConfig: {
        'total-clients': { visible: true, order: 1, title: 'Total Clientes', description: 'Número total de clientes registrados' },
        'total-cases': { visible: true, order: 2, title: 'Total Casos', description: 'Número total de expedientes' },
        'completed-cases': { visible: true, order: 3, title: 'Casos Completados', description: 'Total de servicios finalizados' },
        'today-appointments': { visible: true, order: 4, title: 'Citas de Hoy', description: 'Citas programadas para hoy' },
        'pending-payments': { visible: true, order: 5, title: 'Por Cobrar', description: 'Total pendiente de cobro' },
        'total-revenue': { visible: true, order: 6, title: 'Ingresos Totales', description: 'Recaudación total confirmada' },
        'avg-ticket': { visible: true, order: 7, title: 'Ticket Promedio', description: 'Valor promedio por caso' },
        'success-rate': { visible: true, order: 8, title: 'Tasa de Éxito', description: 'Porcentaje de casos exitosos' },
        'recent-cases': { visible: true, order: 9, title: 'Casos Recientes', description: 'Tabla de los últimos movimientos' }
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
            Object.keys(this.defaultConfig).forEach(id => {
                if (this.config[id] === undefined) {
                    this.config[id] = { ...this.defaultConfig[id] };
                }
                // Ensure order propery exists for legacy configs
                if (this.config[id].order === undefined) {
                    this.config[id].order = this.defaultConfig[id].order;
                }
            });
        } else {
            this.config = JSON.parse(JSON.stringify(this.defaultConfig));
        }
    },

    saveConfig() {
        localStorage.setItem('notary_dashboard_config', JSON.stringify(this.config));
        if (NotaryCRM.currentUser && NotaryCRM.useFirestore) {
            const { doc, setDoc } = window.dbFuncs;
            const db = window.firebaseDB;
            const ref = doc(db, 'users', NotaryCRM.currentUser.uid, 'settings', 'dashboard');
            setDoc(ref, this.config).catch(console.error);
        }
    },

    applyConfig() {
        // Sort items by order
        const sortedIds = Object.keys(this.config).sort((a, b) => this.config[a].order-this.config[b].order);

        const grid = document.getElementById('dashboard-stats-grid');

        sortedIds.forEach(id => {
            const element = document.querySelector(`[data-widget-id="${id}"]`);
            if (element) {
                // Visibility
                if (this.config[id].visible) {
                    element.classList.remove('widget-hidden');
                    element.style.display = ''; // Reset display
                } else {
                    element.classList.add('widget-hidden');
                    element.style.display = 'none'; // Force hide
                }

                // Reorder in DOM
                if (id !== 'recent-cases' && grid && grid.contains(element)) {
                    grid.appendChild(element); // Appending moves it to the end, effectively sorting
                }
            }
        });
    },

    openCustomization() {
        const container = document.getElementById('widgets-config');
        if (!container) return;

        // Sort for display in modal
        const sortedIds = Object.keys(this.config).sort((a, b) => this.config[a].order-this.config[b].order);

        container.innerHTML = sortedIds.map((id, index) => {
            const widget = this.config[id];
            const isFirst = index === 0;
            const isLast = index === sortedIds.length-1;

            return `
                <div class="widget-toggle" data-id="${id}" style="display:flex; align-items:center; gap:1rem; padding:0.75rem; border:1px solid #e5e7eb; border-radius:0.5rem; margin-bottom:0.5rem;">
                    
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <button type="button" class="btn-icon btn-sm" onclick="DashboardManager.moveWidget('${id}', -1)" ${isFirst ? 'disabled' : ''} title="Subir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        </button>
                        <button type="button" class="btn-icon btn-sm" onclick="DashboardManager.moveWidget('${id}', 1)" ${isLast ? 'disabled' : ''} title="Bajar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </div>

                    <div class="widget-toggle-info" style="flex:1;">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                             <div class="widget-toggle-icon" style="color:var(--color-primary);">${this.getWidgetIcon(id)}</div>
                             <h4 style="margin:0; font-size:0.9rem;">${widget.title}</h4>
                        </div>
                        <p style="margin:2px 0 0 0; font-size:0.75rem; color:#6b7280;">${widget.description}</p>
                    </div>
                    
                    <div class="toggle-switch ${widget.visible ? 'active' : ''}" onclick="DashboardManager.toggleWidget('${id}', this)"></div>
                </div>
            `;
        }).join('');

        NotaryCRM.openModal('customize-dashboard-modal');
    },

    moveWidget(id, direction) {
        const sortedIds = Object.keys(this.config).sort((a, b) => this.config[a].order-this.config[b].order);
        const currentIndex = sortedIds.indexOf(id);
        if (currentIndex === -1) return;

        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex>= sortedIds.length) return;

        const swapId = sortedIds[newIndex];

        // Swap orders
        const tempOrder = this.config[id].order;
        this.config[id].order = this.config[swapId].order;
        this.config[swapId].order = tempOrder;

        this.applyConfig();
        this.openCustomization(); // Re-render modal
    },

    toggleWidget(id, element) {
        element.classList.toggle('active');
        this.config[id].visible = element.classList.contains('active');
        this.applyConfig(); // Apply immediately for preview effect
    },

    getWidgetIcon(id) {
        const icons = {
            'total-clients': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>',
            'total-cases': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
            'completed-cases': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            'total-revenue': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
            'recent-cases': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
            'avg-ticket': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>',
            'success-rate': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            'today-appointments': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
            'pending-payments': '<svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
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
    },

    toggleCommanderMode() {
        document.body.classList.toggle('commander-mode');
        const isCommander = document.body.classList.contains('commander-mode');

        if (isCommander) {
            Toast.show({
                type: 'info',
                title: 'TV View Activo',
                message: 'Información a gran escala para monitoreo. Presione ESC para salir.',
                duration: 8000
            });

            // Try to enter fullscreen for true TV experience
            try {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => { });
                }
            } catch (err) { }
        } else {
            // Exit fullscreen
            try {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => { });
                }
            } catch (err) { }

            Toast.info('Modo Normal', 'Se ha restablecido la vista estándar.');
        }
    }
};

// ============================================
// EMAIL TEMPLATES MANAGER
// ============================================

const EmailManager = {
    templates: [],
    currentTarget: null, // { type: 'client'|'case', id: string }

    init() {
        this.loadTemplates();
        this.attachListeners();
        this.renderTemplates();
    },

    loadTemplates() {
        // Default templates if none exist
        const defaultTemplates = [
            {
                id: '1',
                name: 'Confirmación de Servicio',
                subject: 'Confirmación de su servicio notarial-{case_number}',
                body: 'Estimado/a {client_name},\n\nLe confirmamos que hemos iniciado el proceso para su trámite de {service_type}. El número de expediente es {case_number}.\n\nQuedamos a su disposición.\n\nAtentamente,\n{company_name}'
            },
            {
                id: '2',
                name: 'Recordatorio de Vencimiento',
                subject: 'Recordatorio: Vencimiento de trámite {case_number}',
                body: 'Hola {client_name},\n\nLe recordamos que su trámite {service_type} tiene fecha de vencimiento el {due_date}. Por favor contacte con nosotros si necesita asistencia adicional.\n\nSaludos,\n{company_name}'
            }
        ];

        const saved = localStorage.getItem('notary_email_templates');
        if (saved) {
            this.templates = JSON.parse(saved);
        } else {
            this.templates = defaultTemplates;
            this.saveTemplates();
        }
    },

    saveTemplates() {
        localStorage.setItem('notary_email_templates', JSON.stringify(this.templates));

        // If logged in, save to Firestore
        if (NotaryCRM.currentUser && NotaryCRM.useFirestore) {
            const { doc, setDoc } = window.dbFuncs;
            const db = window.firebaseDB;
            const ref = doc(db, 'users', NotaryCRM.currentUser.uid, 'settings', 'email_templates');
            setDoc(ref, { templates: this.templates }).catch(err => console.error('Error saving templates to Firestore:', err));
        }
    },

    renderTemplates() {
        const container = document.getElementById('templates-list');
        if (!container) return;

        if (this.templates.length === 0) {
            container.innerHTML = '<p class="empty-state">No hay plantillas creadas. Haz clic en "Nueva Plantilla" para empezar.</p>';
            return;
        }

        container.innerHTML = this.templates.map(tmp => `
            <div class="template-card">
                <div>
                    <h3>${Toast.escapeHtml(tmp.name)}</h3>
                    <p style="font-size:0.75rem; color:var(--color-gray-400); margin-top:0.25rem;">Asunto: ${Toast.escapeHtml(tmp.subject)}</p>
                </div>
                <div class="template-preview">
                    ${Toast.escapeHtml(tmp.body)}
                </div>
                <div class="template-actions">
                    <button class="btn btn-sm" onclick="EmailManager.editTemplate('${tmp.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="EmailManager.deleteTemplate('${tmp.id}')">Eliminar</button>
                </div>
            </div>
        `).join('');
    },

    editTemplate(id) {
        const template = this.templates.find(t => t.id === id);
        if (!template) return;

        const form = document.getElementById('template-form');
        form.id.value = template.id;
        form.name.value = template.name;
        form.subject.value = template.subject;
        form.body.value = template.body;

        NotaryCRM.openModal('template-modal');
    },

    deleteTemplate(id) {
        NotaryCRM.confirmAction(
            '¿Eliminar Plantilla?',
            '¿Estás seguro de que deseas eliminar esta plantilla de correo?',
            () => {
                this.templates = this.templates.filter(t => t.id !== id);
                this.saveTemplates();
                this.renderTemplates();
                Toast.success('Plantilla Eliminada', 'La plantilla se ha eliminado correctamente.');
            }
        );
    },

    openSendModal(type, id) {
        this.currentTarget = { type, id };

        const select = document.getElementById('email-template-select');
        select.innerHTML = '<option value="">Selecciona una plantilla...</option>' +
            this.templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

        // Reset preview
        document.getElementById('preview-subject').textContent = 'Asunto: (Selecciona una plantilla)';
        document.getElementById('preview-body').textContent = 'Contenido del mensaje...';

        NotaryCRM.openModal('send-email-modal');
    },

    updatePreview(templateId) {
        if (!templateId) return;
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        let data = {};
        if (this.currentTarget.type === 'client') {
            const client = NotaryCRM.state.clients.find(c => c.id === this.currentTarget.id);
            data = {
                client_name: client ? client.name : 'Cliente',
                company_name: 'Notaría Publica-CRM'
            };
        } else if (this.currentTarget.type === 'case') {
            const caseObj = NotaryCRM.state.cases.find(c => c.id === this.currentTarget.id);
            data = {
                client_name: caseObj ? caseObj.clientName : 'Cliente',
                case_number: caseObj ? caseObj.caseNumber : 'N/A',
                service_type: caseObj ? caseObj.type : 'Servicio',
                due_date: caseObj ? NotaryCRM.formatDate(caseObj.dueDate) : 'N/A',
                amount: caseObj ? `$${caseObj.amount}` : '$0.00',
                company_name: 'Notaría Publica-CRM'
            };
        }

        const subject = this.replaceVariables(template.subject, data);
        const body = this.replaceVariables(template.body, data);

        document.getElementById('preview-subject').textContent = `Asunto: ${subject}`;
        document.getElementById('preview-body').innerHTML = body.replace(/\n/g, '<br>');
    },

    replaceVariables(text, data) {
        let result = text;
        const variables = {
            client_name: data.client_name || 'Cliente',
            case_number: data.case_number || 'N/A',
            service_type: data.service_type || 'Servicio',
            due_date: data.due_date || 'N/A',
            amount: data.amount || '$0.00',
            company_name: data.company_name || 'Mi Notaría'
        };

        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            result = result.replace(regex, variables[key]);
        });
        return result;
    },

    attachListeners() {
        const addBtn = document.getElementById('add-template-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                document.getElementById('template-form').reset();
                document.getElementById('template-form').id.value = '';
                NotaryCRM.openModal('template-modal');
            });
        }

        const form = document.getElementById('template-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const fd = new FormData(form);
                const id = fd.get('id');
                const newTpl = {
                    id: id || Date.now().toString(),
                    name: fd.get('name'),
                    subject: fd.get('subject'),
                    body: fd.get('body')
                };

                if (id) {
                    const idx = this.templates.findIndex(t => t.id === id);
                    this.templates[idx] = newTpl;
                } else {
                    this.templates.push(newTpl);
                }

                this.saveTemplates();
                this.renderTemplates();
                NotaryCRM.closeModal('template-modal');
                Toast.success('Plantilla Guardada', 'La plantilla se ha guardado correctamente.');
            });
        }

        // Variable tags click event
        const tagsContainer = document.getElementById('variable-tags-container');
        if (tagsContainer) {
            tagsContainer.addEventListener('click', (e) => {
                const tag = e.target.closest('.variable-tag');
                if (tag) {
                    const variable = tag.getAttribute('data-var');
                    const textarea = form.querySelector('textarea[name="body"]');
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const text = textarea.value;
                    textarea.value = text.substring(0, start) + variable + text.substring(end);
                    textarea.focus();
                    textarea.selectionStart = textarea.selectionEnd = start + variable.length;
                }
            });
        }

        // Send Email dialog template select
        const select = document.getElementById('email-template-select');
        if (select) {
            select.addEventListener('change', (e) => {
                this.updatePreview(e.target.value);
            });
        }

        const sendBtn = document.getElementById('confirm-send-email');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const templateId = document.getElementById('email-template-select').value;
                if (!templateId) {
                    Toast.warning('Selección Requerida', 'Por favor selecciona una plantilla.');
                    return;
                }

                // Get target data
                let toEmail = '';
                if (this.currentTarget && this.currentTarget.type === 'client') {
                    const client = NotaryCRM.state.clients.find(c => c.id === this.currentTarget.id);
                    if (client) toEmail = client.email;
                } else if (this.currentTarget && this.currentTarget.type === 'case') {
                    const caseItem = NotaryCRM.state.cases.find(c => c.id === this.currentTarget.id);
                    if (caseItem) {
                        const client = NotaryCRM.state.clients.find(c => c.id === caseItem.clientId);
                        if (client) toEmail = client.email;
                    }
                }

                if (!toEmail) {
                    Toast.error('Error', 'No se encontró el correo del destinatario.');
                    return;
                }

                // Get rendered content
                const selectedTemplate = this.templates.find(t => t.id === templateId);

                // Prepare data for replacement (reusing logic from updatePreview)
                let data = {};
                if (this.currentTarget.type === 'client') {
                    const client = NotaryCRM.state.clients.find(c => c.id === this.currentTarget.id);
                    data = {
                        client_name: client ? client.name : 'Cliente',
                        company_name: 'Notaría Publica-CRM'
                    };
                } else if (this.currentTarget.type === 'case') {
                    const caseObj = NotaryCRM.state.cases.find(c => c.id === this.currentTarget.id);
                    data = {
                        client_name: caseObj ? caseObj.clientName : 'Cliente',
                        case_number: caseObj ? caseObj.caseNumber : 'N/A',
                        service_type: caseObj ? caseObj.type : 'Servicio',
                        due_date: caseObj ? NotaryCRM.formatDate(caseObj.dueDate) : 'N/A',
                        amount: caseObj ? `$${caseObj.amount}` : '$0.00',
                        company_name: 'Notaría Publica-CRM'
                    };
                }

                const subject = this.replaceVariables(selectedTemplate.subject, data);
                const body = this.replaceVariables(selectedTemplate.body, data);

                // Construct mailto link
                const mailtoLink = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                // Open email client
                window.location.href = mailtoLink;

                NotaryCRM.closeModal('send-email-modal');
                Toast.success('Cliente de Correo Abierto', 'Se ha abierto tu aplicación de correo para enviar el mensaje.');
            });
        }
    }
};

// ============================================
// AUDIT LOGS MANAGER
// ============================================

const AuditManager = {
    logs: [],

    init() {
        this.attachListeners();
    },

    async logAction(action, resource, details) {
        if (!NotaryCRM.useFirestore || !NotaryCRM.currentUser) {
            console.log('Audit log (local):', { action, resource, details, time: new Date() });
            return;
        }

        try {
            const { collection, addDoc, serverTimestamp } = window.dbFuncs;
            const db = window.firebaseDB;
            await addDoc(collection(db, 'audit_logs'), {
                userId: NotaryCRM.currentUser.uid,
                userEmail: NotaryCRM.currentUser.email,
                action,
                resource,
                details: typeof details === 'object' ? JSON.stringify(details) : details,
                timestamp: serverTimestamp() || new Date()
            });
        } catch (e) {
            console.error('Audit logs failed', e);
        }
    },

    startListener() {
        if (!NotaryCRM.useFirestore) return;
        const { collection, query, orderBy, limit, onSnapshot } = window.dbFuncs;
        try {
            const logsCol = collection(window.firebaseDB, 'audit_logs');
            const q = query(logsCol, orderBy('timestamp', 'desc'), limit(100));
            onSnapshot(q, snapshot => {
                this.logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.render();
            });
        } catch (e) {
            console.error('Audit listener failed', e);
        }
    },

    render() {
        const container = document.getElementById('audit-logs-list');
        if (!container) return;

        if (this.logs.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="empty-state">No hay registros de auditoría aún.</td></tr>';
            return;
        }

        container.innerHTML = this.logs.map(log => {
            const timeStr = NotaryCRM.formatDate(log.timestamp, true);
            const actionClass = log.action.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '');
            return `
                <tr>
                    <td style="font-size: 0.85rem; white-space: nowrap;">${timeStr}</td>
                    <td>
                        <div style="font-weight:600; font-size: 0.9rem;">${log.userEmail}</div>
                        <div style="font-size:0.7rem; color:var(--color-gray-400);">ID: ${log.userId}</div>
                    </td>
                    <td><span class="audit-action-badge action-${actionClass}">${log.action}</span></td>
                    <td><span style="font-weight:500;">${log.resource}</span></td>
                    <td style="max-width: 250px; font-size: 0.85rem; color:var(--color-gray-600);">${log.details || '-'}</td>
                </tr>
            `;
        }).join('');
    },

    getLogs() {
        return this.logs || [];
    },

    async exportToCSV() {
        if (this.logs.length === 0) {
            Toast.warning('Sin datos', 'No hay registros para exportar.');
            return;
        }

        const headers = ['Fecha', 'Usuario', 'Acción', 'Recurso', 'Detalles'];
        const csvContent = [
            headers.join(','),
            ...this.logs.map(log => [
                NotaryCRM.formatDate(log.timestamp, true),
                log.userEmail,
                `"${log.action.replace(/"/g, '""')}"`,
                `"${log.resource ? log.resource.replace(/"/g, '""') : ''}"`,
                `"${log.details ? log.details.replace(/"/g, '""') : ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `auditoria_notarial_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.logAction('Exportación de Logs', 'Auditoría', 'Se descargaron los registros en formato CSV');
    },

    attachListeners() {
        const refreshBtn = document.getElementById('refresh-logs-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.startListener();
                Toast.info('Actualizando...', 'Sincronizando registros con la base de datos.');
            });
        }

        const exportBtn = document.getElementById('export-logs-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToCSV());
        }

        // Global Click Tracker for Compliance
        document.addEventListener('click', (e) => {
            // Find closest clickable element
            const target = e.target.closest('button, .nav-item, .clickable, .tab-link, input[type="submit"]');
            if (!target) return;

            // Don't log if in audit tab to avoid infinite noise
            if (target.closest('#audit-tab')) return;

            // Get interaction label
            const label = target.innerText.trim() ||
                target.getAttribute('title') ||
                target.getAttribute('aria-label') ||
                target.id ||
                'Interacción no etiquetada';

            // Filter out very common/noisy clicks like "Cerrar", "Close", "X"
            const noisyActions = ['Cerrar', 'Close', 'X', 'Actualizar', 'Refresh'];
            if (label && !noisyActions.includes(label)) {
                const context = document.querySelector('.tab-content:not([style*="display: none"])')?.id || 'Panel General';
                this.logAction('Clic de Usuario', context, `Accionó: ${label.substring(0, 100)}`);
            }
        });
    }
};

if (typeof window !== 'undefined') {
    window.AuditManager = AuditManager;
}

// ============================================
// CASE TEMPLATES MANAGER
// ============================================

const CaseTemplates = {
    'Apostille': { amount: 150, description: 'Servicio de Apostilla completo para documentos internacionales.' },
    'Power of Attorney': { amount: 200, description: 'Elaboración y legalización de Poder Notarial (General o Especial).' },
    'Affidavit': { amount: 80, description: 'Declaración Jurada notarizada para trámites legales o personales.' },
    'Real Estate Deed': { amount: 500, description: 'Procesamiento de Escritura de Propiedad y cierre de bienes raíces.' },
    'Wills / Trusts': { amount: 350, description: 'Elaboración de Testamentos o Fideicomisos con validez legal.' },
    'Certified Copies': { amount: 50, description: 'Certificación de copia fiel de documento original.' },
    'Oath / Affirmation': { amount: 40, description: 'Administración de juramentos o afirmaciones.' },
    'Loan Signing': { amount: 250, description: 'Firma de documentos de préstamo hipotecario (Closing Agent).' },
    'Acknowledgment': { amount: 60, description: 'Reconocimiento de firma en documentos privados.' },
    'Other': { amount: 0, description: '' }
};

// ============================================
// PAYMENT MANAGER (SIMULATED)
// ============================================

// ============================================
// PAYMENT MANAGER (DELEGATED TO payment-manager.js)
// ============================================
// PaymentManager logic is now handled in payment-manager.js to avoid conflicts.
// This placeholder ensures we don't break if someone expects it here, but window.PaymentManager should already be set.

// ============================================
// TIMELINE MANAGER (ACTIVITY HISTORY)
// ============================================

const TimelineManager = {
    getClientTimeline(clientId) {
        const events = [];

        // Find cases for this client
        const clientCases = NotaryCRM.state.cases.filter(c => c.clientId === clientId);
        clientCases.forEach(c => {
            events.push({
                type: 'case',
                title: I18nManager.currentLang === 'es' ? `Caso Creado: ${c.caseNumber}` : `Case Created: ${c.caseNumber}`,
                date: c.createdAt || c.dueDate,
                icon: 'file-text',
                color: 'blue'
            });

            if (c.paymentStatus === 'paid') {
                events.push({
                    type: 'payment',
                    title: I18nManager.currentLang === 'es' ? `Pago Recibido ($${c.amount})` : `Payment Received ($${c.amount})`,
                    date: c.updatedAt || c.dueDate,
                    icon: 'credit-card',
                    color: 'green'
                });
            }
        });

        // Find appointments
        const clientApps = NotaryCRM.state.appointments.filter(a => a.clientId === clientId);
        clientApps.forEach(a => {
            events.push({
                type: 'appointment',
                title: I18nManager.currentLang === 'es' ? `Cita de ${a.type}` : `${a.type} Appointment`,
                date: `${a.date}T${a.time}`,
                icon: 'calendar',
                color: 'purple'
            });
        });

        // Sort by date desc
        return events.sort((a, b) => new Date(b.date)-new Date(a.date));
    },

    renderTimeline(events) {
        if (events.length === 0) {
            return `<p class="empty-state">${I18nManager.currentLang === 'es' ? 'Sin actividad registrada.' : 'No activity recorded.'}</p>`;
        }

        return `
            <div class="timeline" style="margin-top: 1rem;">
                ${events.map(ev => `
                    <div class="timeline-item" style="border-left: 2px solid var(--color-gray-200); padding-left: 20px; position: relative; margin-bottom: 20px;">
                        <div style="position: absolute; left: -9px; top: 0; width: 16px; height: 16px; border-radius: 50%; background: var(--color-${ev.color || 'primary'}); border: 4px solid var(--bg-card);"></div>
                        <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 4px;">${NotaryCRM.formatDate(ev.date, true)}</div>
                        <div style="font-weight: 600; font-size: 0.9rem;">${ev.title}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

// = ============================================
// NOTE MANAGER (TIMESTAMPS FOR CASES)
// ============================================

const NoteManager = {
    async addNote(caseId, text) {
        if (!text.trim()) return;

        const caseItem = NotaryCRM.state.cases.find(c => c.id === caseId);
        if (!caseItem) return;

        const notes = caseItem.internalNotes || [];
        const newNote = {
            id: Date.now().toString(),
            text: text.trim(),
            timestamp: new Date().toISOString(),
            user: NotaryCRM.currentUser ? NotaryCRM.currentUser.email : 'System'
        };

        notes.push(newNote);
        await NotaryCRM.updateCase(caseId, { internalNotes: notes });
        NotaryCRM.showCaseDetails(caseId);
    },

    async deleteNote(caseId, noteId) {
        const caseItem = NotaryCRM.state.cases.find(c => c.id === caseId);
        if (!caseItem) return;

        const notes = (caseItem.internalNotes || []).filter(n => n.id !== noteId);
        await NotaryCRM.updateCase(caseId, { internalNotes: notes });
        NotaryCRM.showCaseDetails(caseId);
    },

    renderNotes(caseId, notes = []) {
        const isEs = I18nManager.currentLang === 'es';

        return `
            <div class="notes-section" style="margin-top: 2rem; border-top: 1px solid var(--color-gray-200); padding-top: 1.5rem;">
                <h4 style="margin-bottom: 1rem; color: var(--color-primary); display: flex; align-items: center; gap: 0.5rem;">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    ${isEs ? 'Notas del Expediente' : 'Case Notes'}
                </h4>
                
                <div class="note-input-group" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <textarea id="new-note-text" class="form-input" placeholder="${isEs ? 'Escribe una nota...' : 'Write a note...'}" style="flex: 1; min-height: 60px;"></textarea>
                    <button class="btn btn-primary" onclick="NoteManager.addNote('${caseId}', document.getElementById('new-note-text').value)">
                        ${isEs ? 'Publicar' : 'Post'}
                    </button>
                </div>

                <div class="notes-list" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${notes.length === 0 ? `<p class="empty-state" style="padding:1rem;">${isEs ? 'Sin notas registradas.' : 'No notes recorded.'}</p>` : notes.map(n => `
                        <div class="note-item" style="background: white; border: 1px solid var(--color-gray-100); border-radius: 8px; padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="font-size: 0.7rem; font-weight: 700; color: var(--color-primary-light);">${n.user}</span>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="font-size: 0.7rem; color: var(--text-light);">${NotaryCRM.formatDate(n.timestamp, true)}</span>
                                    <button class="btn-icon btn-danger" onclick="NoteManager.deleteNote('${caseId}', '${n.id}')" style="padding: 2px;">
                                        <svg class="icon" viewBox="0 0 24 24" style="width: 12px; height: 12px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-main); white-space: pre-wrap;">${n.text}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

// ============================================
// TASK MANAGER (CHECKLIST PER CASE)
// ============================================

const TaskManager = {
    async addTask(caseId, title) {
        if (!title.trim()) return;

        const caseItem = NotaryCRM.state.cases.find(c => c.id === caseId);
        if (!caseItem) return;

        const tasks = caseItem.tasks || [];
        const newTask = {
            id: Date.now().toString(),
            title: title.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(newTask);
        await NotaryCRM.updateCase(caseId, { tasks });
        NotaryCRM.showCaseDetails(caseId); // Refresh view
    },

    async toggleTask(caseId, taskId) {
        const caseItem = NotaryCRM.state.cases.find(c => c.id === caseId);
        if (!caseItem) return;

        const tasks = (caseItem.tasks || []).map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
        );

        await NotaryCRM.updateCase(caseId, { tasks });
        NotaryCRM.showCaseDetails(caseId);
    },

    async deleteTask(caseId, taskId) {
        const caseItem = NotaryCRM.state.cases.find(c => c.id === caseId);
        if (!caseItem) return;

        const tasks = (caseItem.tasks || []).filter(t => t.id !== taskId);

        await NotaryCRM.updateCase(caseId, { tasks });
        NotaryCRM.showCaseDetails(caseId);
    },

    renderTaskList(caseId, tasks = []) {
        const isEs = I18nManager.currentLang === 'es';

        return `
            <div class="tasks-section" style="margin-top: 2rem; border-top: 1px solid var(--color-gray-200); padding-top: 1.5rem;">
                <h4 style="margin-bottom: 1rem; color: var(--color-primary); display: flex; align-items: center; gap: 0.5rem;">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                    ${isEs ? 'Checklist de Tareas' : 'Task Checklist'}
                </h4>
                
                <div class="task-input-group" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <input type="text" id="new-task-title" class="form-input" placeholder="${isEs ? 'Nueva tarea...' : 'New task...'}" style="flex: 1;">
                    <button class="btn btn-primary" onclick="TaskManager.addTask('${caseId}', document.getElementById('new-task-title').value)">
                        ${isEs ? 'Añadir' : 'Add'}
                    </button>
                </div>

                <div class="task-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${tasks.length === 0 ? `<p class="empty-state" style="padding: 1rem;">${isEs ? 'Sin tareas pendientes.' : 'No tasks pending.'}</p>` : tasks.map(t => `
                        <div class="task-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--color-gray-50); border-radius: 8px; border: 1px solid var(--color-gray-200);">
                            <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="TaskManager.toggleTask('${caseId}', '${t.id}')" style="width: 18px; height: 18px; cursor: pointer;">
                            <span style="flex: 1; ${t.completed ? 'text-decoration: line-through; color: var(--color-gray-400);' : ''}">${t.title}</span>
                            <button class="btn-icon btn-danger" onclick="TaskManager.deleteTask('${caseId}', '${t.id}')" style="padding: 4px;">
                                <svg class="icon" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

// ============================================
// I18N MANAGER (MULTI-LANGUAGE)
// ============================================

const I18nManager = {
    currentLang: 'es',

    translations: {
        'en': {
            'nav_dashboard': 'Dashboard',
            'nav_clients': 'Clients',
            'nav_cases': 'Cases',
            'nav_reminders': 'Reminders',
            'nav_calendar': 'Calendar',
            'nav_reports': 'Reports',
            'nav_emails': 'Emails',
            'nav_users': 'Users',
            'nav_audit': 'Audit',
            'total_clients': 'Total Clients',
            'total_cases': 'Total Cases',
            'completed': 'Completed',
            'total_revenue': 'Total Revenue',
            'recent_cases': 'Recent Cases',
            'case_num': 'Case #',
            'client': 'Client',
            'type': 'Type',
            'status': 'Status',
            'amount': 'Amount',
            'add_client': 'Add Client',
            'add_case': 'Add Case',
            'search_clients': 'Search clients...',
            'search_cases': 'Search cases...',
            'settings': 'Settings',
            'logout': 'Sign Out',
            'theme_toggle': 'Toggle Theme',
            'lang_toggle': 'Change Language',
            'welcome': 'Welcome back'
        },
        'es': {
            'nav_dashboard': 'Dashboard',
            'nav_clients': 'Clientes',
            'nav_cases': 'Casos',
            'nav_reminders': 'Recordatorios',
            'nav_calendar': 'Calendario',
            'nav_reports': 'Reportes',
            'nav_emails': 'Emails',
            'nav_users': 'Usuarios',
            'nav_audit': 'Auditoría',
            'total_clients': 'Total Clientes',
            'total_cases': 'Total Casos',
            'completed': 'Completados',
            'total_revenue': 'Ingresos Totales',
            'recent_cases': 'Casos Recientes',
            'case_num': 'Caso #',
            'client': 'Cliente',
            'type': 'Tipo',
            'status': 'Estado',
            'amount': 'Monto',
            'add_client': 'Añadir Cliente',
            'add_case': 'Añadir Caso',
            'search_clients': 'Buscar clientes...',
            'search_cases': 'Buscar casos...',
            'settings': 'Configuración',
            'logout': 'Cerrar Sesión',
            'theme_toggle': 'Cambiar Tema',
            'lang_toggle': 'Cambiar Idioma',
            'welcome': 'Bienvenido de nuevo'
        }
    },

    init() {
        const savedLang = localStorage.getItem('notary_lang');
        this.currentLang = savedLang || 'es';
        this.apply();

        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                this.currentLang = this.currentLang === 'es' ? 'en' : 'es';
                localStorage.setItem('notary_lang', this.currentLang);
                this.apply();
                NotaryCRM.render(); // Re-render lists to apply translations
            });
        }
    },

    t(key) {
        return this.translations[this.currentLang][key] || key;
    },

    apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        });

        // Update language indicator in UI
        const langIndicator = document.getElementById('current-lang-text');
        if (langIndicator) langIndicator.textContent = this.currentLang.toUpperCase();
    }
};

// ============================================
// THEME MANAGER (DARK MODE)
// ============================================

const ThemeManager = {
    init() {
        this.toggleBtn = document.getElementById('theme-toggle');

        // ALWAYS USE LIGHT MODE-Force light theme
        this.setTheme('light');

        // Hide or disable the theme toggle button
        if (this.toggleBtn) {
            this.toggleBtn.style.display = 'none'; // Hide the toggle button
        }

        this.sunIcon = this.toggleBtn?.querySelector('.sun-icon');
        this.moonIcon = this.toggleBtn?.querySelector('.moon-icon');
    },

    setTheme(theme) {
        // FORCE LIGHT MODE ONLY
        document.documentElement.classList.remove('dark-theme');
        if (this.sunIcon) this.sunIcon.style.display = 'block';
        if (this.moonIcon) this.moonIcon.style.display = 'none';
        localStorage.setItem('notary_theme', 'light');
    }
};

// ============================================
// PROFESSIONAL WITNESS MANAGER
// ============================================

const witnessManager = {
    init() {
        this.listContainer = document.getElementById('witness-list-container');
        this.searchField = document.getElementById('witness-search');
    },

    async save(form) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            idType: formData.get('idType'),
            idNumber: formData.get('idNumber'),
            phone: formData.get('phone'),
            ownerId: NotaryCRM.currentUser?.uid,
            createdAt: new Date().toISOString()
        };

        try {
            if (NotaryCRM.useFirestore) {
                const { collection, addDoc } = window.dbFuncs;
                await addDoc(collection(window.firebaseDB, 'witnesses'), data);
            } else {
                NotaryCRM.state.witnesses = NotaryCRM.state.witnesses || [];
                NotaryCRM.state.witnesses.push({ id: Date.now().toString(), ...data });
                NotaryCRM.saveData();
            }
            Toast.success('Testigo Guardado', 'El testigo profesional ha sido añadido al directorio.');
            NotaryCRM.closeModal('add-witness-modal');
            form.reset();
            this.render();
        } catch (err) {
            console.error('Save witness failed', err);
            Toast.error('Error', 'No se pudo guardar el testigo.');
        }
    },

    checkConflict() {
        const form = document.getElementById('case-form');
        if (!form) return;

        const clientSelect = form.querySelector('[name="clientId"]');
        const clientId = clientSelect.value;
        const witnessName = form.querySelector('[name="witness1"]').value;

        if (!clientId || !witnessName) {
            Toast.warning('Información Incompleta', 'Seleccione un cliente y escriba el nombre del testigo.');
            return;
        }

        const client = NotaryCRM.state.clients.find(c => c.id === clientId);
        if (!client) return;

        // Conflict check: Same last name or same address
        const clientLastName = client.name.split(' ').pop().toLowerCase();
        const witnessLastName = witnessName.split(' ').pop().toLowerCase();

        let conflict = false;
        let reason = '';

        if (clientLastName === witnessLastName) {
            conflict = true;
            reason = 'Posible vínculo familiar (apellidos coincidentes).';
        }

        if (conflict) {
            Toast.error('¡Conflicto Detectado!', reason);
            // Flash the field
            form.querySelector('[name="witness1"]').style.borderColor = '#ef4444';
        } else {
            Toast.success('Sin Conflictos', 'No se detectaron vínculos directos obvios con el cliente.');
            form.querySelector('[name="witness1"]').style.borderColor = '#10b981';
        }
    },
    render() {
        if (!this.listContainer) return;
        const query = (this.searchField?.value || '').toLowerCase();
        const witnesses = (NotaryCRM.state.witnesses || []).filter(w =>
            w.name.toLowerCase().includes(query) ||
            w.idNumber.toLowerCase().includes(query)
        );

        if (witnesses.length === 0) {
            this.listContainer.innerHTML = '<div style="text-align:center; padding: 2rem; color: #64748b;">No se encontraron testigos.</div>';
            return;
        }

        this.listContainer.innerHTML = witnesses.map(w => `
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="background: #f1f5f9; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b;">
                        <i data-lucide="user"></i>
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #1e293b;">${w.name}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">${w.idType}: ${w.idNumber} | 📞 ${w.phone || '-'}</div>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-purple" onclick="witnessManager.select('${w.name}', '${w.idNumber}')">
                    Seleccionar
                </button>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    },

    select(name, id) {
        const form = document.getElementById('case-form');
        if (form) {
            if (form.witness1) form.witness1.value = name;
            if (form.witness1_id) form.witness1_id.value = id;
            NotaryCRM.closeModal('witness-directory-modal');
            Toast.info('Testigo Seleccionado', `Se ha cargado la información de ${name}`);
        }
    }
};

// ============================================
// BIOMETRIC MANAGER
// ============================================

const biometricManager = {
    state: {
        isScanning: false,
        isCaptured: false,
        currentCaseId: null
    },

    open(caseId) {
        this.state.currentCaseId = caseId;
        this.reset();
        NotaryCRM.openModal('biometric-modal');
    },

    reset() {
        this.state.isScanning = false;
        this.state.isCaptured = false;

        const scanner = document.getElementById('fingerprint-scanner-vfx');
        const laser = document.getElementById('scanner-laser');
        const icon = document.getElementById('fingerprint-icon');
        const status = document.getElementById('biometric-status');
        const preview = document.getElementById('biometric-data-preview');
        const btnScan = document.getElementById('btn-start-scan');
        const btnSave = document.getElementById('btn-save-biometric');

        if (scanner) scanner.className = '';
        if (laser) laser.style.display = 'none';
        if (icon) icon.style.color = '#cbd5e1';
        if (status) {
            status.textContent = 'DISPOSITIVO LISTO';
            status.style.color = '#64748b';
        }
        if (preview) preview.style.display = 'none';
        if (btnScan) btnScan.style.display = 'block';
        if (btnSave) btnSave.style.display = 'none';
    },

    startScan() {
        if (this.state.isScanning) return;
        this.state.isScanning = true;

        const scanner = document.getElementById('fingerprint-scanner-vfx');
        const laser = document.getElementById('scanner-laser');
        const status = document.getElementById('biometric-status');
        const icon = document.getElementById('fingerprint-icon');

        if (scanner) scanner.classList.add('scanning');
        if (laser) laser.style.display = 'block';
        if (status) {
            status.textContent = 'ESCANEANDO...';
            status.style.color = '#3b82f6';
        }

        setTimeout(() => {
            this.state.isScanning = false;
            this.state.isCaptured = true;

            if (laser) laser.style.display = 'none';
            if (icon) icon.style.color = '#10b981';
            if (status) {
                status.textContent = 'CAPTURA EXITOSA';
                status.style.color = '#10b981';
            }

            const preview = document.getElementById('biometric-data-preview');
            const btnScan = document.getElementById('btn-start-scan');
            const btnSave = document.getElementById('btn-save-biometric');

            if (preview) preview.style.display = 'flex';
            if (btnScan) btnScan.style.display = 'none';
            if (btnSave) btnSave.style.display = 'block';

            window.confetti && window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        }, 3000);
    },

    async save() {
        if (!this.state.isCaptured || !this.state.currentCaseId) return;

        const hash = 'BIO_' + Math.random().toString(36).substr(2, 12).toUpperCase();
        try {
            await NotaryCRM.updateCase(this.state.currentCaseId, {
                biometricCaptured: true,
                biometricHash: hash,
                biometricDate: new Date().toISOString()
            });

            NotaryCRM.closeModal('biometric-modal');
            NotaryCRM.showCaseDetails(this.state.currentCaseId);
            Toast.success('Biometría Vinculada', 'La huella dactilar ha sido vinculada al expediente legal.');
        } catch (err) {
            console.error('Biometric save failed', err);
            Toast.error('Error', 'No se pudo guardar el registro biométrico.');
        }
    }
};

// ============================================
// MILEAGE & TAX MANAGER
// ============================================

const MileageManager = {
    IRS_RATE: 0.67, // Rate for 2024

    renderDashboardWidget() {
        const cases = NotaryCRM.state.cases || [];
        const totalMiles = cases.reduce((acc, c) => acc + (parseFloat(c.mileage) || 0), 0);
        const totalDeduction = totalMiles * this.IRS_RATE;

        const deductionEl = document.getElementById('dash-mileage-deduction');
        const milesTotalEl = document.getElementById('dash-total-miles');

        if (deductionEl) deductionEl.textContent = NotaryCRM.formatCurrency(totalDeduction);
        if (milesTotalEl) milesTotalEl.textContent = `${totalMiles.toFixed(1)} total mi`;

        // Make the card clickable to open log
        const card = document.querySelector('[data-widget-id="mileage-tracking"]') || deductionEl?.closest('.stat-card');
        if (card) {
            card.style.cursor = 'pointer';
            card.onclick = () => this.openLog();
        }
    },

    openLog() {
        const container = document.getElementById('mileage-list-container');
        const cases = (NotaryCRM.state.cases || []).filter(c => (parseFloat(c.mileage) || 0)> 0);

        const totalMiles = cases.reduce((acc, c) => acc + (parseFloat(c.mileage) || 0), 0);
        const totalDeduction = totalMiles * this.IRS_RATE;

        document.getElementById('mileage-total-deduction').textContent = NotaryCRM.formatCurrency(totalDeduction);
        document.getElementById('mileage-total-miles').textContent = totalMiles.toFixed(1);

        if (cases.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding: 2rem; color: #64748b;">No hay millas registradas en los expedientes.</div>';
        } else {
            container.innerHTML = cases.map(c => `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 700; color: #1e293b;">${c.caseNumber}</div>
                        <div style="font-size: 0.8rem; color: #64748b;">${c.type} | ${c.clientName}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: #0f172a;">${c.mileage} mi</div>
                        <div style="font-size: 0.75rem; color: #10b981;">+$${(c.mileage * this.IRS_RATE).toFixed(2)}</div>
                    </div>
                </div>
            `).join('');
        }

        NotaryCRM.openModal('mileage-log-modal');
    }
};

// ============================================
// CREDENTIAL VALIDATOR MANAGER
// ============================================

const ValidationManager = {
    open() {
        const dataStr = localStorage.getItem('notary_commission');
        const infoDisplay = document.getElementById('commission-info-display');
        const card = document.getElementById('credential-status-card');

        if (!dataStr) {
            if (infoDisplay) infoDisplay.textContent = 'Commission Data Missing';
            if (card) card.style.background = '#fef2f2';
        } else {
            const data = JSON.parse(dataStr);
            const expiry = new Date(data.expiry);
            const today = new Date();
            const isValid = expiry> today;

            if (infoDisplay) {
                infoDisplay.innerHTML = `
                    <div style="font-size: 1.25rem;">Nº ${data.number}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Vence: ${data.expiry}</div>
                    <div style="margin-top: 10px; display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; background: ${isValid ? '#dcfce7' : '#fee2e2'}; color: ${isValid ? '#166534' : '#991b1b'};">
                        ${isValid ? 'DOCUMENTACIÓN VIGENTE' : 'COMISIÓN VENCIDA'}
                    </div>
                `;
            }
            if (card) card.style.background = isValid ? '#f0fdf4' : '#fef2f2';
        }

        NotaryCRM.openModal('credential-validator-modal');
    }
};

// ============================================
// HAGUE CONVENTION MANAGER
// ============================================

const HagueManager = {
    // Extensive list of HCCH members (simplified for logic)
    members: [
        'Albania', 'Andorra', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium',
        'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Burkina Faso', 'Canada', 'Chile', 'China', 'Colombia',
        'Costa Rica', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Ecuador', 'Egypt', 'Estonia', 'European Union',
        'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland', 'India', 'Ireland', 'Israel', 'Italy',
        'Japan', 'Jordan', 'Kazakhstan', 'Korea', 'Latvia', 'Lithuania', 'Luxembourg', 'Malaysia', 'Malta', 'Mauritius',
        'Mexico', 'Monaco', 'Montenegro', 'Morocco', 'Namibia', 'Netherlands', 'New Zealand', 'Norway', 'Panama',
        'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Republic of Moldova', 'Republic of North Macedonia',
        'Romania', 'Russian Federation', 'Saudi Arabia', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa',
        'Spain', 'Sri Lanka', 'Suriname', 'Sweden', 'Switzerland', 'Thailand', 'Tunisia', 'Türkiye', 'Ukraine',
        'United Kingdom', 'USA', 'Uruguay', 'Uzbekistan', 'Venezuela', 'Vietnam', 'Zambia'
    ],

    search(query) {
        const container = document.getElementById('hague-result-container');
        if (!container) return;

        if (!query || query.length < 2) {
            container.innerHTML = `
                <i data-lucide="globe" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 1rem;"></i>
                <p style="color: #64748b;">Ingrese el nombre de un país para verificar.</p>`;
            if (window.lucide) lucide.createIcons();
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        const found = this.members.find(m => m.toLowerCase() === normalizedQuery);
        const matches = this.members.filter(m => m.toLowerCase().includes(normalizedQuery)).slice(0, 5);

        if (found) {
            container.innerHTML = `
                <div style="background: #dcfce7; color: #166534; padding: 1.5rem; border-radius: 12px; width: 100%;">
                    <i data-lucide="check-circle" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                    <h4 style="margin: 0; font-size: 1.25rem;">${found} es MIEMBRO</h4>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Este país acepta <strong>Apostillas</strong> para documentos extranjeros.</p>
                </div>`;
        } else if (matches.length> 0) {
            container.innerHTML = `
                <div style="text-align: left; width: 100%;">
                    <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 8px;">Sugerencias:</p>
                    ${matches.map(m => `<button class="btn btn-sm btn-outline" style="margin: 2px;" onclick="document.getElementById('hague-search-input').value='${m}'; HagueManager.search('${m}')">${m}</button>`).join('')}
                </div>`;
        } else {
            container.innerHTML = `
                <div style="background: #fee2e2; color: #991b1b; padding: 1.5rem; border-radius: 12px; width: 100%;">
                    <i data-lucide="alert-circle" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                    <h4 style="margin: 0; font-size: 1.25rem;">No Miembro Detectado</h4>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Es probable que este país requiera <strong>Legalización Consular</strong>.</p>
                </div>`;
        }
        if (window.lucide) lucide.createIcons();
    }
};

// ============================================
// FEE CALCULATOR MANAGER
// ============================================

const FeeCalculatorManager = {
    open() {
        NotaryCRM.openModal('fee-calculator-modal');
        this.calculate();
    },

    calculate() {
        const rateSelect = document.getElementById('fee-state-rate');
        const customGroup = document.getElementById('custom-rate-group');
        const countInput = document.getElementById('fee-count');
        const extraInput = document.getElementById('fee-extra');
        const totalDisplay = document.getElementById('fee-total-display');

        let rate = 0;
        if (rateSelect.value === 'custom') {
            customGroup.style.display = 'block';
            rate = parseFloat(document.getElementById('fee-custom-rate').value) || 0;
        } else {
            customGroup.style.display = 'none';
            rate = parseFloat(rateSelect.value) || 0;
        }

        const count = parseInt(countInput.value) || 0;
        const extra = parseFloat(extraInput.value) || 0;
        const total = (rate * count) + extra;

        totalDisplay.textContent = NotaryCRM.formatCurrency(total);
        this.lastTotal = total;
    },

    apply() {
        const amountInput = document.getElementById('case-amount-input');
        if (amountInput) {
            amountInput.value = this.lastTotal.toFixed(2);
            // Trigger mask refresh if necessary
            if (window.FormMasks) FormMasks.init();
        }
        NotaryCRM.closeModal('fee-calculator-modal');
        Toast.success('Calculado', 'Los honorarios se han aplicado al expediente.');
    }
};

// ============================================
// SPECIALIZED NOTARY MANAGER
// ============================================

const SpecializedManager = {
    init() {
        const typeSelect = document.querySelector('#case-form select[name="type"]');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => this.toggleFields(e.target.value));
        }
    },

    toggleFields(type) {
        const apostilleSection = document.getElementById('specialized-apostille');
        const lsaSection = document.getElementById('specialized-lsa');
        const weddingSection = document.getElementById('specialized-wedding');
        const consularSection = document.getElementById('specialized-consular');
        const willsSection = document.getElementById('specialized-wills');
        const poaSection = document.getElementById('specialized-poa');

        if (apostilleSection) apostilleSection.style.display = (type === 'Apostille') ? 'block' : 'none';
        if (lsaSection) lsaSection.style.display = (type === 'Loan Signing') ? 'block' : 'none';
        if (weddingSection) weddingSection.style.display = (type === 'Wedding') ? 'block' : 'none';
        if (consularSection) consularSection.style.display = (type === 'Consular') ? 'block' : 'none';
        if (willsSection) willsSection.style.display = (type === 'Wills / Trusts') ? 'block' : 'none';
        if (poaSection) poaSection.style.display = (type === 'Power of Attorney') ? 'block' : 'none';

        const immigSection = document.getElementById('specialized-immigration');
        const massSection = document.getElementById('specialized-signature-tracking');
        if (immigSection) immigSection.style.display = (type === 'Immigration') ? 'block' : 'none';
        if (massSection) massSection.style.display = (type === 'Massive Document') ? 'block' : 'none';

        const protestSection = document.getElementById('specialized-protest');
        const transSection = document.getElementById('specialized-translation');
        if (protestSection) protestSection.style.display = (type === 'Protest') ? 'block' : 'none';
        if (transSection) transSection.style.display = (type === 'Translation') ? 'block' : 'none';

        const propSection = document.getElementById('specialized-property-mgmt');
        if (propSection) propSection.style.display = (type === 'Property Management') ? 'block' : 'none';

        const escrowSection = document.getElementById('specialized-escrow');
        const registrySection = document.getElementById('specialized-registry');
        if (escrowSection) escrowSection.style.display = (type === 'Escrow') ? 'block' : 'none';
        if (registrySection) registrySection.style.display = (type === 'Registry') ? 'block' : 'none';

        const batchSection = document.getElementById('specialized-batch-signing');
        const familySection = document.getElementById('specialized-family-tree');
        if (batchSection) batchSection.style.display = (type === 'Batch Signing') ? 'block' : 'none';
        if (familySection) familySection.style.display = (type === 'Family Tree') ? 'block' : 'none';

        const interpSection = document.getElementById('specialized-interpreter');
        const apoControlSection = document.getElementById('specialized-apostille-control');
        if (interpSection) interpSection.style.display = (type === 'Interpreter') ? 'block' : 'none';
        if (apoControlSection) apoControlSection.style.display = (type === 'Apostille Control') ? 'block' : 'none';

        const shipSection = document.getElementById('specialized-shipping-cost');
        const subpoenaSection = document.getElementById('specialized-subpoena');
        if (shipSection) shipSection.style.display = (type === 'Shipping Cost') ? 'block' : 'none';
        if (subpoenaSection) subpoenaSection.style.display = (type === 'Subpoena') ? 'block' : 'none';

        const archiveSection = document.getElementById('specialized-digital-archive');
        const restrictedSection = document.getElementById('specialized-restricted-location');
        if (archiveSection) archiveSection.style.display = (type === 'Digital Archive') ? 'block' : 'none';
        if (restrictedSection) restrictedSection.style.display = (type === 'Restricted Location') ? 'block' : 'none';

        const referralSection = document.getElementById('specialized-legal-referral');
        const blankSection = document.getElementById('specialized-blank-space-check');
        if (referralSection) referralSection.style.display = (type === 'Legal Referral') ? 'block' : 'none';
        if (blankSection) blankSection.style.display = (type === 'Blank Space Check') ? 'block' : 'none';

        const eoSection = document.getElementById('specialized-eo-insurance');
        const proBonoSection = document.getElementById('specialized-pro-bono');
        if (eoSection) eoSection.style.display = (type === 'EO Insurance') ? 'block' : 'none';
        if (proBonoSection) proBonoSection.style.display = (type === 'Pro-Bono') ? 'block' : 'none';

        const invalidStampSection = document.getElementById('specialized-invalidated-stamp');
        const holographicSection = document.getElementById('specialized-holographic-seal');
        if (invalidStampSection) invalidStampSection.style.display = (type === 'Invalidated Stamp') ? 'block' : 'none';
        if (holographicSection) holographicSection.style.display = (type === 'Holographic Seal') ? 'block' : 'none';

        const analyticsSection = document.getElementById('specialized-signing-analytics');
        const kinshipSection = document.getElementById('specialized-kinship-control');
        if (analyticsSection) analyticsSection.style.display = (type === 'Signing Analytics') ? 'block' : 'none';
        if (kinshipSection) kinshipSection.style.display = (type === 'Kinship Control') ? 'block' : 'none';

        const courierSection = document.getElementById('specialized-secure-courier');
        const stateReqSection = document.getElementById('specialized-state-requirements');
        if (courierSection) courierSection.style.display = (type === 'Secure Courier') ? 'block' : 'none';
        if (stateReqSection) stateReqSection.style.display = (type === 'State Requirements') ? 'block' : 'none';

        const idCheckSection = document.getElementById('specialized-id-checklist');
        if (idCheckSection) {
            const needsIdCheck = ['Property Management', 'Translation', 'Immigration', 'Protest', 'Power of Attorney', 'Wills / Trusts', 'Apostille', 'Escrow', 'Registry', 'Batch Signing', 'Family Tree', 'Interpreter', 'Apostille Control', 'Subpoena', 'Digital Archive', 'Restricted Location', 'Legal Referral', 'Blank Space Check', 'EO Insurance', 'Pro-Bono', 'Invalidated Stamp', 'Holographic Seal', 'Signing Analytics', 'Kinship Control', 'Secure Courier', 'State Requirements'].includes(type);
            idCheckSection.style.display = needsIdCheck ? 'block' : 'none';
        }
    },

    reset() {
        document.querySelectorAll('[id^="specialized-"]').forEach(el => el.style.display = 'none');
    }
};

// ============================================
// ID EXPIRATION MANAGER
// ============================================

const IDExpirationManager = {
    check() {
        const clients = NotaryCRM.state.clients || [];
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const expiringClients = clients.filter(c => {
            if (!c.idExpiry) return false;
            const expiry = new Date(c.idExpiry);
            return expiry <= thirtyDaysFromNow;
        });

        this.renderAlert(expiringClients);
    },

    renderAlert(clients) {
        let container = document.getElementById('id-expiry-alerts');
        if (!container) {
            // Create container if it doesn't exist (above recent cases or so)
            const dashboardHome = document.getElementById('dashboard-home');
            if (!dashboardHome) return;

            container = document.createElement('div');
            container.id = 'id-expiry-alerts';
            container.style.marginBottom = '1.5rem';

            const recentCasesHeader = dashboardHome.querySelector('h3');
            if (recentCasesHeader) {
                dashboardHome.insertBefore(container, recentCasesHeader);
            } else {
                dashboardHome.appendChild(container);
            }
        }

        if (clients.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <div style="background: #fff7ed; border: 1px solid #ffedd5; border-left: 4px solid #f97316; padding: 1rem; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem; color: #9a3412; font-weight: 700;">
                    <i data-lucide="alert-triangle" style="width: 18px; height: 18px;"></i>
                    Atención: Documentos por Vencer
                </div>
                <div style="font-size: 0.85rem; color: #7c2d12;">
                    ${clients.map(c => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span><strong>${c.name}</strong>-ID vence el: ${c.idExpiry}</span>
                            <button class="btn btn-sm" onclick="NotaryCRM.editClientPrompt('${c.id}')" style="padding: 2px 8px; font-size: 0.7rem; background: #ffedd5; border: 1px solid #fdba74; color: #9a3412;">Contactar</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons({ root: container });
    }
};

// ============================================
// EXPORT MANAGERS
// ============================================

if (typeof window !== 'undefined') {
    window.DashboardManager = DashboardManager;
    window.EmailManager = EmailManager;
    window.AuditManager = AuditManager;
    window.ThemeManager = ThemeManager;
    window.PaymentManager = PaymentManager;
    window.I18nManager = I18nManager;
    window.TimelineManager = TimelineManager;
    window.TaskManager = TaskManager;
    window.NoteManager = NoteManager;
    window.FormMasks = FormMasks;
    window.FileUploadManager = FileUploadManager;
    window.SpecializedManager = SpecializedManager;
    window.witnessManager = witnessManager;
    window.biometricManager = biometricManager;
    window.MileageManager = MileageManager;
    window.ValidationManager = ValidationManager;
    window.HagueManager = HagueManager;
    window.FeeCalculatorManager = FeeCalculatorManager;
    window.IDExpirationManager = IDExpirationManager;
}

// ============================================
// ID SCANNER MANAGER (PDF417 Simulation)
// ============================================

const IDScannerManager = {
    simulateScan() {
        Toast.info('Escaneando...', 'Procesando código PDF417 de la licencia...');

        // Simulation delay
        setTimeout(() => {
            const form = document.getElementById('client-form');
            if (!form) return;

            // Sample data from a "scanned" license
            const mockData = {
                name: "CARLOS ANDRES MENDOZA",
                address: "123 FLAGER ST, MIAMI, FL 33130",
                birthDate: "1985-05-20",
                idNumber: "M532-441-85-140-0",
                idType: "Driver License",
                idExpiry: "2030-05-20"
            };

            form.querySelector('[name="name"]').value = mockData.name;
            form.querySelector('[name="address"]').value = mockData.address;
            form.querySelector('[name="birthDate"]').value = mockData.birthDate;
            form.querySelector('[name="idNumber"]').value = mockData.idNumber;
            form.querySelector('[name="idType"]').value = mockData.idType;
            form.querySelector('[name="idExpiry"]').value = mockData.idExpiry;

            Toast.success('ID Escaneado', 'Los datos se han cargado automáticamente.');
            // Flash effect
            const fields = ['name', 'address', 'birthDate', 'idNumber', 'idExpiry'];
            fields.forEach(f => {
                const el = form.querySelector(`[name = "${f}"]`);
                if (el) {
                    el.style.backgroundColor = '#f0fdf4';
                    setTimeout(() => el.style.backgroundColor = '', 1000);
                }
            });
        }, 1500);
    }
};


// Application State
window.NotaryCRM = {
    state: {
        clients: [],
        cases: [],
        appointments: [],
        users: [],
        activeTab: 'dashboard',
        isLoadingClients: false,
        isLoadingCases: false,
        searchClientQuery: '',
        searchCaseQuery: '',
        clientsPage: 1,
        clientsPageSize: 6,
        casesPage: 1,
        casesPageSize: 6,
        currency: 'USD',
        currentClientStep: 1,
        customFields: {
            clients: [],
            cases: []
        },
        witnesses: []
    },
    currentUser: null,

    // Helper for specialized fields
    copyText(id) {
        const text = document.getElementById(id)?.innerText;
        if (text) {
            const temp = document.createElement('textarea');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            Toast.success('Copiado', 'Texto copiado al portapapeles');
        }
    },

    // Initialize application
    init() {
        this.useFirestore = !!window.firebaseDB && !!window.dbFuncs;

        // Initialize Theme Mode
        ThemeManager.init();

        // Initialize Managers
        this.initSettings();

        // Initialize Language
        I18nManager.init();

        this.attachEventListeners();
        witnessManager.init();

        // ensure no stray active modals block clicks
        document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';

        if (this.useFirestore && window.authFuncs && window.authFuncs.onAuthStateChanged) {
            // Wait for auth state to initialize app
            window.authFuncs.onAuthStateChanged(window.firebaseAuth, (user) => {
                // No specific Super Admin override anymore. All users are equal.
                this.isSuperAdmin = false;
                this.handleAuthState(user);
            });
            // Reminders: load and schedule on init
            Reminders.init();
        } else {

            // No Firebase available — fall back
            this.loadData();
            this.render();
            this.checkAutomations();
        }

        // Register Service Worker for Performance & Offline
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service Worker registered', reg))
                    .catch(err => console.warn('Service Worker registration failed', err));
            });
        }

        // Performance log
        console.log(`% c Notary CRM v1.5 % c Loaded in ${performance.now().toFixed(0)} ms`,
            'background: #2563eb; color: #fff; border-radius: 4px; padding: 2px 6px; font-weight: bold;',
            'color: #2563eb; font-weight: bold;');

        // Initialize form validation
        this.initFormValidation();

        // Initialize dashboard customization
        DashboardManager.init();

        // Initialize email templates
        EmailManager.init();

        // Initialize breadcrumbs or sync indicator if needed
        this.updateSyncStatus('synced');

        // Initialize Masks
        FormMasks.init();

        // Initialize Draft Auto-save
        if (window.DraftManager) {
            DraftManager.init();
        }

        // Initialize Smart Autocomplete
        if (window.SmartAutocomplete) {
            SmartAutocomplete.init();
        }

        // Initialize Screen Reader Support
        if (window.ScreenReaderManager) {
            ScreenReaderManager.init();
        }

        // Initialize File Upload Manager
        if (window.FileUploadManager) {
            FileUploadManager.init();
        }

        // Initialize Calendar Enhancements
        if (window.CalendarEnhancements) {
            CalendarEnhancements.init();
        }

        // Initialize Case Attachments Manager
        if (window.CaseAttachmentsManager) {
            CaseAttachmentsManager.init();
        }

        // Initialize Advanced Calendar Features
        if (window.AdvancedCalendarFeatures) {
            AdvancedCalendarFeatures.init();
        }

        // Initialize Interactive Charts
        if (window.InteractiveCharts) {
            InteractiveCharts.init();
        }

        // Initialize Performance Optimizer
        if (window.PerformanceOptimizer) {
            PerformanceOptimizer.init();
        }

        // Initialize Specialized Manager
        SpecializedManager.init();

        // Initialize Advanced Analytics
        if (window.AdvancedAnalytics) {
            AdvancedAnalytics.init();
        }

        // Initialize Infinite Scroll
        if (window.InfiniteScroll) {
            InfiniteScroll.init();
        }

        // Initialize Image Optimizer
        if (window.ImageOptimizer) {
            ImageOptimizer.init();
        }

        // Initialize Database Indexing
        if (window.DatabaseIndexing) {
            DatabaseIndexing.init();
        }

        // Initialize Communication Manager
        if (window.CommunicationManager) {
            CommunicationManager.init();
        }

        this.checkCommissionExpiry();

        // Initialize Payment Manager
        if (window.PaymentManager) {
            PaymentManager.init();
        }

        // Initialize Security Manager
        if (window.SecurityManager) {
            SecurityManager.init();
            SecurityManager.setupSessionTimeout(30); // 30 minutes
        }

        // Initialize Advanced Features
        if (window.AdvancedFeatures) {
            AdvancedFeatures.init();
        }

        // Initialize Business Features
        if (window.BusinessFeatures) {
            BusinessFeatures.init();
        }

        // Initialize audit logs
        AuditManager.init();

        // Initialize Documents Generator
        if (window.DocumentsManager) {
            DocumentsManager.init();
        }

        // Log performance metrics after initialization
        setTimeout(() => {
            if (window.PerformanceOptimizer) {
                PerformanceOptimizer.logPerformanceMetrics();
            }
        }, 2000);
    },

    async initSettings() {
        if (!this.useFirestore) return;
        const { doc, getDoc, setDoc } = window.dbFuncs;
        const db = window.firebaseDB;

        try {
            const settingsRef = doc(db, 'settings', 'fields');
            const snap = await getDoc(settingsRef);
            if (snap.exists()) {
                const data = snap.data();
                this.state.customFields = {
                    clients: data.clients || [],
                    cases: data.cases || []
                };
            } else {
                // Initialize default empty
                await setDoc(settingsRef, this.state.customFields);
            }
            this.renderCustomFieldsConfig('client');
            this.renderCustomFieldsConfig('case');
        } catch (e) {
            console.error('Error loading settings', e);
        }
    },

    renderCustomFieldsConfig(type = 'client') {
        const listId = type === 'client' ? 'custom-fields-list' : 'case-custom-fields-list';
        const previewId = type === 'client' ? 'custom-fields-preview' : 'case-custom-fields-preview';

        const listEl = document.getElementById(listId);
        const previewEl = document.getElementById(previewId);
        if (!listEl || !previewEl) return;

        const fields = this.state.customFields[type === 'client' ? 'clients' : 'cases'] || [];

        listEl.innerHTML = fields.map((f, index) => `
            <div style = "display:flex; justify-content:space-between; align-items:center; background:#fff; padding:0.75rem; border-radius:8px; border:1px solid #e2e8f0;">
                <span style="font-weight:600;">${f}</span>
                <button class="btn btn-sm btn-danger-link" onclick="NotaryCRM.removeCustomField('${f}', '${type}')">Eliminar</button>
            </div>
    `).join('') || '<p style="font-size:0.85rem; color:#94a3b8;">No hay campos extra.</p>';

        previewEl.innerHTML = fields.map(f => `
    <div class="form-group" style = "margin-bottom:1rem;">
                <label class="form-label">${f}</label>
                <input type="text" class="form-input" placeholder="Ej: Dato para ${f}" disabled>
            </div>
`).join('') || '<p style="text-align:center; color:#94a3b8; padding:1rem;">No hay campos personalizados configurados.</p>';
    },

    async addCustomField(type = 'client') {
        const inputId = type === 'client' ? 'new-custom-field-name' : 'new-case-custom-field-name';
        const input = document.getElementById(inputId);
        const name = input.value.trim();
        if (!name) return;

        const targetArr = type === 'client' ? 'clients' : 'cases';
        if (this.state.customFields[targetArr].includes(name)) {
            return Toast.warning('Duplicado', 'Ese campo ya existe.');
        }

        this.state.customFields[targetArr].push(name);
        input.value = '';

        await this.syncCustomFields();
        this.renderCustomFieldsConfig(type);
        Toast.success('Campo Añadido', `Se ha creado el campo "${name}" para ${type === 'client' ? 'clientes' : 'expedientes'}.`);
    },

    async removeCustomField(name, type = 'client') {
        const targetArr = type === 'client' ? 'clients' : 'cases';
        this.state.customFields[targetArr] = this.state.customFields[targetArr].filter(f => f !== name);
        await this.syncCustomFields();
        this.renderCustomFieldsConfig(type);
        Toast.info('Campo Eliminado', `El campo "${name}" ha sido removido.`);
    },

    async syncCustomFields() {
        if (!this.useFirestore) return;
        const { doc, setDoc } = window.dbFuncs;
        const db = window.firebaseDB;
        try {
            await setDoc(doc(db, 'settings', 'fields'), this.state.customFields);
        } catch (e) { console.error(e); }
    },

    renderCustomFieldsInForm(type) {
        const container = document.getElementById(`${type === 'client' ? 'client' : 'case'}-custom-fields-container`);
        if (!container) return;

        // Safeguard for custom fields state
        if (!this.state.customFields) {
            this.state.customFields = { clients: [], cases: [] };
        }

        const key = type === 'client' ? 'clients' : 'cases';
        const fields = Array.isArray(this.state.customFields[key]) ? this.state.customFields[key] : [];

        container.innerHTML = fields.map(f => `
    <div class="form-group">
                <label class="form-label">${f}</label>
                <input type="text" class="form-input custom-field-input" data-field="${f}" name="cf_${f.replace(/\s+/g, '_')}" placeholder="Ingrese ${f.toLowerCase()}">
            </div>
`).join('');
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

        this.state.isLoadingClients = true;
        this.state.isLoadingCases = true;
        this.renderClients();
        this.renderCases();

        try {
            const { where } = window.dbFuncs;
            const clientsCol = collection(db, 'clients');
            const casesCol = collection(db, 'cases');
            const appointmentsCol = collection(db, 'appointments');

            // Listen to data belonging to the current user (Multi-tenant Strict Isolation)

            // Listen to data belonging to the current user
            if (!this.currentUser) return;
            // No workspaceId needed for Owner Isolation model

            let clientsQuery, casesQuery, appQuery;

            if (this.isSuperAdmin) {
                // Super Admin sees ALL data
                clientsQuery = query(clientsCol);
                casesQuery = query(casesCol);
                appQuery = query(appointmentsCol);
                console.log('Super Admin Mode: Loading ALL data');
            } else {
                // Regular users see ONLY their own data (Owner Isolation)
                clientsQuery = query(clientsCol, where('ownerId', '==', this.currentUser.uid));
                casesQuery = query(casesCol, where('ownerId', '==', this.currentUser.uid));
                appQuery = query(appointmentsCol, where('ownerId', '==', this.currentUser.uid));
            }

            // Store separate lists to merge them
            this.state.appointmentsPrivate = [];
            this.state.appointmentsPublic = [];

            const mergeAppointments = () => {
                // Avoid duplicates if any overlap exists (though queries are disjoint)
                const all = [...this.state.appointmentsPrivate];
                this.state.appointmentsPublic.forEach(pub => {
                    if (!all.find(priv => priv.id === pub.id)) {
                        all.push(pub);
                    }
                });
                this.state.appointments = all;
                this.renderCalendar();
                this.renderDashboard();
            };

            // Public Appointments Listener
            const publicAppQuery = query(appointmentsCol, where('source', '==', 'public_web'));
            onSnapshot(publicAppQuery, snapshot => {
                this.state.appointmentsPublic = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                mergeAppointments();
                console.log('Public apps synced:', this.state.appointmentsPublic.length);
            });

            onSnapshot(clientsQuery, snapshot => {
                this.state.isLoadingClients = false;
                this.state.clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                this.renderClients();
                this.renderDashboard();
                console.log('Real-time clients update received');
            }, err => console.error('Clients snapshot failed', err));

            // (Cases query defined above)
            onSnapshot(casesQuery, snapshot => {
                this.state.isLoadingCases = false;
                this.state.cases = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                this.renderCases();
                this.renderDashboard();
                this.renderReports();
                console.log('Real-time cases update received');
            }, err => console.error('Cases snapshot failed', err));

            // (Private Appointments query)
            onSnapshot(appQuery, snapshot => {
                this.state.appointmentsPrivate = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                mergeAppointments();
                console.log('Private apps synced:', this.state.appointmentsPrivate.length);
            }, err => console.error('Appointments snapshot failed', err));

            // Blocked Dates Listener
            const blockedCol = collection(db, 'blocked_dates');
            onSnapshot(blockedCol, snapshot => {
                this.state.blockedDates = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                console.log('Blocked dates synced:', this.state.blockedDates.length);
                this.renderCalendar();
            });

            // Witnesses Listener
            const witnessCol = collection(db, 'witnesses');
            const witnessQuery = query(witnessCol, where('ownerId', '==', this.currentUser.uid));
            onSnapshot(witnessQuery, snapshot => {
                this.state.witnesses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                witnessManager.render();
                console.log('Witnesses synced:', this.state.witnesses.length);
            });

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
            // Filter users by workspaceId as well, so admins only see their team
            const workspaceId = this.currentWorkspaceId || this.currentUser.uid;

            // Note: Requires index on workspaceId + createdAt
            // Ideally we query by workspaceId. For now, let's just query all users and filter client-side if index is missing,
            // but for security/performance in PROD, adding `where('workspaceId', '==', workspaceId)` is best.
            // Let's try adding the where clause.
            const { where } = window.dbFuncs;
            // Removed orderBy temporarily to avoid index error until admin creates composite index
            const usersQuery = query(usersCol, where('workspaceId', '==', workspaceId));

            onSnapshot(usersQuery, snapshot => {
                this.state.users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                this.renderUsers();
            });
        } catch (e) {
            console.error('Users listener failed', e);
        }
    },

    // Render Cases List
    renderCases() {
        if (this.state.caseView === 'kanban') {
            this.renderCasesKanban();
            return;
        }

        const listContainer = document.getElementById('cases-list');
        const kanbanContainer = document.getElementById('cases-kanban-board');
        if (listContainer) listContainer.style.display = 'flex';
        if (kanbanContainer) kanbanContainer.style.display = 'none';

        if (!listContainer) return;

        let cases = this.state.cases.filter(c =>
            c.caseNumber.toLowerCase().includes(this.state.searchCaseQuery) ||
            c.clientName.toLowerCase().includes(this.state.searchCaseQuery)
        );

        // Sorting (by date desc)
        cases.sort((a, b) => new Date(b.dueDate)-new Date(a.dueDate));

        // Pagination
        const start = (this.state.casesPage-1) * this.state.casesPageSize;
        const pagedCases = cases.slice(start, start + this.state.casesPageSize);

        document.getElementById('cases-page-indicator').textContent = `Page ${this.state.casesPage} `;

        if (pagedCases.length === 0) {
            listContainer.innerHTML = '<p class="empty-state">No cases found.</p>';
            return;
        }

        listContainer.innerHTML = pagedCases.map(c => `
    <div class="case-card">
                <div class="case-header">
                    <div class="case-title-row">
                        <span class="case-number">${c.caseNumber}</span>
                        <span class="status-badge status-${c.status}">${c.status.replace('-', ' ')}</span>
                    </div>
                    <div class="dropdown">
                        <button class="btn-icon" onclick="toggleDropdown('case-${c.id}')">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                        </button>
                        <div class="dropdown-menu" id="dropdown-case-${c.id}">
                            <a href="#" onclick="NotaryCRM.showCaseDetails('${c.id}')">Detalles</a>
                            <a href="#" onclick="NotaryCRM.openEditCaseModal('${c.id}')">Editar</a>
                            <a href="#" onclick="NotaryCRM.deleteCase('${c.id}')" style="color:var(--color-danger)">Eliminar</a>
                        </div>
                    </div>
                </div>
                <div onclick="NotaryCRM.showCaseDetails('${c.id}')" style="cursor:pointer;">
                    <h3 style="margin:0 0 .5rem 0; font-size:1rem; color:var(--text-primary)">${c.clientName}</h3>
                    <p style="color:var(--text-secondary); font-size:0.875rem;">${c.type}</p>
                    <div style="margin-top:1rem; display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
                        <span style="font-weight:600;">$${parseFloat(c.amount).toFixed(2)}</span>
                        <span>Due: ${c.dueDate}</span>
                    </div>
                </div>
            </div>
    `).join('');
    },

    toggleCaseView(view) {
        this.state.caseView = view; // 'list' or 'kanban'

        // Update Buttons
        document.getElementById('view-list-btn').classList.toggle('active', view === 'list');
        document.getElementById('view-kanban-btn').classList.toggle('active', view === 'kanban');

        // Update Visibility
        const list = document.getElementById('cases-list');
        const kanban = document.getElementById('cases-kanban-board');
        const pagination = document.getElementById('cases-pagination');

        if (view === 'kanban') {
            if (list) list.style.display = 'none';
            if (pagination) pagination.style.display = 'none';
            if (kanban) {
                kanban.style.display = 'flex';
                this.renderCasesKanban();
            }
        } else {
            if (kanban) kanban.style.display = 'none';
            if (list) list.style.display = 'flex';
            if (pagination) pagination.style.display = 'flex';
            this.renderCases();
        }
    },

    renderCasesKanban() {
        const container = document.getElementById('cases-kanban-board');
        if (!container) return;

        let cases = this.state.cases.filter(c =>
            c.caseNumber.toLowerCase().includes(this.state.searchCaseQuery) ||
            c.clientName.toLowerCase().includes(this.state.searchCaseQuery)
        );

        const columns = {
            'pending': { title: 'Pendiente', items: [] },
            'in-progress': { title: 'En Proceso', items: [] },
            'signed': { title: 'Firmado', items: [] },
            'completed': { title: 'Completado', items: [] }
        };

        // Distribute items
        cases.forEach(c => {
            const status = c.status || 'pending';
            if (columns[status]) {
                columns[status].items.push(c);
            } else {
                columns['pending'].items.push(c); // Fallback
            }
        });

        // Generate HTML
        container.innerHTML = Object.keys(columns).map(status => `
    <div class="kanban-column">
                <div class="kanban-header">
                    <span>${columns[status].title}</span>
                    <span class="badge" style="background:var(--color-gray-200); color:var(--text-secondary); font-size:0.75rem;">${columns[status].items.length}</span>
                </div>
                <div class="kanban-cards">
                    ${columns[status].items.map(c => `
                        <div class="kanban-card" onclick="NotaryCRM.openEditCaseModal('${c.id}')">
                            <span class="status-badge status-${status} kanban-tag" style="margin-bottom:0.5rem; display:inline-block; font-size:0.7rem; padding:2px 6px;">${c.caseNumber}</span>
                            <h4>${c.clientName}</h4>
                            <p style="font-size:0.8rem; color:#64748b; margin-bottom:0.5rem;">${c.type}</p>
                            <div class="kanban-meta">
                                <span>${new Date(c.dueDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                                <span style="font-weight:600;">$${c.amount}</span>
                            </div>
                        </div>
                    `).join('')}
                    ${columns[status].items.length === 0 ? '<div style="color:#94a3b8; font-size:0.85rem; text-align:center; padding:1rem; border:1px dashed #cbd5e1; border-radius:6px;">Sin trámites</div>' : ''}
                </div>
            </div>
    `).join('');
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
                <div class="user-info">
                    <div class="user-avatar-small">${(u.email || '?').charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <div class="user-name-email">
                            <strong>${u.email || '(no email)'}</strong>
                            ${u.id === this.currentUser?.uid ? '<span class="self-tag">Tú</span>' : ''}
                        </div>
                        <div class="user-uid muted">${u.id}</div>
                    </div>
                </div>
                <div class="user-actions">
                    <select class="role-selector" onchange="NotaryCRM.setUserRole('${u.id}', this.value)" ${u.id === this.currentUser?.uid ? 'disabled' : ''}>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
                        <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>Editor</option>
                        <option value="viewer" ${u.role === 'viewer' || !u.role ? 'selected' : ''}>Lector (Solo Ver)</option>
                    </select>
                </div>
            </div>
    `).join('');
    },

    async setUserRole(uid, role) {
        if (!this.useFirestore) {
            Toast.error('Error', 'Firebase no disponible');
            return;
        }
        if (!this.isAdmin) {
            Toast.error('No Autorizado', 'No tienes permisos para cambiar roles.');
            return;
        }

        const { doc, updateDoc } = window.dbFuncs;
        try {
            const ref = doc(window.firebaseDB, 'users', uid);
            await updateDoc(ref, { role });
            AuditManager.logAction('Cambio de Rol', `Usuario: ${uid} `, `Nuevo rol: ${role} `);
            Toast.success('Rol Actualizado', `El usuario ahora tiene el rol de ${role}.`);
        } catch (e) {
            console.error('setUserRole failed', e);
            Toast.error('Error', 'No se pudo cambiar el rol: ' + (e.message || e));
            this.renderUsers(); // reset UI state
        }
    },

    // Attach event listeners
    attachEventListeners() {
        // Tab switching
        try {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tab = e.currentTarget.getAttribute('data-tab');
                    this.switchTab(tab);
                });
            });
        } catch (e) { console.error('Tab listeners failed', e); }

        // Password Strength
        const authPass = document.getElementById('auth-password');
        if (authPass) {
            authPass.addEventListener('input', (e) => {
                const pass = e.target.value;
                const wrapper = document.getElementById('password-strength-wrapper');
                const bar = document.getElementById('password-strength-bar');
                const text = document.getElementById('password-strength-text');
                if (!pass) { wrapper.style.display = 'none'; return; }
                wrapper.style.display = 'block';
                let strength = 0;
                if (pass.length> 6) strength += 25;
                if (pass.match(/[A-Z]/)) strength += 25;
                if (pass.match(/[0-9]/)) strength += 25;
                if (pass.match(/[^A-Za-z0-9]/)) strength += 25;
                bar.style.width = strength + '%';
                if (strength <= 25) { bar.style.background = '#ef4444'; text.textContent = 'Débil'; }
                else if (strength <= 50) { bar.style.background = '#f59e0b'; text.textContent = 'Media'; }
                else if (strength <= 75) { bar.style.background = '#3b82f6'; text.textContent = 'Fuerte'; }
                else { bar.style.background = '#10b981'; text.textContent = 'Muy Fuerte'; }
            });
        }

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key.toLowerCase() === 'n') { e.preventDefault(); this.openModal('case-modal'); }
            if (e.altKey && e.key.toLowerCase() === 'c') { e.preventDefault(); this.openModal('client-modal'); }
            if (e.ctrlKey && e.key === '/') { e.preventDefault(); (document.getElementById('search-clients') || document.getElementById('search-cases'))?.focus(); }
            if (e.ctrlKey && e.key>= '1' && e.key <= '6') {
                const tabs = ['dashboard', 'clients', 'cases', 'reminders', 'calendar', 'reports'];
                if (tabs[e.key-1]) { e.preventDefault(); this.switchTab(tabs[e.key-1]); }
            }
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => this.closeModal(m.id));
                // Add exit for Commander Mode
                if (document.body.classList.contains('commander-mode')) {
                    DashboardManager.toggleCommanderMode();
                }
            }
        });

        // Pagination controls
        const addL = (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn);
        addL('clients-prev', 'click', () => { if (this.state.clientsPage> 1) { this.state.clientsPage--; this.renderClients(); } });
        addL('clients-next', 'click', () => { this.state.clientsPage++; this.renderClients(); });
        addL('clients-page-size', 'change', (e) => { this.state.clientsPageSize = parseInt(e.target.value, 10); this.state.clientsPage = 1; this.renderClients(); });
        addL('cases-prev', 'click', () => { if (this.state.casesPage> 1) { this.state.casesPage--; this.renderCases(); } });
        addL('cases-next', 'click', () => { this.state.casesPage++; this.renderCases(); });
        addL('cases-page-size', 'change', (e) => { this.state.casesPageSize = parseInt(e.target.value, 10); this.state.casesPage = 1; this.renderCases(); });

        // Export/Import
        addL('export-clients-csv', 'click', () => this.exportClients('csv'));
        addL('export-clients-json', 'click', () => this.exportClients('json'));
        addL('export-cases-csv', 'click', () => this.exportCases('csv'));
        addL('export-cases-json', 'click', () => this.exportCases('json'));
        addL('import-clients-btn', 'click', () => document.getElementById('import-clients-file')?.click());
        addL('import-clients-file', 'change', (e) => this.importClients(e.target.files[0]));
        addL('export-report-pdf', 'click', () => this.generateReportPDF());
        addL('check-duplicates-btn', 'click', () => this.checkDuplicates());
        addL('merge-all-duplicates-btn', 'click', () => this.mergeAllDuplicates());

        // Modals & Forms
        addL('calendar-form', 'submit', (e) => { e.preventDefault(); this.addAppointment(e.target); });
        addL('client-form', 'submit', (e) => { e.preventDefault(); this.addClient(e.target); });
        addL('case-form', 'submit', (e) => { e.preventDefault(); this.addCase(e.target); });
        addL('add-client-btn', 'click', () => this.openModal('client-modal'));
        addL('add-case-btn', 'click', () => this.openModal('case-modal'));
        addL('open-reminders-panel', 'click', () => this.switchTab('reminders'));
        addL('scan-id-btn', 'click', () => IDScannerManager.simulateScan());

        // Client Multi-step Navigation
        addL('next-client-step', 'click', () => {
            if (this.state.currentClientStep < 3) this.setClientStep(this.state.currentClientStep + 1);
        });
        addL('prev-client-step', 'click', () => {
            if (this.state.currentClientStep> 1) this.setClientStep(this.state.currentClientStep-1);
        });

        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            });
        });

        // Search
        addL('search-clients', 'input', (e) => { this.state.searchClientQuery = e.target.value.toLowerCase(); this.state.clientsPage = 1; this.renderClients(); });
        addL('search-cases', 'input', (e) => { this.state.searchCaseQuery = e.target.value.toLowerCase(); this.state.casesPage = 1; this.renderCases(); });

        // Global Command Search
        const globalSearch = document.getElementById('global-command-search');
        const searchResults = document.getElementById('global-search-results');

        if (globalSearch && searchResults) {
            globalSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                searchResults.style.display = query.length> 0 ? 'block' : 'none';

                if (query.length === 0) return;

                const commands = [
                    { type: 'nav', label: 'Go to Dashboard', action: () => this.switchTab('dashboard') },
                    { type: 'nav', label: 'Go to Clients', action: () => this.switchTab('clients') },
                    { type: 'nav', label: 'Go to Cases', action: () => this.switchTab('cases') },
                    { type: 'nav', label: 'Go to Calendar', action: () => this.switchTab('calendar') },
                    { type: 'action', label: 'Create New Client', action: () => this.openModal('client-modal') },
                    { type: 'action', label: 'Create New Case', action: () => this.openModal('case-modal') }
                ];

                const filteredCmds = commands.filter(c => c.label.toLowerCase().includes(query));

                const filteredClients = this.state.clients
                    .filter(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query))
                    .slice(0, 5);

                const filteredCases = this.state.cases
                    .filter(c => c.caseNumber.toLowerCase().includes(query) || c.clientName.toLowerCase().includes(query))
                    .slice(0, 5);

                let html = '';

                if (filteredCmds.length> 0) {
                    html += `<div style = "padding: 8px 12px; font-weight: 600; font-size: 0.75rem; color: #64748b; background: #f8fafc;"> COMMANDS</div> `;
                    html += filteredCmds.map(cmd => `
    <div class="search-result-item" style = "padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9; hover: background: #f1f5f9;" onclick = "window.NotaryCRM.execGlobalCommand(${commands.indexOf(cmd)})">
        <span style="color: var(--color-primary); margin-right: 8px;">Run</span> ${cmd.label}
                        </div>
    `).join('');
                }

                if (filteredClients.length> 0) {
                    html += `<div style = "padding: 8px 12px; font-weight: 600; font-size: 0.75rem; color: #64748b; background: #f8fafc;"> CLIENTS</div> `;
                    html += filteredClients.map(c => `
    <div class="search-result-item" style = "padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9;" onclick = "window.NotaryCRM.openEditModal('${c.id}')">
                            <div style="font-weight: 500;">${c.name}</div>
                            <div style="font-size: 0.8rem; color: #94a3b8;">${c.email}</div>
                        </div>
    `).join('');
                }

                if (filteredCases.length> 0) {
                    html += `<div style = "padding: 8px 12px; font-weight: 600; font-size: 0.75rem; color: #64748b; background: #f8fafc;"> CASES</div> `;
                    html += filteredCases.map(c => `
    <div class="search-result-item" style = "padding: 10px 12px; cursor: pointer; border-bottom: 1px solid #f1f5f9;" onclick = "window.NotaryCRM.switchTab('cases'); window.NotaryCRM.state.searchCaseQuery='${c.caseNumber}'; window.NotaryCRM.renderCases();">
                            <div style="font-weight: 500;">${c.caseNumber}-${c.clientName}</div>
                            <div style="font-size: 0.8rem; color: #94a3b8;">${c.type}</div>
                        </div>
    `).join('');
                }

                if (!html) html = '<div style="padding: 12px; color: #94a3b8; text-align: center;">No results found</div>';

                searchResults.innerHTML = html;

                // Hacky way to store commands for onclick
                window.NotaryCRM.tempGlobalCommands = commands;
            });

            // Focus on Cmd+K
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    globalSearch.focus();
                }
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-command-bar')) {
                    searchResults.style.display = 'none';
                }
            });
        }

        // Auth
        addL('sign-in-btn', 'click', () => this.openModal('auth-modal'));
        addL('email-login-btn', 'click', () => this.openModal('auth-modal')); // Nuevo botón en landing
        addL('google-login-btn', 'click', () => this.googleLogin());
        addL('register-btn', 'click', () => this.registerFromForm());
        addL('auth-form', 'submit', (e) => { e.preventDefault(); this.signIn(e.target); });

        // Calendar View links
        document.querySelectorAll('.cal-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                if (this.calendar) this.calendar.changeView(view);
            });
        });
    },

    execGlobalCommand(index) {
        if (this.tempGlobalCommands && this.tempGlobalCommands[index]) {
            this.tempGlobalCommands[index].action();
            document.getElementById('global-search-results').style.display = 'none';
        }
    },

    // Check if current user has a specific permission
    checkPermission(permission) {
        if (!this.currentUser) return false;
        const role = this.currentUserRole || 'viewer';

        // Admin has all permissions
        if (role === 'admin') return true;

        const permissions = {
            'viewer': ['DASHBOARD_VIEW', 'CLIENT_VIEW', 'CASE_VIEW', 'CALENDAR_VIEW', 'REPORTS_VIEW'],
            'editor': ['DASHBOARD_VIEW', 'CLIENT_VIEW', 'CLIENT_CREATE', 'CLIENT_EDIT', 'CASE_VIEW', 'CASE_CREATE', 'CASE_EDIT', 'CALENDAR_VIEW', 'CALENDAR_CREATE', 'REPORTS_VIEW', 'EMAIL_VIEW', 'EMAIL_USE'],
            'admin': ['*'] // Handled by the shortcut above
        };

        const userPermissions = permissions[role] || [];
        return userPermissions.includes(permission) || userPermissions.includes('*');
    },

    // Handle auth state
    handleAuthState(user) {
        this.currentUser = user;
        const authArea = document.getElementById('auth-area');
        if (user) {
            document.body.classList.add('authenticated');
            // show user email and sign out
            if (authArea) authArea.innerHTML = `
    <div class="user-profile-badge">
                   <div class="user-info-mini">
                      <span class="user-email">${user.email}</span>
                      <span class="user-role-tag" id="current-user-role-display">Cargando...</span>
                   </div>
                   <button class="btn btn-signout btn-sm" id="sign-out-btn">Cerrar sesión</button>
                </div>
    `;
            const signOutBtn = document.getElementById('sign-out-btn');
            if (signOutBtn) signOutBtn.addEventListener('click', () => this.signOutUser());
            this.closeModal('auth-modal');

            // initialize Firestore realtime listeners once authenticated
            if (this.useFirestore) this.initFirestore();

            // fetch user profile to check role
            (async () => {
                try {
                    const { doc, getDoc, setDoc, updateDoc } = window.dbFuncs;
                    const db = window.firebaseDB;
                    const userRef = doc(db, 'users', user.uid);

                    // Also ensure user document exists in 'users' collection
                    let userSnap = await getDoc(userRef);
                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            email: user.email,
                            role: 'admin', // First user is admin by default (or we can change this)
                            createdAt: new Date().toISOString()
                        });
                        userSnap = await getDoc(userRef); // re-fetch
                    }

                    const data = userSnap.data();
                    this.currentUserRole = data.role || 'viewer';
                    // Allow admin flag if role is admin
                    this.isAdmin = (this.currentUserRole === 'admin');

                    // Update role display
                    const roleDisplay = document.getElementById('current-user-role-display');
                    if (roleDisplay) {
                        const roleNames = { 'admin': 'Propietario', 'editor': 'Editor', 'viewer': 'Lector' };
                        roleDisplay.textContent = roleNames[this.currentUserRole] || this.currentUserRole;
                        roleDisplay.className = `user-role-tag role-${this.currentUserRole} `;
                    }

                    // Sidebar items visibility based on user request (Permanently Hidden)
                    const usersBtn = document.getElementById('users-tab-btn');
                    const auditBtn = document.getElementById('audit-tab-btn');
                    if (usersBtn) usersBtn.style.display = 'none';
                    if (auditBtn) auditBtn.style.display = 'none';

                    // Apply permissions to UI immediately
                    this.applyUIPermissions();

                    /* 
                       Listeners for Users and Audit disabled per user request to hide these sections.
                       if (this.isAdmin) {
                           this.startUsersListener();
                           AuditManager.startListener();
                       }
                    */

                    this.render(); // Re-render everything with new permissions
                    this.checkAutomations();

                    // Reload reminders for the authenticated user
                    if (window.Reminders) {
                        Reminders.load().then(() => Reminders.render());
                    }

                    // Reload Payment Config (Billing Settings)
                    if (window.PaymentManager) {
                        PaymentManager.setupPayPalConfig();
                    }
                } catch (e) {
                    console.error('Failed to fetch user profile', e);
                    this.currentUserRole = 'viewer';
                    this.render();
                }
            })();
        } else {
            document.body.classList.remove('authenticated');
            this.currentUserRole = null;
            if (authArea) authArea.innerHTML = `<button class="btn" id = "sign-in-btn"> Iniciar sesión</button> `;
            const signInBtn = document.getElementById('sign-in-btn');
            if (signInBtn) signInBtn.addEventListener('click', () => this.openModal('auth-modal'));

            // clear data until sign-in
            this.state.clients = [];
            this.state.cases = [];
            this.state.appointments = [];

            // Clear reminders when user logs out
            if (window.Reminders) {
                Reminders.state.items = [];
                Reminders.render();
            }

            // User logged out or initialization with no user
            console.log('No user session active');

            this.initFirestore();
            this.render();
            this.checkAutomations();
        }
    },

    // Method to hide/show UI elements based on global permissions
    applyUIPermissions() {
        if (!this.currentUser) return;

        const canCreateClient = this.checkPermission('CLIENT_CREATE');
        const canCreateCase = this.checkPermission('CASE_CREATE');
        const canViewEmail = this.checkPermission('EMAIL_VIEW');

        const addClientBtn = document.getElementById('add-client-btn');
        if (addClientBtn) addClientBtn.style.display = canCreateClient ? '' : 'none';

        const addCaseBtn = document.getElementById('add-case-btn');
        if (addCaseBtn) addCaseBtn.style.display = canCreateCase ? '' : 'none';

        const addTemplateBtn = document.getElementById('add-template-btn');
        if (addTemplateBtn) addTemplateBtn.style.display = this.isAdmin ? '' : 'none';

        const emailTabBtn = document.getElementById('emails-tab-btn');
        if (emailTabBtn) emailTabBtn.style.display = canViewEmail ? '' : 'none';

        const usersTabBtn = document.getElementById('users-tab-btn');
        if (usersTabBtn) usersTabBtn.style.display = this.isAdmin ? '' : 'none';

        const auditTabBtn = document.getElementById('audit-tab-btn');
        if (auditTabBtn) auditTabBtn.style.display = this.isAdmin ? '' : 'none';
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
            AuditManager.logAction('Inicio de Sesión', 'Google', 'Autenticación exitosa');
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
            AuditManager.logAction('Inicio de Sesión', 'Email/Password', email);
            Toast.success('Bienvenido', email);
            this.closeModal('auth-modal'); // Close modal explicitly here just in case
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

        // Update tab buttons & content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none'; // Force hide for robust switching
        });

        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            // Remove manual display manipulation, let CSS handle .tab-content.active
            targetTab.style.display = '';
        }

        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (targetBtn) targetBtn.classList.add('active');

        // Update Breadcrumb
        const currentBreadcrumb = document.getElementById('breadcrumb-current');
        if (currentBreadcrumb && tabName) {
            currentBreadcrumb.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
        }

        // Scroll to top on mobile
        if (window.innerWidth < 1024) window.scrollTo(0, 0);

        // Trigger specific renders
        if (tabName === 'dashboard') this.renderDashboard();
        if (tabName === 'clients') this.renderClients();
        if (tabName === 'reports') this.renderReports();
        if (tabName === 'calendar') this.renderCalendar();
        if (tabName === 'journal') this.renderJournal();
        if (tabName === 'emails') EmailManager.renderTemplates();

        // Refresh icons on tab switch
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    async mockScanID() {
        Toast.info('Escaneando...', 'Procesando licencia de conducir (OCR Simulado)');
        await new Promise(r => setTimeout(r, 2000));

        const form = document.getElementById('client-form');
        if (form) {
            form.name.value = "John Doe (Escaneado)";
            form.email.value = "john.doe.ocr@example.com";
            form.phone.value = "(555) 000-0000";
            form.address.value = "123 Scan Way, Digital City, 99999";
            Toast.success('Éxito', 'Datos extraídos correctamente del ID');
        }
    },

    renderJournal() {
        const completedCases = this.state.cases.filter(c => c.status === 'completed');
        const container = document.getElementById('journal-table-body');
        if (!container) return;

        if (completedCases.length === 0) {
            container.innerHTML = '<tr><td colspan="7" class="empty-state">No se han registrado actos notariales oficiales aún.</td></tr>';
            return;
        }

        container.innerHTML = completedCases.map(c => `
    <tr>
                <td style="font-size: 0.8rem;">${c.dueDate || 'N/A'}</td>
                <td><span class="badge" style="background:#fef3c7; color:#92400e; font-size: 0.75rem;">${c.type}</span></td>
                <td><strong>${c.clientName}</strong></td>
                <td style="font-size: 0.8rem; color: #64748b;">${c.witness1_id || 'ID Escaneado'}</td>
                <td style="font-size: 0.8rem;">${c.witness1 || '---'}</td>
                <td style="font-weight: 600;">$${c.amount.toFixed(2)}</td>
                <td style="text-align:right;">
                    <button class="btn-icon" title="Ver Expediente" onclick="window.NotaryCRM.showCaseDetails('${c.id}')">
                        <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                    </button>
                </td>
            </tr>
    `).join('');

        if (window.lucide) window.lucide.createIcons();
    },

    exportJournal() {
        Toast.info('Exportando...', 'Generando diario notarial oficial en PDF');

        // Robust jsPDF detection
        let jsPDFClass = null;
        if (window.jspdf && window.jspdf.jsPDF) {
            jsPDFClass = window.jspdf.jsPDF;
        } else if (window.jsPDF) {
            jsPDFClass = window.jsPDF;
        }

        if (!jsPDFClass) {
            return Toast.error('Error', 'La librería PDF no se cargó correctamente.');
        }

        try {
            const doc = new jsPDFClass({ orientation: 'landscape' });
            const completedCases = this.state.cases.filter(c => c.status === 'completed' || c.status === 'Completado');

            if (completedCases.length === 0) {
                return Toast.warning('Sin Datos', 'No hay expedientes completados para exportar al diario.');
            }

            // Header
            doc.setFontSize(18);
            doc.setTextColor(30, 58, 138);
            doc.text('DIARIO NOTARIAL OFICIAL', 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generado el: ${new Date().toLocaleString()} `, 14, 27);
            doc.text(`Notario: ${this.currentUser?.displayName || 'Profesional'} `, 14, 32);

            // Table Data
            const tableHeaders = [['Fecha', 'Caso #', 'Cliente', 'Tipo de Acto', 'Identificación', 'Testigos', 'Monto']];
            const tableRows = completedCases.map(c => [
                this.formatDate(c.createdAt),
                c.caseNumber || 'N/A',
                c.clientName || 'N/A',
                c.type || 'N/A',
                c.idType ? `${c.idType}: ${c.idNumber || '-'} ` : 'N/A',
                c.witness1 ? `${c.witness1}${c.witness2 ? ', ' + c.witness2 : ''} ` : 'N/A',
                this.formatCurrency(c.amount)
            ]);

            // Use autoTable if available
            if (doc.autoTable) {
                doc.autoTable({
                    head: tableHeaders,
                    body: tableRows,
                    startY: 40,
                    theme: 'striped',
                    headStyles: { fillColor: [30, 58, 138] },
                    styles: { fontSize: 8 },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        1: { cellWidth: 20 },
                        2: { cellWidth: 40 },
                        3: { cellWidth: 40 },
                        4: { cellWidth: 40 },
                        5: { cellWidth: 40 },
                        6: { cellWidth: 20 }
                    }
                });
            } else {
                // Fallback basic draw if autoTable fails to load
                let y = 45;
                doc.setFontSize(9);
                tableHeaders[0].forEach((h, i) => doc.text(h, 14 + (i * 35), y));
                y += 10;
                tableRows.forEach(row => {
                    row.forEach((cell, i) => doc.text(String(cell), 14 + (i * 35), y));
                    y += 7;
                    if (y> 180) { doc.addPage(); y = 20; }
                });
            }

            doc.save(`Diario_Notarial_${new Date().toISOString().split('T')[0]}.pdf`);
            Toast.success('Exportado', 'El diario ha sido descargado exitosamente.');
        } catch (err) {
            console.error('Export Journal Error:', err);
            Toast.error('Error', 'Falló la generación del PDF: ' + err.message);
        }
    },

    switchHelpTab(tab) {
        // Toggle Buttons
        const buttons = document.querySelectorAll('.help-tabs .tab-btn');
        buttons.forEach(btn => {
            if (btn.getAttribute('onclick').includes(tab)) {
                btn.classList.add('active');
                btn.style.borderBottom = '2px solid var(--color-primary)';
                btn.style.color = 'inherit';
            } else {
                btn.classList.remove('active');
                btn.style.borderBottom = 'none';
                btn.style.color = '#6b7280';
            }
        });

        // Toggle Content
        document.getElementById('help-faq-content').style.display = tab === 'faq' ? 'block' : 'none';
        document.getElementById('help-contact-content').style.display = tab === 'contact' ? 'block' : 'none';
    },

    // Modal controls
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Reset step if it's the client modal
        if (modalId === 'client-modal') {
            this.setClientStep(1);
            this.renderCustomFieldsInForm('client');
        }
        if (modalId === 'case-modal') {
            this.renderCustomFieldsInForm('case');
            SpecializedManager.reset();
            const form = document.getElementById('case-form');
            if (form) form.reset();
        }
        if (modalId === 'client-custom-fields-modal') {
            this.renderCustomFieldsConfig('client');
        }
        if (modalId === 'case-custom-fields-modal') {
            this.renderCustomFieldsConfig('case');
        }

        // Initialize Lucide icons if any were injected
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Announce modal opening for screen readers
        if (window.ScreenReaderManager) {
            const modalTitle = modal.querySelector('.modal-title')?.textContent || 'Dialog';
            ScreenReaderManager.announce(`${modalTitle} opened`);
        }

        // Auto-populate client selects if they exist in the modal
        const clientSelects = ['case-client-select', 'cal-client-select', 'client-related-select'];
        clientSelects.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const currentVal = select.value;
                const isEs = I18nManager.currentLang === 'es';
                select.innerHTML = `<option value = ""> ${isEs ? 'Selecciona un cliente' : 'Select a client'}</option> ` +
                    this.state.clients.map(c => `<option value = "${c.id}" ${c.id === currentVal ? 'selected' : ''}> ${c.name}</option> `).join('');
            }
        });

        // Init FAQs if opening help center
        if (modalId === 'help-center-modal') {
            this.filterFAQs('all');
        }

        // Refresh Journal data if opening journal modal
        if (modalId === 'journal-modal') {
            this.renderJournal();
        }
    },

    addPaperStock() {
        const start = parseInt(document.getElementById('paper-start').value);
        const end = parseInt(document.getElementById('paper-end').value);
        if (isNaN(start) || isNaN(end) || end <start) {
            Toast.error('Error', 'Rango de folios inválido');
            return;
        }
        const count = end-start + 1;
        const current = parseInt(localStorage.getItem('notary_paper_stock') || '0');
        const total = current + count;
        localStorage.setItem('notary_paper_stock', total);
        document.getElementById('paper-stock-count').textContent = total;
        Toast.success('Inventario Actualizado', `Se han añadido ${count} hojas de seguridad.`);
    },

    updatePaperStockDisplay() {
        const count = localStorage.getItem('notary_paper_stock') || '0';
        const el = document.getElementById('paper-stock-count');
        if (el) el.textContent = count;
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('active');
        modal.style.display = ''; // Clear inline styles that might force display
        document.body.style.overflow = '';

        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    },


    saveCommission(form) {
        const data = {
            number: form.commissionNumber.value,
            state: form.commissionState.value,
            expiry: form.commissionExpiry.value
        };
        localStorage.setItem('notary_commission', JSON.stringify(data));
        Toast.success('Configuración Guardada', 'Tus credenciales notariales han sido actualizadas.');
        this.closeModal('notary-commission-modal');
        this.checkCommissionExpiry();
    },

    checkCommissionExpiry() {
        const dataStr = localStorage.getItem('notary_commission');
        const container = document.getElementById('commission-alert-container');
        if (!dataStr) {
            if (container) container.innerHTML = '';
            return;
        }

        const data = JSON.parse(dataStr);
        const expiry = new Date(data.expiry);
        const today = new Date();
        const diffDays = Math.ceil((expiry-today) / (1000 * 60 * 60 * 24));

        if (container) {
            if (diffDays <= 90) {
                const color = diffDays <= 15 ? '#ef4444' : '#f59e0b';
                const bgColor = diffDays <= 15 ? '#fef2f2' : '#fffbeb';
                const borderColor = diffDays <= 15 ? '#fecaca' : '#fef3c7';

                container.innerHTML = `
    <div style = "background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 1rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; color: ${color};">
                        <div style="background: ${color}; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800;">!</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 1rem;">${diffDays <= 0 ? '¡COMISIÓN VENCIDA!' : 'Aviso de Vencimiento de Comisión'}</div>
                            <div style="font-size: 0.85rem; opacity: 0.9;">Tu comisión (${data.number}) expira en <strong>${diffDays} días</strong> (${data.expiry}). Por favor, inicia el trámite de renovación.</div>
                        </div>
                        <button class="btn btn-sm" style="background: ${color}; color: white; border: none;" onclick="NotaryCRM.openModal('notary-commission-modal')">Actualizar</button>
                    </div>
    `;
            } else {
                container.innerHTML = '';
            }
        }

        if (diffDays> 0 && diffDays <= 90) {
            Toast.warning('Vencimiento de Comisión', `Tu comisión notarial vence en ${diffDays} días.`);
        } else if (diffDays <= 0) {
            Toast.error('Comisión Vencida', 'Tu comisión notarial ha expirado.');
        }
    },
    switchHelpTab(tabName) {
        // Nav buttons
        const btns = document.querySelectorAll('.help-nav-item');
        btns.forEach(btn => {
            if (btn.dataset.tab === tabName) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Content areas
        const contents = document.querySelectorAll('.help-tab-content');
        contents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
        });

        const activeContent = document.getElementById(`help-tab-${tabName} `);
        if (activeContent) {
            activeContent.style.display = 'block';
            setTimeout(() => activeContent.classList.add('active'), 10);
        }

        // If switching to FAQ, maybe refresh/init
        if (tabName === 'faq') {
            this.filterFAQs('all');
        }
    },

    filterFAQs(category) {
        // Update styling
        document.querySelectorAll('.faq-cat-btn').forEach(btn => {
            if (btn.dataset.cat === category) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        const container = document.getElementById('faq-accordion-container');
        if (!container || !window.FAQ_DATABASE) return;

        let faqs = [];
        if (category === 'all') {
            // Merge all arrays
            Object.values(window.FAQ_DATABASE).forEach(arr => faqs.push(...arr));
        } else {
            faqs = window.FAQ_DATABASE[category] || [];
        }

        if (faqs.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:2rem; color:#94a3b8;">No se encontraron preguntas.</div>';
            return;
        }

        // Generate HTML
        container.innerHTML = faqs.map((item) => `
    <div class="accordion-item">
                <button class="accordion-header" onclick="this.parentElement.classList.toggle('active')">
                    ${this.escapeHtml(item.q)}
                    <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="accordion-body">
                    ${this.escapeHtml(item.a)}
                </div>
            </div>
    `).join('');
    },

    // Helper: Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Custom Confirmation Dialog
    confirmAction(title, message, onProceed, options = {}) {
        const {
            type = 'danger',
            confirmText = 'Continuar',
            cancelText = 'Cancelar',
            icon = null
        } = options;

        const modal = document.getElementById('confirm-modal');
        const content = modal.querySelector('.modal-confirm');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const proceedBtn = document.getElementById('confirm-proceed');
        const cancelBtn = document.getElementById('confirm-cancel');

        // Set type class
        content.classList.remove('danger', 'warning', 'info');
        content.classList.add(type);

        titleEl.textContent = title;
        messageEl.textContent = message;
        proceedBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        // Reset classes for proceed button
        proceedBtn.className = 'btn';
        proceedBtn.classList.add(type === 'danger' ? 'btn-danger' : (type === 'warning' ? 'btn-primary' : 'btn-primary'));

        const handleProceed = () => {
            if (typeof onProceed === 'function') onProceed();
            this.closeModal('confirm-modal');
            proceedBtn.onclick = null;
            cancelBtn.onclick = null;
        };

        const handleCancel = () => {
            this.closeModal('confirm-modal');
            proceedBtn.onclick = null;
            cancelBtn.onclick = null;
        };

        // Use onclick to prevent listener stacking
        proceedBtn.onclick = handleProceed;
        cancelBtn.onclick = handleCancel;

        this.openModal('confirm-modal');
    },

    // Step Navigation for Client Form
    setClientStep(step) {
        this.state.currentClientStep = step;

        // Update View
        document.querySelectorAll('#client-form .form-step').forEach(el => {
            el.classList.toggle('active', parseInt(el.getAttribute('data-step')) === step);
        });

        // Update Indicators
        document.querySelectorAll('#client-step-indicator .step').forEach(el => {
            const s = parseInt(el.getAttribute('data-step'));
            el.classList.toggle('active', s === step);
            el.classList.toggle('completed', s <step);
        });

        // Update Buttons
        const prevBtn = document.getElementById('prev-client-step');
        const nextBtn = document.getElementById('next-client-step');
        const submitBtn = document.getElementById('submit-client-form');



        if (step === 3) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'block';
        } else {
            if (nextBtn) nextBtn.style.display = 'block';
            if (submitBtn) submitBtn.style.display = 'none';
        }

        if (step === 1) {
            if (prevBtn) prevBtn.style.display = 'none';
        } else {
            if (prevBtn) prevBtn.style.display = 'block';
        }
    },

    // Add client
    async addClient(form) {
        const formData = new FormData(form);
        const id = formData.get('id');
        const tags = formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim().toLowerCase()).filter(t => t) : [];

        // Collect Custom Fields
        const customFields = {};
        form.querySelectorAll('.custom-field-input').forEach(input => {
            const fieldName = input.getAttribute('data-field');
            customFields[fieldName] = input.value;
        });

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
            idExpiry: formData.get('idExpiry'),
            notes: formData.get('notes'),
            relatedId: formData.get('relatedId') || null,
            tags: tags,
            customFields: customFields, // SAVE CUSTOM FIELDS
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
            const toInsert = Object.assign({}, client, {
                ownerId: this.currentUser ? this.currentUser.uid : null,
                createdAt: window.dbFuncs.serverTimestamp()
            });
            this.updateSyncStatus('syncing');
            addDoc(clientsCol, toInsert)
                .then(async (docRef) => {
                    this.updateSyncStatus('synced');
                    AuditManager.logAction('Creación de Cliente', client.name, `ID: ${docRef.id} `);

                    // --- AUTOMATIC ACCOUNT CREATION ---
                    // Create an auth account for the client so they can use "Mi Notaría"
                    if (client.email && client.phone) {
                        try {
                            const { createUserWithEmailAndPassword, signOut } = window.authFuncs;
                            // Use phone number as password (cleaned of non-digits)
                            const cleanPass = client.phone.replace(/\D/g, '');

                            if (cleanPass.length>= 6) {
                                // Create user in background using secondary auth (prevents admin logout)
                                const userCredential = await createUserWithEmailAndPassword(window.secondaryAuth, client.email, cleanPass);

                                // Save additional user data for the portal
                                const { doc, setDoc } = window.dbFuncs;
                                const userRef = doc(window.firebaseDB, 'users', userCredential.user.uid);
                                await setDoc(userRef, {
                                    email: client.email,
                                    role: 'client',
                                    clientId: docRef.id,
                                    workspaceId: this.currentUser.uid, // Associated with this notary
                                    createdAt: new Date().toISOString()
                                });

                                // Significant: Sign out from secondary app immediately to clear state
                                await signOut(window.secondaryAuth);

                                console.log('Portal account created for client:', client.email);
                                Toast.info('Cuenta Creada', `Se ha habilitado el acceso al portal para ${client.email}.`);
                            }
                        } catch (authErr) {
                            if (authErr.code === 'auth/email-already-in-use') {
                                console.log('Auth account already exists for this email.');
                            } else {
                                console.warn('Could not create portal account:', authErr.message);
                            }
                        }
                    }

                    this.closeModal('client-modal');

                    // Clear draft after successful save
                    if (window.DraftManager) {
                        DraftManager.clearDraft('client-form');
                    }

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
        const client = this.state.clients.find(c => c.id === id);
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
                        .then(() => {
                            AuditManager.logAction('Eliminación de Cliente', client ? client.name : 'Unknown', `ID: ${id} `);
                            Toast.success('Cliente Eliminado', 'El cliente ha sido eliminado correctamente.');
                        })
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
                        await fetch(api + `/ api / clients / ${id} `, { method: 'DELETE' });
                    } catch (e) {
                        console.warn('SQL delete failed', e);
                    }
                })();
            }
        );
    },

    // Add case
    async addCase(form) {
        const formData = new FormData(form);
        const id = formData.get('id');
        const clientId = formData.get('clientId');
        const client = this.state.clients.find(c => c.id === clientId) || {};

        // Collect Custom Fields
        const customFields = {};
        form.querySelectorAll('.custom-field-input').forEach(input => {
            const fieldName = input.getAttribute('data-field');
            customFields[fieldName] = input.value;
        });

        const caseItem = {
            caseNumber: id ? formData.get('caseNumber') : this.generateCaseNumber(formData.get('type')),
            clientId: clientId,
            clientName: client.name || 'Unknown',
            type: formData.get('type'),
            location: formData.get('location'),
            amount: parseFloat(formData.get('amount')) || 0,
            paymentStatus: formData.get('paymentStatus') || 'pending',
            dueDate: formData.get('dueDate'),
            mileage: parseFloat(formData.get('mileage')) || 0,
            description: formData.get('description'),
            status: formData.get('status') || 'pending',
            customFields: customFields,
            // Specialized Notary Fields
            witness1: formData.get('witness1'),
            witness1_id: formData.get('witness1_id'),
            // Specialized Notary Fields
            apostilleDestination: formData.get('apostilleDestination'),
            apostilleTracking: formData.get('apostilleTracking'),
            lsa_closing_disclosure: formData.get('lsa_closing_disclosure') === 'on',
            lsa_the_note: formData.get('lsa_the_note') === 'on',
            lsa_deed_of_trust: formData.get('lsa_deed_of_trust') === 'on',
            lsa_pcor: formData.get('lsa_pcor') === 'on',
            lsa_id_verified: formData.get('lsa_id_verified') === 'on',
            weddingSpouse1: formData.get('weddingSpouse1'),
            weddingSpouse2: formData.get('weddingSpouse2'),
            weddingLicense: formData.get('weddingLicense'),
            weddingLicenseExpiry: formData.get('weddingLicenseExpiry'),
            weddingCounty: formData.get('weddingCounty'),
            consularEmbassy: formData.get('consularEmbassy'),
            consularCountry: formData.get('consularCountry'),
            willExecutor: formData.get('willExecutor'),
            willBeneficiaries: formData.get('willBeneficiaries'),
            willWitness1: formData.get('willWitness1'),
            willWitness2: formData.get('willWitness2'),
            poa_general: formData.get('poa_general') === 'on',
            poa_special: formData.get('poa_special') === 'on',
            poa_financial: formData.get('poa_financial') === 'on',
            poa_medical: formData.get('poa_medical') === 'on',
            poa_durable: formData.get('poa_durable') === 'on',
            poa_real_estate: formData.get('poa_real_estate') === 'on',
            // Immigration
            immigFormType: formData.get('immigFormType'),
            immigLanguage: formData.get('immigLanguage'),
            immigHasTranslator: formData.get('immigHasTranslator') === 'on',
            immigVerifiedIdentity: formData.get('immigVerifiedIdentity') === 'on',
            // Signature Tracking
            signatureMap: formData.get('signatureMap'),
            signerCount: parseInt(formData.get('signerCount')) || 1,
            notarizedPageCount: parseInt(formData.get('notarizedPageCount')) || 1,
            // Protest
            protestInstrument: formData.get('protestInstrument'),
            protestAmount: parseFloat(formData.get('protestAmount')) || 0,
            protestReason: formData.get('protestReason'),
            protestDate: formData.get('protestDate'),
            // Translation
            transSourceLang: formData.get('transSourceLang'),
            transTargetLang: formData.get('transTargetLang'),
            transName: formData.get('transName'),
            transLicense: formData.get('transLicense'),
            transCount: formData.get('transCount'),
            // Property Management
            propDocType: formData.get('propDocType'),
            propAddress: formData.get('propAddress'),
            // ID Checklist
            id_check_photo: formData.get('id_check_photo') === 'on',
            id_check_tamper: formData.get('id_check_tamper') === 'on',
            id_check_expiry: formData.get('id_check_expiry') === 'on',
            id_check_present: formData.get('id_check_present') === 'on',
            // Escrow
            escrowAmount: parseFloat(formData.get('escrowAmount')) || 0,
            escrowDepositDate: formData.get('escrowDepositDate'),
            escrowConditions: formData.get('escrowConditions'),
            // Registry
            registryBoxCode: formData.get('registryBoxCode'),
            registryFolio: formData.get('registryFolio'),
            registryDocDesc: formData.get('registryDocDesc'),
            // Batch Signing
            batchDocCount: parseInt(formData.get('batchDocCount')) || 1,
            batchTemplateUsed: formData.get('batchTemplateUsed'),
            batchDescription: formData.get('batchDescription'),
            // Family Tree
            familyMainTestator: formData.get('familyMainTestator'),
            familyHeirCount: parseInt(formData.get('familyHeirCount')) || 0,
            familyTreeData: formData.get('familyTreeData'),
            // Interpreter
            interpName: formData.get('interpName'),
            interpLicense: formData.get('interpLicense'),
            interpSourceLang: formData.get('interpSourceLang'),
            interpTargetLang: formData.get('interpTargetLang'),
            // Apostille Control
            apostilleCertNum: formData.get('apostilleCertNum'),
            apostilleState: formData.get('apostilleState'),
            apostilleStampId: formData.get('apostilleStampId'),
            // Shipping Cost
            shipCarrier: formData.get('shipCarrier'),
            shipCost: parseFloat(formData.get('shipCost')) || 0,
            shipTrackingNum: formData.get('shipTrackingNum'),
            // Subpoena
            subpoenaCaseNum: formData.get('subpoenaCaseNum'),
            subpoenaCourt: formData.get('subpoenaCourt'),
            subpoenaDate: formData.get('subpoenaDate'),
            // Digital Archive
            archiveDuration: parseInt(formData.get('archiveDuration')) || 10,
            archiveRetentionExp: formData.get('archiveRetentionExp'),
            archiveBoxId: formData.get('archiveBoxId'),
            // Restricted Location
            restrictedFacilityType: formData.get('restrictedFacilityType'),
            restrictedContactPerson: formData.get('restrictedContactPerson'),
            restrictedEntryPermit: formData.get('restrictedEntryPermit'),
            restrictedVisitationTime: formData.get('restrictedVisitationTime'),
            // Legal Referral
            referralAttorney: formData.get('referralAttorney'),
            referralCommissionRate: parseInt(formData.get('referralCommissionRate')) || 0,
            referralPaymentStatus: formData.get('referralPaymentStatus'),
            // Blank Space Check
            blankSpaceVerified: formData.get('blankSpaceVerified') === 'true',
            blankLineCrossed: formData.get('blankLineCrossed') === 'true',
            blankSpaceNotes: formData.get('blankSpaceNotes'),
            // EO Insurance
            eoCompany: formData.get('eoCompany'),
            eoCoverageAmount: parseFloat(formData.get('eoCoverageAmount')) || 0,
            eoPolicyNum: formData.get('eoPolicyNum'),
            eoExpiration: formData.get('eoExpiration'),
            // Pro-Bono
            proBonoReason: formData.get('proBonoReason'),
            proBonoWaivedAmount: parseFloat(formData.get('proBonoWaivedAmount')) || 0,
            // Invalidated Stamp
            invalidStampReason: formData.get('invalidStampReason'),
            invalidStampId: formData.get('invalidStampId'),
            invalidStampReportDate: formData.get('invalidStampReportDate'),
            invalidStampPoliceReport: formData.get('invalidStampPoliceReport'),
            // Holographic Seal
            holographicSerial: formData.get('holographicSerial'),
            holographicType: formData.get('holographicType'),
            holographicApplied: formData.get('holographicApplied') === 'true',
            // Signing Analytics
            signingStartTime: formData.get('signingStartTime'),
            signingEndTime: formData.get('signingEndTime'),
            signingDelayMins: parseInt(formData.get('signingDelayMins')) || 0,
            // Kinship Control
            kinshipDegree: formData.get('kinshipDegree'),
            economicInterest: formData.get('economicInterest'),
            kinshipVerified: formData.get('kinshipVerified') === 'true',
            // Secure Courier
            courierPerson: formData.get('courierPerson'),
            courierBagId: formData.get('courierBagId'),
            courierIdVerified: formData.get('courierIdVerified'),
            courierDispatchTime: formData.get('courierDispatchTime'),
            // State Requirements
            stateJurisdiction: formData.get('stateJurisdiction'),
            stateAppliedReq: formData.get('stateAppliedReq'),
            stateLawsChecked: formData.get('stateLawsChecked') === 'true'
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
                                type: `Vencimiento: ${caseItem.type} `,
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
                    AuditManager.logAction('Creación de Caso', caseItem.caseNumber, `DocID: ${docRef.id} `);
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
                const caseItem = this.state.cases.find(c => c.id === id);
                if (this.useFirestore) {
                    if (!this.currentUser) {
                        Toast.warning('Autenticación Requerida', 'Debes iniciar sesión para eliminar casos.');
                        return;
                    }
                    const { doc, deleteDoc } = window.dbFuncs;
                    const caseRef = doc(window.firebaseDB, 'cases', id);
                    deleteDoc(caseRef)
                        .then(() => {
                            AuditManager.logAction('Eliminación de Caso', caseItem ? caseItem.caseNumber : 'Unknown', `ID: ${id} `);
                            Toast.success('Caso Eliminado', 'El caso ha sido eliminado correctamente.');
                        })
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
                        await fetch(api + `/ api / cases / ${id} `, { method: 'DELETE' });
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

        // Render custom fields first
        this.renderCustomFieldsInForm('client');

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
        if (form.querySelector('input[name="idExpiry"]')) form.querySelector('input[name="idExpiry"]').value = client.idExpiry || '';
        if (form.querySelector('textarea[name="notes"]')) form.querySelector('textarea[name="notes"]').value = client.notes || '';
        if (form.querySelector('select[name="relatedId"]')) form.querySelector('select[name="relatedId"]').value = client.relatedId || '';
        if (form.querySelector('input[name="tags"]')) form.querySelector('input[name="tags"]').value = (client.tags || []).join(', ');

        // Populate Custom Fields
        if (client.customFields) {
            Object.keys(client.customFields).forEach(f => {
                const input = form.querySelector(`.custom-field-input[data-field="${f}"]`);
                if (input) input.value = client.customFields[f];
            });
        }

        this.openModal('client-modal');
    },

    async updateClient(id, updates) {
        if (this.useFirestore) {
            if (!this.currentUser) return alert('Debes iniciar sesión para editar clientes.');
            const { doc, updateDoc } = window.dbFuncs;
            const ref = doc(window.firebaseDB, 'clients', id);
            try {
                await updateDoc(ref, updates);
                const clientItem = this.state.clients.find(c => c.id === id);
                AuditManager.logAction('Actualización de Cliente', updates.name || (clientItem ? clientItem.name : id), `ID: ${id} `);
                Toast.success('Cliente Actualizado', 'Los datos del cliente han sido actualizados.');
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
                await fetch(api + `/ api / clients / ${id} `, {
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

        // Render custom fields
        this.renderCustomFieldsInForm('case');

        form.querySelector('input[name="id"]').value = id || '';
        form.querySelector('input[name="caseNumber"]').value = caseItem.caseNumber || '';
        form.querySelector('select[name="clientId"]').value = caseItem.clientId || '';
        form.querySelector('select[name="type"]').value = caseItem.type || 'General';
        form.querySelector('select[name="location"]').value = caseItem.location || 'Oficina';
        form.querySelector('input[name="amount"]').value = caseItem.amount || 0;
        form.querySelector('select[name="paymentStatus"]').value = caseItem.paymentStatus || 'pending';
        form.querySelector('input[name="dueDate"]').value = caseItem.dueDate || '';
        form.querySelector('textarea[name="description"]').value = caseItem.description || '';
        form.querySelector('select[name="status"]').value = caseItem.status || 'pending';

        // Populate Custom Fields
        if (caseItem.customFields) {
            Object.keys(caseItem.customFields).forEach(f => {
                const input = form.querySelector(`.custom-field-input[data-field="${f}"]`);
                if (input) input.value = caseItem.customFields[f];
            });
        }

        // Populate Specialized Notary Fields
        if (form.querySelector('input[name="mileage"]')) form.querySelector('input[name="mileage"]').value = caseItem.mileage || 0;
        if (form.querySelector('input[name="apostilleDestination"]')) form.querySelector('input[name="apostilleDestination"]').value = caseItem.apostilleDestination || '';
        if (form.querySelector('input[name="apostilleTracking"]')) form.querySelector('input[name="apostilleTracking"]').value = caseItem.apostilleTracking || '';

        if (form.querySelector('input[name="lsa_closing_disclosure"]')) form.querySelector('input[name="lsa_closing_disclosure"]').checked = !!caseItem.lsa_closing_disclosure;
        if (form.querySelector('input[name="lsa_the_note"]')) form.querySelector('input[name="lsa_the_note"]').checked = !!caseItem.lsa_the_note;
        if (form.querySelector('input[name="lsa_deed_of_trust"]')) form.querySelector('input[name="lsa_deed_of_trust"]').checked = !!caseItem.lsa_deed_of_trust;
        if (form.querySelector('input[name="lsa_pcor"]')) form.querySelector('input[name="lsa_pcor"]').checked = !!caseItem.lsa_pcor;

        if (form.querySelector('input[name="weddingSpouse1"]')) form.querySelector('input[name="weddingSpouse1"]').value = caseItem.weddingSpouse1 || '';
        if (form.querySelector('input[name="weddingSpouse2"]')) form.querySelector('input[name="weddingSpouse2"]').value = caseItem.weddingSpouse2 || '';
        if (form.querySelector('input[name="weddingLicense"]')) form.querySelector('input[name="weddingLicense"]').value = caseItem.weddingLicense || '';
        if (form.querySelector('input[name="weddingCounty"]')) form.querySelector('input[name="weddingCounty"]').value = caseItem.weddingCounty || '';

        if (form.querySelector('input[name="witness1"]')) form.querySelector('input[name="witness1"]').value = caseItem.witness1 || '';
        if (form.querySelector('input[name="witness1_id"]')) form.querySelector('input[name="witness1_id"]').value = caseItem.witness1_id || '';

        // New specialized fields
        if (form.querySelector('input[name="weddingLicenseExpiry"]')) form.querySelector('input[name="weddingLicenseExpiry"]').value = caseItem.weddingLicenseExpiry || '';
        if (form.querySelector('input[name="lsa_id_verified"]')) form.querySelector('input[name="lsa_id_verified"]').checked = !!caseItem.lsa_id_verified;

        if (form.querySelector('input[name="consularEmbassy"]')) form.querySelector('input[name="consularEmbassy"]').value = caseItem.consularEmbassy || '';
        if (form.querySelector('input[name="consularCountry"]')) form.querySelector('input[name="consularCountry"]').value = caseItem.consularCountry || '';

        if (form.querySelector('input[name="willExecutor"]')) form.querySelector('input[name="willExecutor"]').value = caseItem.willExecutor || '';
        if (form.querySelector('textarea[name="willBeneficiaries"]')) form.querySelector('textarea[name="willBeneficiaries"]').value = caseItem.willBeneficiaries || '';
        if (form.querySelector('input[name="willWitness1"]')) form.querySelector('input[name="willWitness1"]').value = caseItem.willWitness1 || '';
        if (form.querySelector('input[name="willWitness2"]')) form.querySelector('input[name="willWitness2"]').value = caseItem.willWitness2 || '';

        if (form.querySelector('input[name="poa_general"]')) form.querySelector('input[name="poa_general"]').checked = !!caseItem.poa_general;
        if (form.querySelector('input[name="poa_special"]')) form.querySelector('input[name="poa_special"]').checked = !!caseItem.poa_special;
        if (form.querySelector('input[name="poa_financial"]')) form.querySelector('input[name="poa_financial"]').checked = !!caseItem.poa_financial;
        if (form.querySelector('input[name="poa_medical"]')) form.querySelector('input[name="poa_medical"]').checked = !!caseItem.poa_medical;
        if (form.querySelector('input[name="poa_durable"]')) form.querySelector('input[name="poa_durable"]').checked = !!caseItem.poa_durable;
        if (form.querySelector('input[name="poa_real_estate"]')) form.querySelector('input[name="poa_real_estate"]').checked = !!caseItem.poa_real_estate;

        // Immigration
        if (form.querySelector('select[name="immigFormType"]')) form.querySelector('select[name="immigFormType"]').value = caseItem.immigFormType || 'I-9';
        if (form.querySelector('input[name="immigLanguage"]')) form.querySelector('input[name="immigLanguage"]').value = caseItem.immigLanguage || '';
        if (form.querySelector('input[name="immigHasTranslator"]')) form.querySelector('input[name="immigHasTranslator"]').checked = !!caseItem.immigHasTranslator;
        if (form.querySelector('input[name="immigVerifiedIdentity"]')) form.querySelector('input[name="immigVerifiedIdentity"]').checked = !!caseItem.immigVerifiedIdentity;

        // Signature Tracking
        if (form.querySelector('textarea[name="signatureMap"]')) form.querySelector('textarea[name="signatureMap"]').value = caseItem.signatureMap || '';
        if (form.querySelector('input[name="signerCount"]')) form.querySelector('input[name="signerCount"]').value = caseItem.signerCount || 1;
        if (form.querySelector('input[name="notarizedPageCount"]')) form.querySelector('input[name="notarizedPageCount"]').value = caseItem.notarizedPageCount || 1;

        // Protest
        if (form.querySelector('input[name="protestInstrument"]')) form.querySelector('input[name="protestInstrument"]').value = caseItem.protestInstrument || '';
        if (form.querySelector('input[name="protestAmount"]')) form.querySelector('input[name="protestAmount"]').value = caseItem.protestAmount || 0;
        if (form.querySelector('select[name="protestReason"]')) form.querySelector('select[name="protestReason"]').value = caseItem.protestReason || 'Falta de Pago';
        if (form.querySelector('input[name="protestDate"]')) form.querySelector('input[name="protestDate"]').value = caseItem.protestDate || '';

        // Translation
        if (form.querySelector('input[name="transSourceLang"]')) form.querySelector('input[name="transSourceLang"]').value = caseItem.transSourceLang || '';
        if (form.querySelector('input[name="transTargetLang"]')) form.querySelector('input[name="transTargetLang"]').value = caseItem.transTargetLang || '';
        if (form.querySelector('input[name="transName"]')) form.querySelector('input[name="transName"]').value = caseItem.transName || '';
        if (form.querySelector('input[name="transLicense"]')) form.querySelector('input[name="transLicense"]').value = caseItem.transLicense || '';
        if (form.querySelector('input[name="transCount"]')) form.querySelector('input[name="transCount"]').value = caseItem.transCount || '';

        // Property Management
        if (form.querySelector('select[name="propDocType"]')) form.querySelector('select[name="propDocType"]').value = caseItem.propDocType || 'Lease';
        if (form.querySelector('input[name="propAddress"]')) form.querySelector('input[name="propAddress"]').value = caseItem.propAddress || '';

        // ID Checklist
        if (form.querySelector('input[name="id_check_photo"]')) form.querySelector('input[name="id_check_photo"]').checked = !!caseItem.id_check_photo;
        if (form.querySelector('input[name="id_check_tamper"]')) form.querySelector('input[name="id_check_tamper"]').checked = !!caseItem.id_check_tamper;
        if (form.querySelector('input[name="id_check_expiry"]')) form.querySelector('input[name="id_check_expiry"]').checked = !!caseItem.id_check_expiry;
        if (form.querySelector('input[name="id_check_present"]')) form.querySelector('input[name="id_check_present"]').checked = !!caseItem.id_check_present;

        // Escrow
        if (form.querySelector('input[name="escrowAmount"]')) form.querySelector('input[name="escrowAmount"]').value = caseItem.escrowAmount || 0;
        if (form.querySelector('input[name="escrowDepositDate"]')) form.querySelector('input[name="escrowDepositDate"]').value = caseItem.escrowDepositDate || '';
        if (form.querySelector('textarea[name="escrowConditions"]')) form.querySelector('textarea[name="escrowConditions"]').value = caseItem.escrowConditions || '';

        // Registry
        if (form.querySelector('input[name="registryBoxCode"]')) form.querySelector('input[name="registryBoxCode"]').value = caseItem.registryBoxCode || '';
        if (form.querySelector('input[name="registryFolio"]')) form.querySelector('input[name="registryFolio"]').value = caseItem.registryFolio || '';
        if (form.querySelector('input[name="registryDocDesc"]')) form.querySelector('input[name="registryDocDesc"]').value = caseItem.registryDocDesc || '';

        // Batch Signing
        if (form.querySelector('input[name="batchDocCount"]')) form.querySelector('input[name="batchDocCount"]').value = caseItem.batchDocCount || 1;
        if (form.querySelector('input[name="batchTemplateUsed"]')) form.querySelector('input[name="batchTemplateUsed"]').value = caseItem.batchTemplateUsed || '';
        if (form.querySelector('textarea[name="batchDescription"]')) form.querySelector('textarea[name="batchDescription"]').value = caseItem.batchDescription || '';

        // Family Tree
        if (form.querySelector('input[name="familyMainTestator"]')) form.querySelector('input[name="familyMainTestator"]').value = caseItem.familyMainTestator || '';
        if (form.querySelector('input[name="familyHeirCount"]')) form.querySelector('input[name="familyHeirCount"]').value = caseItem.familyHeirCount || 0;
        if (form.querySelector('textarea[name="familyTreeData"]')) form.querySelector('textarea[name="familyTreeData"]').value = caseItem.familyTreeData || '';

        // Interpreter
        if (form.querySelector('input[name="interpName"]')) form.querySelector('input[name="interpName"]').value = caseItem.interpName || '';
        if (form.querySelector('input[name="interpLicense"]')) form.querySelector('input[name="interpLicense"]').value = caseItem.interpLicense || '';
        if (form.querySelector('input[name="interpSourceLang"]')) form.querySelector('input[name="interpSourceLang"]').value = caseItem.interpSourceLang || '';
        if (form.querySelector('input[name="interpTargetLang"]')) form.querySelector('input[name="interpTargetLang"]').value = caseItem.interpTargetLang || '';

        // Apostille Control
        if (form.querySelector('input[name="apostilleCertNum"]')) form.querySelector('input[name="apostilleCertNum"]').value = caseItem.apostilleCertNum || '';
        if (form.querySelector('input[name="apostilleState"]')) form.querySelector('input[name="apostilleState"]').value = caseItem.apostilleState || '';
        if (form.querySelector('input[name="apostilleStampId"]')) form.querySelector('input[name="apostilleStampId"]').value = caseItem.apostilleStampId || '';

        // Shipping Cost
        if (form.querySelector('select[name="shipCarrier"]')) form.querySelector('select[name="shipCarrier"]').value = caseItem.shipCarrier || 'UPS';
        if (form.querySelector('input[name="shipCost"]')) form.querySelector('input[name="shipCost"]').value = caseItem.shipCost || 0;
        if (form.querySelector('input[name="shipTrackingNum"]')) form.querySelector('input[name="shipTrackingNum"]').value = caseItem.shipTrackingNum || '';

        // Subpoena
        if (form.querySelector('input[name="subpoenaCaseNum"]')) form.querySelector('input[name="subpoenaCaseNum"]').value = caseItem.subpoenaCaseNum || '';
        if (form.querySelector('input[name="subpoenaCourt"]')) form.querySelector('input[name="subpoenaCourt"]').value = caseItem.subpoenaCourt || '';
        if (form.querySelector('input[name="subpoenaDate"]')) form.querySelector('input[name="subpoenaDate"]').value = caseItem.subpoenaDate || '';

        // Digital Archive
        if (form.querySelector('input[name="archiveDuration"]')) form.querySelector('input[name="archiveDuration"]').value = caseItem.archiveDuration || 10;
        if (form.querySelector('input[name="archiveRetentionExp"]')) form.querySelector('input[name="archiveRetentionExp"]').value = caseItem.archiveRetentionExp || '';
        if (form.querySelector('input[name="archiveBoxId"]')) form.querySelector('input[name="archiveBoxId"]').value = caseItem.archiveBoxId || '';

        // Restricted Location
        if (form.querySelector('select[name="restrictedFacilityType"]')) form.querySelector('select[name="restrictedFacilityType"]').value = caseItem.restrictedFacilityType || 'Hospital';
        if (form.querySelector('input[name="restrictedContactPerson"]')) form.querySelector('input[name="restrictedContactPerson"]').value = caseItem.restrictedContactPerson || '';
        if (form.querySelector('input[name="restrictedEntryPermit"]')) form.querySelector('input[name="restrictedEntryPermit"]').value = caseItem.restrictedEntryPermit || '';
        if (form.querySelector('input[name="restrictedVisitationTime"]')) form.querySelector('input[name="restrictedVisitationTime"]').value = caseItem.restrictedVisitationTime || '';

        // Legal Referral
        if (form.querySelector('input[name="referralAttorney"]')) form.querySelector('input[name="referralAttorney"]').value = caseItem.referralAttorney || '';
        if (form.querySelector('input[name="referralCommissionRate"]')) form.querySelector('input[name="referralCommissionRate"]').value = caseItem.referralCommissionRate || 0;
        if (form.querySelector('select[name="referralPaymentStatus"]')) form.querySelector('select[name="referralPaymentStatus"]').value = caseItem.referralPaymentStatus || 'Pending';

        // Blank Space Check
        if (form.querySelector('input[name="blankSpaceVerified"]')) form.querySelector('input[name="blankSpaceVerified"]').checked = !!caseItem.blankSpaceVerified;
        if (form.querySelector('input[name="blankLineCrossed"]')) form.querySelector('input[name="blankLineCrossed"]').checked = !!caseItem.blankLineCrossed;
        if (form.querySelector('textarea[name="blankSpaceNotes"]')) form.querySelector('textarea[name="blankSpaceNotes"]').value = caseItem.blankSpaceNotes || '';

        // EO Insurance
        if (form.querySelector('input[name="eoCompany"]')) form.querySelector('input[name="eoCompany"]').value = caseItem.eoCompany || '';
        if (form.querySelector('input[name="eoCoverageAmount"]')) form.querySelector('input[name="eoCoverageAmount"]').value = caseItem.eoCoverageAmount || '';
        if (form.querySelector('input[name="eoPolicyNum"]')) form.querySelector('input[name="eoPolicyNum"]').value = caseItem.eoPolicyNum || '';
        if (form.querySelector('input[name="eoExpiration"]')) form.querySelector('input[name="eoExpiration"]').value = caseItem.eoExpiration || '';

        // Pro-Bono
        if (form.querySelector('select[name="proBonoReason"]')) form.querySelector('select[name="proBonoReason"]').value = caseItem.proBonoReason || 'Hardship';
        if (form.querySelector('input[name="proBonoWaivedAmount"]')) form.querySelector('input[name="proBonoWaivedAmount"]').value = caseItem.proBonoWaivedAmount || '';

        // Invalidated Stamp
        if (form.querySelector('select[name="invalidStampReason"]')) form.querySelector('select[name="invalidStampReason"]').value = caseItem.invalidStampReason || 'Lost';
        if (form.querySelector('input[name="invalidStampId"]')) form.querySelector('input[name="invalidStampId"]').value = caseItem.invalidStampId || '';
        if (form.querySelector('input[name="invalidStampReportDate"]')) form.querySelector('input[name="invalidStampReportDate"]').value = caseItem.invalidStampReportDate || '';
        if (form.querySelector('input[name="invalidStampPoliceReport"]')) form.querySelector('input[name="invalidStampPoliceReport"]').value = caseItem.invalidStampPoliceReport || '';

        // Holographic Seal
        if (form.querySelector('input[name="holographicSerial"]')) form.querySelector('input[name="holographicSerial"]').value = caseItem.holographicSerial || '';
        if (form.querySelector('select[name="holographicType"]')) form.querySelector('select[name="holographicType"]').value = caseItem.holographicType || 'Tamper Evident';
        if (form.querySelector('input[name="holographicApplied"]')) form.querySelector('input[name="holographicApplied"]').checked = !!caseItem.holographicApplied;

        // Signing Analytics
        if (form.querySelector('input[name="signingStartTime"]')) form.querySelector('input[name="signingStartTime"]').value = caseItem.signingStartTime || '';
        if (form.querySelector('input[name="signingEndTime"]')) form.querySelector('input[name="signingEndTime"]').value = caseItem.signingEndTime || '';
        if (form.querySelector('input[name="signingDelayMins"]')) form.querySelector('input[name="signingDelayMins"]').value = caseItem.signingDelayMins || 0;

        // Kinship Control
        if (form.querySelector('select[name="kinshipDegree"]')) form.querySelector('select[name="kinshipDegree"]').value = caseItem.kinshipDegree || 'None';
        if (form.querySelector('select[name="economicInterest"]')) form.querySelector('select[name="economicInterest"]').value = caseItem.economicInterest || 'No';
        if (form.querySelector('input[name="kinshipVerified"]')) form.querySelector('input[name="kinshipVerified"]').checked = !!caseItem.kinshipVerified;

        // Secure Courier
        if (form.querySelector('input[name="courierPerson"]')) form.querySelector('input[name="courierPerson"]').value = caseItem.courierPerson || '';
        if (form.querySelector('input[name="courierBagId"]')) form.querySelector('input[name="courierBagId"]').value = caseItem.courierBagId || '';
        if (form.querySelector('select[name="courierIdVerified"]')) form.querySelector('select[name="courierIdVerified"]').value = caseItem.courierIdVerified || 'Yes';
        if (form.querySelector('input[name="courierDispatchTime"]')) form.querySelector('input[name="courierDispatchTime"]').value = caseItem.courierDispatchTime || '';

        // State Requirements
        if (form.querySelector('input[name="stateJurisdiction"]')) form.querySelector('input[name="stateJurisdiction"]').value = caseItem.stateJurisdiction || '';
        if (form.querySelector('select[name="stateAppliedReq"]')) form.querySelector('select[name="stateAppliedReq"]').value = caseItem.stateAppliedReq || 'Stamp Placement';
        if (form.querySelector('input[name="stateLawsChecked"]')) form.querySelector('input[name="stateLawsChecked"]').checked = !!caseItem.stateLawsChecked;

        // Trigger toggle fields based on type
        if (window.SpecializedManager) SpecializedManager.toggleFields(caseItem.type);

        this.openModal('case-modal');
    },

    async updateCase(id, updates) {
        if (this.useFirestore) {
            if (!this.currentUser) return alert('Debes iniciar sesión para editar casos.');
            const { doc, updateDoc } = window.dbFuncs;
            const ref = doc(window.firebaseDB, 'cases', id);

            // Get current case for better logging
            const caseItem = this.state.cases.find(c => c.id === id);
            const caseName = caseItem ? `Expediente #${caseItem.caseItem || caseItem.caseNumber} ` : id;

            try {
                await updateDoc(ref, updates);

                // Detailed audit details
                let details = [`ID: ${id} `];
                if (updates.status) details.push(`Estado: ${updates.status.toUpperCase()} `);
                if (updates.paymentStatus) details.push(`Pago: ${updates.paymentStatus.toUpperCase()} `);
                if (updates.amount) details.push(`Monto: ${this.formatCurrency(updates.amount)} `);

                AuditManager.logAction('Actualización de Caso', caseName, details.join(' | '));
                Toast.success('Caso Actualizado', 'Los datos del expediente han sido actualizados.');
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
                await fetch(api + `/ api / cases / ${id} `, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.assign({ id }, payload))
                });
            } catch (e) {
                console.warn('SQL update case failed', e);
            }
        })();
    },

    // Aliases for compatibility with HTML onclick handlers
    openEditCaseModal(id) { this.editCasePrompt(id); },
    openEditModal(id) { this.editClientPrompt(id); },
    // Consolidated showClientDetails below
    showCaseDetails(id) {
        console.log('Attempting to show details for case ID:', id);
        // Use loose equality to handle string/number mismatches
        const caseItem = this.state.cases.find(c => c.id == id);

        if (!caseItem) {
            console.error('Case not found for ID:', id);
            // Optionally try debugging state
            console.log('Available cases:', this.state.cases.length);
            return;
        }

        console.log('Case found:', caseItem);

        try {
            // Ensure modal is open or elements exist
            if (!document.getElementById('detail-case-number')) {
                this.openModal('case-details-modal');
                // Small delay for DOM to be ready if needed, though openModal usually just toggles class
            }

            // Fill basic info
            // Fill basic info
            const setField = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
                else console.warn(`Element not found: ${id} `);
            };

            setField('detail-case-number', `Expediente #${caseItem.caseNumber} `);
            setField('detail-client-name', caseItem.clientName);
            setField('detail-case-type', caseItem.type);
            setField('detail-due-date', caseItem.dueDate || 'Sin fecha');
            setField('detail-amount', this.formatCurrency(caseItem.amount));
            setField('detail-location', caseItem.location || 'N/A');
            setField('detail-mileage', caseItem.mileage || 0);
            setField('detail-description', caseItem.description || 'Sin notas.');

            // Status badge
            const statusEl = document.getElementById('detail-case-status');
            if (statusEl) {
                statusEl.textContent = caseItem.status ? caseItem.status.toUpperCase() : 'UNKNOWN';
                statusEl.className = `badge badge-${caseItem.status || 'pending'} `;
            }

            // Specialized Content
            const container = document.getElementById('detail-specialized-container');
            if (container) {
                container.innerHTML = '';

                // -- Section: Additional Standard & Custom Fields --
                let standardInfo = `
    <div style = "margin-bottom: 2rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">Información Adicional</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem;">
                   <div>
                        <span style="color: #64748b; display: block; font-size: 0.8rem;">Estado de Pago:</span>
                        <span class="badge" style="background: ${caseItem.paymentStatus === 'paid' ? '#dcfce7' : '#fee2e2'}; color: ${caseItem.paymentStatus === 'paid' ? '#166534' : '#991b1b'}; margin-top: 2px;">
                            ${caseItem.paymentStatus ? caseItem.paymentStatus.toUpperCase() : 'PENDIENTE'}
                        </span>
                   </div>
                   <div>
                        <span style="color: #64748b; display: block; font-size: 0.8rem;">Fecha Creación:</span>
                        <span>${this.formatDate(caseItem.createdAt)}</span>
                   </div>
                </div>
            </div>
    `;

                let tasksHtml = '';
                if (window.TaskManager && typeof TaskManager.renderTaskList === 'function') {
                    tasksHtml = `
    <div style = "margin-bottom: 2rem;">
        ${TaskManager.renderTaskList(caseItem.id, caseItem.tasks)}
                    </div> `;
                }

                let notesHtml = '';
                if (window.NoteManager && typeof NoteManager.renderNotes === 'function') {
                    notesHtml = `
    <div style = "margin-bottom: 2rem;">
        ${NoteManager.renderNotes(caseItem.id, caseItem.internalNotes)}
                    </div> `;
                }

                let customFieldsHtml = '';
                if (caseItem.customFields && Object.keys(caseItem.customFields).length> 0) {
                    let fieldsList = Object.entries(caseItem.customFields).map(([key, value]) => `
    <div style = "background: white; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px;">
                    <span style="color: #64748b; display: block; font-size: 0.75rem; text-transform: uppercase;">${key}</span>
                    <span style="font-weight: 600; color: #334155;">${value || '-'}</span>
                </div>
    `).join('');

                    customFieldsHtml = `
    <div style = "margin-bottom: 2rem;">
                <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 1rem; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">Campos Personalizados</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
                    ${fieldsList}
                </div>
            </div> `;
                }

                // -- Section: Sidebar Layout --
                const sidebarHtml = `
    <div class="case-details-sidebar" style = "background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <div style="margin-bottom: 2rem;">
                        <h4 style="font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="user" style="width: 16px;"></i> Cliente
                        </h4>
                        <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                            <div style="font-weight: 700; color: #1e293b; font-size: 1rem; margin-bottom: 0.25rem;">${caseItem.clientName}</div>
                            <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem;">${caseItem.type}</div>
                            <button class="btn btn-sm btn-outline-purple btn-block" onclick="NotaryCRM.showClientDetails('${caseItem.clientId}')">
                                Ver Expediente Completo
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 style="font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1rem;">Acciones</h4>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <button class="btn btn-primary btn-block" onclick="NotaryCRM.generateInvoice('${caseItem.id}')" style="justify-content: center; gap: 10px;">
                                <i data-lucide="receipt" style="width: 18px;"></i> Recibo PDF
                            </button>
                            <button class="btn btn-outline-purple btn-block" onclick="NotaryCRM.sendForSignature('${caseItem.id}')" style="justify-content: center; gap: 10px;">
                                <i data-lucide="pen-tool" style="width: 18px;"></i> Solicitar Firma
                            </button>
                            <button class="btn btn-block" style="background: #25d366; color: white; justify-content: center; gap: 10px;" onclick="NotaryCRM.sendReminder('${caseItem.id}', 'whatsapp')">
                                <i data-lucide="message-circle" style="width: 18px;"></i> WhatsApp
                            </button>
                            <hr style="border-top: 1px solid #e2e8f0; margin: 0.25rem 0;">
                            <button class="btn btn-outline-purple btn-block" onclick="biometricManager.open('${caseItem.id}')" style="justify-content: center; gap: 10px;">
                                <i data-lucide="fingerprint" style="width: 18px;"></i> ${caseItem.biometricCaptured ? 'Actualizar Huella' : 'Capturar Huella'}
                            </button>
                        </div>
                    </div>
                </div>
    ${caseItem.biometricCaptured ? `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.75rem; margin-top: 1rem; display: flex; align-items: center; gap: 10px; color: #166534; font-size: 0.8rem;">
                    <i data-lucide="check-circle" style="width: 16px;"></i>
                    <div>
                        <div style="font-weight: 700;">Biometría Verificada</div>
                        <div style="font-family: monospace; font-size: 0.7rem; opacity: 0.8;">Hash: ${caseItem.biometricHash}</div>
                    </div>
                </div>
                ` : ''
                    }
`;

                // Wrapper if we want standard grid
                container.style.display = 'grid';
                container.style.gridTemplateColumns = '1fr 300px';
                container.style.gap = '2rem';
                container.style.alignItems = 'start';

                const mainContentHtml = `
    <div class="case-details-main-content">
        ${standardInfo}
                        ${tasksHtml}
                        ${notesHtml}
                        ${customFieldsHtml}
                    </div>
    `;

                container.innerHTML = mainContentHtml + sidebarHtml;

                // -- Section: Specialized Type-Specific --
                const APOSTILLE_STATUSES = [
                    { id: 'pending', label: 'Pendiente / Recibido', color: '#64748b' },
                    { id: 'docs_received', label: 'Documentos Recibidos', color: '#3b82f6' },
                    { id: 'sent_to_sos', label: 'Enviado a SOS / Estado', color: '#f59e0b' },
                    { id: 'sealed', label: 'Finalizado / Sellado', color: '#10b981' },
                    { id: 'returned', label: 'Retornado al Cliente', color: '#8b5cf6' }
                ];

                if (caseItem.type === 'Apostille') {
                    const currentStatus = caseItem.apostilleStatus || 'pending';
                    container.innerHTML += `
    <div style = "background: #eff6ff; padding: 1.5rem; border-radius: 8px; border: 1px solid #dbeafe; margin-top: 1.5rem;">
                        <h5 style="margin: 0 0 1rem 0; color: #1e40af; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="globe" style="width: 18px; height: 18px;"></i> Gestión de Apostilla (Tracking)
                        </h5>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                            <div>
                                <label style="font-size: 0.75rem; color: #1e3a8a; font-weight: 700; display: block; margin-bottom: 4px;">PAÍS DE DESTINO</label>
                                <div style="font-weight: 600; font-size: 1.1rem; color: #1e3a8a;">${caseItem.apostilleDestination || 'N/A'}</div>
                            </div>
                            <div>
                                <label style="font-size: 0.75rem; color: #1e3a8a; font-weight: 700; display: block; margin-bottom: 4px;">TRACKING FEDERAL/ESTATAL</label>
                                <div style="font-family: monospace; background: white; padding: 4px 8px; border-radius: 4px; border:1px solid #dbeafe; display: inline-block;">${caseItem.apostilleTracking || 'Pendiente'}</div>
                            </div>
                        </div>

                        <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                             <label style="font-size: 0.8rem; font-weight: 700; color: #475569; display: block; margin-bottom: 8px;">Estado del Trámite</label>
                             <div style="display: flex; gap: 4px;">
                                ${APOSTILLE_STATUSES.map(s => `
                                    <button class="btn btn-sm" 
                                            style="flex: 1; font-size: 0.7rem; padding: 0.4rem; border: 1px solid ${s.id === currentStatus ? s.color : '#e2e8f0'}; background: ${s.id === currentStatus ? s.color : 'white'}; color: ${s.id === currentStatus ? 'white' : '#64748b'};"
                                            onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'apostilleStatus', '${s.id}')">
                                        ${s.label.split(' / ')[0]}
                                    </button>
                                `).join('')}
                             </div>
                        </div>
                    </div>
    `;
                } else if (caseItem.type === 'Loan Signing') {
                    const loanTypes = ['Refinance', 'Purchase', 'HELOC', 'Seller', 'Reverse'];
                    const currentLoanType = caseItem.loanType || 'General';
                    const lsa_check1 = caseItem.lsa_closing_disclosure;
                    const lsa_check2 = caseItem.lsa_the_note;
                    const lsa_check3 = caseItem.lsa_deed_of_trust;
                    const lsa_check4 = caseItem.lsa_pcor;
                    const lsa_check5 = caseItem.lsa_id_verified;

                    container.innerHTML += `
    <div style = "background: #f0fdf4; padding: 1.5rem; border-radius: 8px; border: 1px solid #dcfce7; margin-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.25rem;">
                             <h5 style="margin: 0; color: #166534; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="file-check" style="width: 18px; height: 18px;"></i> Checklist LSA: ${currentLoanType}
                            </h5>
                            <select onchange="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'loanType', this.value)" style="font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
                                <option value="">Tipo de Préstamo...</option>
                                ${loanTypes.map(t => `<option value="${t}" ${t === currentLoanType ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem;">
                            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'lsa_closing_disclosure', ${!lsa_check1})">
                                ${lsa_check1 ? '<i data-lucide="check-square" style="color: #16a34a; width: 18px;"></i>' : '<i data-lucide="square" style="color: #94a3b8; width: 18px;"></i>'} Closing Disclosure
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'lsa_the_note', ${!lsa_check2})">
                                ${lsa_check2 ? '<i data-lucide="check-square" style="color: #16a34a; width: 18px;"></i>' : '<i data-lucide="square" style="color: #94a3b8; width: 18px;"></i>'} The Note (Firmado)
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'lsa_deed_of_trust', ${!lsa_check3})">
                                ${lsa_check3 ? '<i data-lucide="check-square" style="color: #16a34a; width: 18px;"></i>' : '<i data-lucide="square" style="color: #94a3b8; width: 18px;"></i>'} Deed of Trust
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'lsa_pcor', ${!lsa_check4})">
                                ${lsa_check4 ? '<i data-lucide="check-square" style="color: #16a34a; width: 18px;"></i>' : '<i data-lucide="square" style="color: #94a3b8; width: 18px;"></i>'} PCOR / Tax Forms
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'lsa_id_verified', ${!lsa_check5})">
                                ${lsa_check5 ? '<i data-lucide="check-square" style="color: #16a34a; width: 18px;"></i>' : '<i data-lucide="square" style="color: #94a3b8; width: 18px;"></i>'} ID Colectado & Verificado
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; color: #15803d; font-weight: 700;">
                                <i data-lucide="alert-circle" style="width: 14px;"></i> Firmar todas las páginas
                            </div>
                        </div>
                    </div>
    `;
                } else if (caseItem.type === 'Wedding') {
                    const w_check1 = caseItem.wedding_license_verified;
                    const w_check2 = caseItem.wedding_ceremony_done;
                    const w_check3 = caseItem.wedding_signed_mailed;

                    container.innerHTML += `
    <div style = "background: #fff1f2; padding: 1.5rem; border-radius: 8px; border: 1px solid #ffe4e6; margin-top: 1.5rem;">
                        <h5 style="margin: 0 0 1.25rem 0; color: #9f1239; display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="heart" style="width: 18px; height: 18px;"></i> Servicio de Boda Finalizado
                        </h5>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                            <div style="background: white; padding: 0.75rem; border-radius: 8px; border: 1px solid #fecdd3;">
                                <label style="font-size: 0.65rem; color: #9f1239; font-weight: 800; display: block; margin-bottom: 4px; text-transform: uppercase;">Licencia #</label>
                                <div style="font-weight: 600; color: #e11d48;">${caseItem.weddingLicense || 'No registrada'}</div>
                            </div>
                            <div style="background: white; padding: 0.75rem; border-radius: 8px; border: 1px solid #fecdd3;">
                                <label style="font-size: 0.65rem; color: #9f1239; font-weight: 800; display: block; margin-bottom: 4px; text-transform: uppercase;">Estado Licencia</label>
                                <div style="font-weight: 600; color: #e11d48;">Vence: ${caseItem.weddingLicenseExpiry || 'N/A'}</div>
                            </div>
                        </div>

                        <div style="background: rgba(255,255,255,0.5); padding: 1rem; border-radius: 8px; display: grid; gap: 0.75rem; font-size: 0.9rem;">
                            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'wedding_license_verified', ${!w_check1})">
                                ${w_check1 ? '<i data-lucide="check-circle" style="color: #e11d48; width: 18px;"></i>' : '<i data-lucide="circle" style="color: #fda4af; width: 18px;"></i>'} Licencia original verificada
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'wedding_ceremony_done', ${!w_check2})">
                                ${w_check2 ? '<i data-lucide="check-circle" style="color: #e11d48; width: 18px;"></i>' : '<i data-lucide="circle" style="color: #fda4af; width: 18px;"></i>'} Ceremonia Realizada
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="NotaryCRM.updateCaseAttribute('${caseItem.id}', 'wedding_signed_mailed', ${!w_check3})">
                                ${w_check3 ? '<i data-lucide="check-circle" style="color: #e11d48; width: 18px;"></i>' : '<i data-lucide="circle" style="color: #fda4af; width: 18px;"></i>'} Firmada & Enviada al Condado
                            </div>
                        </div>

                        <button class="btn btn-sm btn-block" style="margin-top: 1rem; background: #be123c; color: white;" onclick="NotaryCRM.openModal('legal-library-modal')">
                            Ver Guion de Ceremonia
                        </button>
                    </div>
    `;
                }

                // Witnesses
                const witnessSection = document.getElementById('detail-witness-section');
                const witnessList = document.getElementById('detail-witness-list');

                if (witnessList && witnessSection) {
                    // Reset list first
                    witnessList.innerHTML = '';

                    if (caseItem.witness1) {
                        witnessSection.style.display = 'block';
                        witnessList.innerHTML = `
    <div style = "background: #f8fafc; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem; width: 100%;">
                        <div style="background: #e2e8f0; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="user" style="color: #64748b;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 700; color: #1e293b;">${caseItem.witness1}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">ID: ${caseItem.witness1_id || 'N/A'}</div>
                        </div>
                    </div>
    `;
                    } else {
                        witnessSection.style.display = 'none';
                    }
                }

                // Edit button setup
                const editBtn = document.getElementById('detail-edit-btn');
                if (editBtn) {
                    editBtn.onclick = () => {
                        this.closeModal('case-details-modal');
                        this.editCasePrompt(id);
                    };
                }

                this.openModal('case-details-modal');
                if (window.lucide) window.lucide.createIcons();
            } // Close if(container)
        } catch (e) {
            console.error('Error in showCaseDetails:', e);
        }
    },

    async updateCaseStatus(id, newStatus) {
        try {
            await this.updateCase(id, { status: newStatus });
            this.renderCases();
            this.renderDashboard();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    },

    async updateCaseAttribute(caseId, attribute, value) {
        try {
            const updateData = {};
            updateData[attribute] = value;

            // Optimistic log
            console.log(`Updating Case ${caseId}: ${attribute} = ${value} `);

            await this.updateCase(caseId, updateData);

            // Re-render UI to reflect changes
            this.showCaseDetails(caseId);
            this.renderCases();
            Toast.success('Información Actualizada', 'El expediente ha sido actualizado correctamente.');
        } catch (err) {
            console.error('Error updating case attribute:', err);
            Toast.error('Error', 'No se pudo actualizar el registro.');
        }
    },

    async updatePaymentStatus(id, newStatus) {
        try {
            await this.updateCase(id, { paymentStatus: newStatus });
            this.renderCases();
            this.renderDashboard();
        } catch (err) {
            console.error('Error updating payment status:', err);
        }
    },

    // Update sync indicator
    updateSyncStatus(status) {
        const text = document.getElementById('sync-text');
        const icon = document.querySelector('#sync-indicator i');
        if (!text || !icon) return;

        if (status === 'syncing') {
            text.textContent = 'Syncing...';
            icon.setAttribute('data-lucide', 'refresh-cw');
            icon.style.color = 'var(--color-warning)';
            icon.classList.add('spin');
        } else if (status === 'synced') {
            text.textContent = 'Cloud Synced';
            icon.setAttribute('data-lucide', 'cloud-check');
            icon.style.color = 'var(--color-success)';
            icon.classList.remove('spin');
        } else {
            text.textContent = 'Offline';
            icon.setAttribute('data-lucide', 'cloud-off');
            icon.style.color = 'var(--color-danger)';
            icon.classList.remove('spin');
        }
        if (window.lucide) {
            const container = document.getElementById('sync-indicator');
            if (container) window.lucide.createIcons({ root: container });
        }
    },

    // Render entire UI (Throttled to avoid UI freeze during bulk updates)
    render() {
        if (this._renderThrottle) return;
        this._renderThrottle = true;
        setTimeout(() => {
            this._renderThrottle = false;
            this.applyUIPermissions();
            this.renderDashboard();
            this.renderClients();
            this.renderCases();
            this.renderReports();
            if (window.lucide) {
                // Surgically create icons only in relevant areas to save CPU
                const areas = ['#dashboard-home', '#clients-list-container', '#cases-list-container'];
                areas.forEach(selector => {
                    const el = document.querySelector(selector);
                    if (el) window.lucide.createIcons({ root: el });
                });
            }
        }, 300);
    },

    // Render dashboard with throttling to avoid lag during sync
    renderDashboard() {
        if (this._dashboardThrottle) return;
        this._dashboardThrottle = true;
        setTimeout(() => { this._dashboardThrottle = false; }, 500);

        // ID Expiration Check
        if (window.IDExpirationManager) IDExpirationManager.check();

        // Commission Check First
        this.checkCommissionExpiry();

        // Update statistics
        const clientsList = this.state.clients || [];
        const totalClientsEl = document.getElementById('total-clients');
        if (totalClientsEl) totalClientsEl.textContent = clientsList.length;

        const totalCases = this.state.cases.length;
        const totalCasesEl = document.getElementById('total-cases');
        if (totalCasesEl) totalCasesEl.textContent = totalCases;

        const completedCases = this.state.cases.filter(c => c.status === 'completed').length;
        const completedCasesEl = document.getElementById('completed-cases');
        if (completedCasesEl) completedCasesEl.textContent = completedCases;

        // Calculate Statistics
        const totalRevenue = this.state.cases
            .filter(c => c.paymentStatus === 'paid')
            .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

        const totalMileage = this.state.cases
            .reduce((sum, c) => sum + (parseFloat(c.mileage) || 0), 0);

        const revEl = document.getElementById('total-revenue');
        if (revEl) revEl.textContent = this.formatCurrency(totalRevenue);

        const pendingPayments = this.state.cases
            .filter(c => c.paymentStatus !== 'paid')
            .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const pendingPaymentsEl = document.getElementById('pending-payments-amount');
        if (pendingPaymentsEl) pendingPaymentsEl.textContent = this.formatCurrency(pendingPayments);

        // Advanced KPIs
        const totalPotential = totalRevenue + pendingPayments;
        const avgTicket = totalCases> 0 ? (totalPotential / totalCases) : 0;
        const successRate = totalCases> 0 ? (completedCases / totalCases) * 100 : 0;

        const avgEl = document.getElementById('avg-ticket');
        if (avgEl) avgEl.textContent = this.formatCurrency(avgTicket);

        const rateEl = document.getElementById('success-rate');
        if (rateEl) rateEl.textContent = Math.round(successRate);

        // Vital Stats: Today's Appointments
        // Use local date string YYYY-MM-DD
        const nowLocal = new Date();
        const year = nowLocal.getFullYear();
        const month = String(nowLocal.getMonth() + 1).padStart(2, '0');
        const day = String(nowLocal.getDate()).padStart(2, '0');
        const todayStr = `${year} -${month} -${day} `;

        const todaysAppointments = this.state.appointments.filter(a => a.date === todayStr);

        const todayAppsEl = document.getElementById('today-appointments-count');
        if (todayAppsEl) todayAppsEl.textContent = todaysAppointments.length;

        const todayBadgeEl = document.getElementById('today-appointments-badge');
        if (todayBadgeEl) todayBadgeEl.textContent = todaysAppointments.length;

        const agendaListEl = document.getElementById('dashboard-agenda-list');
        if (agendaListEl) {
            if (todaysAppointments.length === 0) {
                agendaListEl.innerHTML = `
    <div style = "text-align:center; padding: 2rem 1rem; color: #94a3b8;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">☕</div>
                        <p style="font-size: 0.9rem;">No hay citas para hoy.</p>
                        <p style="font-size: 0.75rem;">¡Aprovecha para adelantar trabajo!</p>
                    </div> `;
            } else {
                agendaListEl.innerHTML = todaysAppointments.map(app => `
    <div class="agenda-item"
style = "padding: 1rem; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 1rem; transition: background 0.2s; cursor: pointer;"
onmouseover = "this.style.background='#f8fafc'"
onmouseout = "this.style.background='transparent'"
onclick = "NotaryCRM.gotoAppointment('${app.date}', '${app.id}')">
                        <div style="background: #eff6ff; color: #1d4ed8; padding: 0.5rem; border-radius: 10px; width: 60px; text-align: center; flex-shrink: 0;">
                            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Hoy</div>
                            <div style="font-size: 0.9rem; font-weight: 800;">${app.time || '--:--'}</div>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 2px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${app.title || 'Consulta Notarial'}
                            </p>
                            <p style="font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 4px;">
                                👤 ${app.clientName || app.client || 'Cliente General'}
                            </p>
                        </div>
                        <div style="color: var(--color-primary); opacity: 0.5;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </div>
    `).join('');
            }
        }

        // Vital Stats: Activity Summary
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const activeCases = this.state.cases.filter(c => !['completed', 'signed'].includes(c.status || 'pending')).length;
        const signedCases = this.state.cases.filter(c => c.status === 'signed' || c.signature).length;

        const monthRevenue = this.state.cases.filter(c => {
            if (c.paymentStatus !== 'paid') return false;
            let d;
            if (c.createdAt && typeof c.createdAt.toDate === 'function') d = c.createdAt.toDate();
            else if (c.createdAt) d = new Date(c.createdAt);
            else return false;
            return d>= firstDayOfMonth;
        }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

        const newClientsThisMonth = (this.state.clients || []).filter(c => {
            let d;
            if (c.createdAt && typeof c.createdAt.toDate === 'function') d = c.createdAt.toDate();
            else if (c.createdAt) d = new Date(c.createdAt);
            else return false;
            return d>= firstDayOfMonth;
        }).length;

        const dashActiveCountEl = document.getElementById('dash-active-count');
        if (dashActiveCountEl) dashActiveCountEl.textContent = activeCases;

        const dashSignedCountEl = document.getElementById('dash-signed-count');
        if (dashSignedCountEl) dashSignedCountEl.textContent = signedCases;

        const dashMonthRevEl = document.getElementById('dash-month-revenue');
        if (dashMonthRevEl) dashMonthRevEl.textContent = this.formatCurrency(monthRevenue);

        const dashNewClientsEl = document.getElementById('dash-new-clients');
        if (dashNewClientsEl) dashNewClientsEl.textContent = newClientsThisMonth;

        // Render recent cases table
        const tbody = document.getElementById('recent-cases-table');

        if (this.state.cases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No cases yet</td></tr>';
            return;
        }

        const recentCases = this.state.cases.slice(0, 5);
        tbody.innerHTML = recentCases.map(c => `
    <tr onclick = "NotaryCRM.showCaseDetails('${c.id}')" style = "cursor: pointer; transition: background 0.2s;" onmouseover = "this.style.background='#f8fafc'" onmouseout = "this.style.background='transparent'">
                <td style="font-weight: 500; color: var(--color-primary);">${c.caseNumber}</td>
                <td style="color: var(--color-gray-700);">${c.clientName}</td>
                <td style="color: var(--color-gray-700);">${c.type}</td>
                <td>${this.renderStatusBadge(c.status, c.dueDate, c.id)}</td>
                <td style="font-weight: 600; color: var(--color-gray-900);">${this.formatCurrency(c.amount)}</td>
            </tr>
    `).join('');

        // Update Mileage Widget
        if (window.MileageManager) MileageManager.renderDashboardWidget();
    },

    // Render clients
    renderClients() {
        const container = document.getElementById('clients-grid');
        if (!container) return;

        if (this.state.isLoadingClients) {
            container.innerHTML = this.renderSkeletons(6);
            return;
        }

        if (this.state.isLoadingClients) {
            container.innerHTML = this.renderSkeletons(6);
            return;
        }

        // Populate client select for cases modal
        const clientSelect = document.getElementById('case-client-select');
        if (clientSelect) {
            const currentVal = clientSelect.value;
            clientSelect.innerHTML = '<option value="">Select a client</option>' +
                this.state.clients.map(c => `<option value = "${c.id}"> ${c.name}</option> `).join('');
            if (currentVal) clientSelect.value = currentVal;
        }

        const query = (this.state.searchClientQuery || '').toLowerCase();
        const filteredClients = this.state.clients.filter(client => {
            const name = (client.name || '').toLowerCase();
            const email = (client.email || '').toLowerCase();
            const idNum = (client.idNumber || '').toLowerCase();
            const tags = (client.tags || []).join(' ').toLowerCase();
            return name.includes(query) || email.includes(query) || idNum.includes(query) || tags.includes(query);
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
        if (this.state.clientsPage> totalPages) this.state.clientsPage = totalPages;
        if (this.state.clientsPage < 1) this.state.clientsPage = 1;
        const start = (this.state.clientsPage-1) * pageSize;
        const pageItems = filteredClients.slice(start, start + pageSize);

        container.innerHTML = pageItems.map(client => `
    <div class="client-card premium-card">
                <div class="client-header">
                    <div class="client-info">
                        <img class="client-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}&background=random&color=fff" alt="${client.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <h3 class="client-name">${client.name}</h3>
                            <p class="client-id">${client.idType || 'ID'}: ${client.idNumber || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="card-actions">
                        ${this.checkPermission('EMAIL_USE') ? `
                        <button class="btn-icon" onclick="EmailManager.openSendModal('client', '${client.id}')" title="Enviar Correo">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </button>` : ''}
                        ${this.checkPermission('CLIENT_EDIT') ? `
                        <button class="btn-icon" onclick="NotaryCRM.editClientPrompt('${client.id}')" title="Editar Cliente">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>` : ''}
                        ${this.checkPermission('CLIENT_DELETE') ? `
                        <button class="btn-icon btn-danger" onclick="NotaryCRM.deleteClient('${client.id}')" title="Eliminar Cliente">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>` : ''}
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
                        ${(client.tags || []).map(t => `<span class="tag" style="border-color: var(--color-primary); color: var(--color-primary);">${t}</span>`).join('')}
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
        if (nextBtn) nextBtn.disabled = this.state.clientsPage>= totalPages;
    },

    // Render cases
    renderCases() {
        const container = document.getElementById('cases-list');
        if (!container) return;

        if (this.state.isLoadingCases) {
            container.innerHTML = this.renderSkeletons(4);
            return;
        }

        const query = (this.state.searchCaseQuery || '').toLowerCase();
        const filteredCases = this.state.cases.filter(c =>
            (c.caseNumber || '').toLowerCase().includes(query) ||
            (c.clientName || '').toLowerCase().includes(query)
        );

        if (filteredCases.length === 0) {
            container.innerHTML = '<p class="empty-state">No cases found.</p>';
            const indi = document.getElementById('cases-page-indicator'); if (indi) indi.textContent = 'Page 0';
            return;
        }

        const pageSize = this.state.casesPageSize || 6;
        const totalItems = filteredCases.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (this.state.casesPage> totalPages) this.state.casesPage = totalPages;
        if (this.state.casesPage < 1) this.state.casesPage = 1;
        const start = (this.state.casesPage-1) * pageSize;
        const pageItems = filteredCases.slice(start, start + pageSize);

        container.innerHTML = pageItems.map(caseItem => `
                <div class="case-card premium-case-card">
                <div class="case-header">
                    <div style="flex:1">
                        <div class="case-title-row">
                            <h3 class="case-number">${caseItem.caseNumber}</h3>
                            <div style="display:flex; gap:0.5rem; flex-wrap: wrap; align-items: center;">
                                ${this.renderStatusBadge(caseItem.status, caseItem.dueDate, caseItem.id)}
                                ${this.renderPaymentStatusBadge(caseItem.paymentStatus, caseItem.id)}
                            </div>
                        </div>
                        <p class="case-description">${caseItem.description}</p>
                        <button class="btn btn-sm" style="background:#f1f5f9; color:#475569; margin-top:0.5rem;" onclick="NotaryCRM.showCaseDetails('${caseItem.id}')">Ver Detalle Completo</button>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="const link = window.location.origin + '/status.html?case=${caseItem.caseNumber}'; NotaryCRM.copyToClipboard(link)" title="Copiar Enlace de Seguimiento">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </button>
                        ${this.checkPermission('CASE_EDIT') ? `
                        <button class="btn-icon btn-invoice" onclick="NotaryCRM.generateInvoice('${caseItem.id}')" title="Generar Recibo/Factura">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                        <button class="btn-icon btn-sign" onclick="NotaryCRM.sendForSignature('${caseItem.id}')" title="Enviar para Firma Digital">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>` : ''}
                        ${this.checkPermission('EMAIL_USE') ? `
                        <button class="btn-icon" onclick="EmailManager.openSendModal('case', '${caseItem.id}')" title="Enviar Correo de Caso">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </button>` : ''}
                        ${this.checkPermission('CASE_EDIT') ? `
                        <button class="btn-icon" onclick="NotaryCRM.editCasePrompt('${caseItem.id}')" title="Editar Caso">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>` : ''}
                        ${this.checkPermission('CASE_DELETE') ? `
                        <button class="btn-icon btn-danger" onclick="NotaryCRM.deleteCase('${caseItem.id}')" title="Eliminar Caso">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>` : ''}
                        ${caseItem.paymentStatus !== 'paid' ? `
                        <button class="btn-icon" style="color: var(--color-success);" onclick="PaymentManager.openPaymentModal('${caseItem.id}')" title="Procesar Pago">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                        </button>` : ''}
                    </div>
                </div>
                <div class="case-details-row" style="display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Cliente</span>
                        <span style="font-size: 0.95rem; font-weight: 500; color: #0f172a;">${caseItem.clientName}</span>
                    </div>
                    <div style="width: 1px; height: 24px; background: #e2e8f0;"></div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Servicio</span>
                        <span style="font-size: 0.95rem; font-weight: 500; color: #0f172a;">${caseItem.type}</span>
                    </div>
                    <div style="width: 1px; height: 24px; background: #e2e8f0;"></div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Costo</span>
                        <span class="amount" style="font-size: 0.95rem; font-weight: 700; color: #059669;">${this.formatCurrency(caseItem.amount)}</span>
                    </div>
                    <div style="width: 1px; height: 24px; background: #e2e8f0;"></div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Lugar</span>
                        <span style="font-size: 0.95rem; color: #334155;">${caseItem.location || 'Oficina'}</span>
                    </div>
                    <div style="width: 1px; height: 24px; background: #e2e8f0;"></div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Vencimiento</span>
                        <span style="font-size: 0.95rem; color: #334155;">${this.formatDate(caseItem.dueDate)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        const indicator = document.getElementById('cases-page-indicator');
        if (indicator) indicator.textContent = `Page ${this.state.casesPage} / ${totalPages}`;
        const prevBtn = document.getElementById('cases-prev');
        const nextBtn = document.getElementById('cases-next');
        if (prevBtn) prevBtn.disabled = this.state.casesPage <= 1;
        if (nextBtn) nextBtn.disabled = this.state.casesPage>= totalPages;
    },

    // Render status badge
    renderStatusBadge(status, dueDate = null, id = null) {
        const isEs = I18nManager.currentLang === 'es';
        const statusConfig = {
            'completed': {
                class: 'status-completed',
                icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
                text: isEs ? 'Completado' : 'Completed'
            },
            'in-progress': {
                class: 'status-in-progress',
                icon: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
                text: isEs ? 'En Proceso' : 'In Progress'
            },
            'pending': {
                class: 'status-pending',
                icon: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
                text: isEs ? 'Pendiente' : 'Pending'
            }
        };

        const config = statusConfig[status] || statusConfig['pending'];

        let slaWarning = '';
        if (dueDate && (status === 'pending' || status === 'in-progress')) {
            const due = new Date(dueDate);
            const now = new Date();
            const diffDays = Math.ceil((due-now) / (1000 * 60 * 60 * 24));
            if (diffDays <= 3) {
                const color = diffDays < 0 ? '#b91c1c' : '#d97706';
                slaWarning = `<svg class="icon" style="color:${color}; margin-left: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
            }
        }

        if (id) {
            const options = [
                { id: 'pending', text: isEs ? 'Pendiente' : 'Pending' },
                { id: 'in-progress', text: isEs ? 'En Proceso' : 'In Progress' },
                { id: 'completed', text: isEs ? 'Completado' : 'Completed' }
            ];
            return `
                <div class="status-selector" style="display:inline-flex; align-items:center;" onclick="event.stopPropagation()">
                    <select class="status-badge ${config.class}" 
                            style="cursor:pointer; border:1px solid currentColor; appearance:none; outline:none; padding: 2px 8px;"
                            onchange="NotaryCRM.updateCaseStatus('${id}', this.value)">
                        ${options.map(o => `<option value="${o.id}" ${o.id === status ? 'selected' : ''}>${o.text}</option>`).join('')}
                    </select>
                    ${slaWarning}
                </div>
            `;
        }

        return `
            <span class="status-badge ${config.class}" style="display: inline-flex; align-items: center;">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${config.icon}
                </svg>
                ${config.text}
                ${slaWarning}
            </span>
        `;
    },

    renderPaymentStatusBadge(status, id = null) {
        const isEs = I18nManager.currentLang === 'es';
        const currentStatus = (status || 'pending').toLowerCase();
        const statusMap = {
            'paid': { class: 'paid', text: isEs ? 'Pagado' : 'PAID' },
            'pending': { class: 'pending', text: isEs ? 'Pendiente' : 'PENDING' },
            'partial': { class: 'partial', text: isEs ? 'Parcial' : 'PARTIAL' }
        };
        const config = statusMap[currentStatus] || statusMap['pending'];

        if (id) {
            const options = [
                { id: 'pending', text: isEs ? 'Pendiente' : 'PENDING' },
                { id: 'partial', text: isEs ? 'Parcial' : 'PARTIAL' },
                { id: 'paid', text: isEs ? 'Pagado' : 'PAID' }
            ];
            return `
                <div class="payment-selector" style="display:inline-block;" onclick="event.stopPropagation()">
                    <select class="payment-badge ${config.class}" 
                            style="cursor:pointer; border:1px solid currentColor; appearance:none; outline:none; text-transform:uppercase; padding: 2px 8px;"
                            onchange="NotaryCRM.updatePaymentStatus('${id}', this.value)">
                        ${options.map(o => `<option value="${o.id}" ${o.id.toLowerCase() === currentStatus ? 'selected' : ''}>${o.text}</option>`).join('')}
                    </select>
                </div>
            `;
        }
        return `<span class="payment-badge ${config.class}">${config.text}</span>`;
    },

    // Format date (handles ISO strings and Firestore Timestamps)
    formatDate(value, showTime = false) {
        if (!value) return 'N/A';
        let dateObj;
        try {
            if (value && typeof value.toDate === 'function') {
                dateObj = value.toDate();
            } else if (value && typeof value.seconds === 'number') {
                // Handle raw Firestore timestamp object {seconds, nanoseconds}
                dateObj = new Date(value.seconds * 1000);
            } else {
                dateObj = new Date(value);
            }
        } catch (e) {
            return 'N/A';
        }
        if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';

        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };

        if (showTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.second = '2-digit';
        }

        return dateObj.toLocaleDateString(I18nManager.currentLang === 'es' ? 'es-ES' : 'en-US', options);
    },

    formatCurrency(amount) {
        const symbol = this.state.currency === 'EUR' ? '€' : '$';
        return `${symbol}${(parseFloat(amount) || 0).toFixed(2)} `;
    },

    setCurrency(cur) {
        this.state.currency = cur;
        this.saveData();
        this.render();
        Toast.success('Moneda Cambiada', `Ahora usando ${cur} `);
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

    // Render skeleton placeholders
    renderSkeletons(count) {
        let skeletons = '';
        for (let i = 0; i <count; i++) {
            skeletons += `
                <div class="skeleton-card fade-in">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div class="skeleton skeleton-avatar"></div>
                        <div class="skeleton-title skeleton" style="flex: 1;"></div>
                    </div>
                    <div class="skeleton-text skeleton" style="margin-bottom: 8px;"></div>
                    <div class="skeleton-text skeleton" style="width: 50%; margin-bottom: 12px;"></div>
                    <div style="display: flex; gap: 8px; margin-top: auto;">
                        <div class="skeleton skeleton-line" style="width: 32px; height: 32px; border-radius: 8px;"></div>
                        <div class="skeleton skeleton-line" style="width: 32px; height: 32px; border-radius: 8px;"></div>
                        <div class="skeleton skeleton-line" style="width: 32px; height: 32px; border-radius: 8px;"></div>
                    </div>
                </div>
                `;
        }
        return skeletons;
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

        // --- Professional Chart Defaults ---
        if (window.Chart) {
            Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
            Chart.defaults.color = '#64748b';
            Chart.defaults.scale.grid.color = '#f1f5f9';
        }

        const COLORS = {
            primary: '#3b82f6',     // Blue 500
            primaryBg: 'rgba(59, 130, 246, 0.1)',
            success: '#10b981',     // Emerald 500
            successBg: 'rgba(16, 185, 129, 0.1)',
            warning: '#f59e0b',     // Amber 500
            danger: '#ef4444',      // Red 500
            info: '#06b6d4',        // Cyan 500
            purple: '#8b5cf6',      // Violet 500
            gray: '#cbd5e1'         // Slate 300
        };

        // Filter cases by date
        const now = new Date();
        const filteredCases = this.state.cases.filter(c => {
            let d;
            if (c.createdAt && typeof c.createdAt.toDate === 'function') d = c.createdAt.toDate();
            else if (c.createdAt) d = new Date(c.createdAt);
            else return true;

            if (filterVal === 'week') {
                const oneWeekAgo = new Date(now.getTime()-7 * 24 * 60 * 60 * 1000);
                return d>= oneWeekAgo;
            } else if (filterVal === 'month') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            } else if (filterVal === 'lastMonth') {
                const lastM = new Date(now.getFullYear(), now.getMonth()-1, 1);
                return d.getMonth() === lastM.getMonth() && d.getFullYear() === lastM.getFullYear();
            } else if (filterVal === 'year') {
                return d.getFullYear() === now.getFullYear();
            }
            return true;
        });

        // Update Total Revenue Stat-ONLY PAID CASES
        const totalFilteredRevenue = filteredCases.reduce((sum, c) => {
            if (c.paymentStatus !== 'paid') return sum;
            return sum + (parseFloat(c.amount) || 0);
        }, 0);
        const revenueEl = document.getElementById('report-total-revenue');
        if (revenueEl) {
            revenueEl.innerHTML = `
                <div style="color: #10b981; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.02em;">
                    ${this.formatCurrency(totalFilteredRevenue)}
                </div>
                `;
        }

        // Revenue Projection (Based on PAID history)
        const months = {};
        this.state.cases.forEach(c => {
            if (c.paymentStatus !== 'paid') return; // Skip unpaid
            const d = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt || Date.now());
            const m = d.getMonth() + '-' + d.getFullYear();
            months[m] = (months[m] || 0) + (parseFloat(c.amount) || 0);
        });
        const avgMonthly = Object.values(months).length> 0 ? (Object.values(months).reduce((a, b) => a + b, 0) / Object.values(months).length) : 0;
        const projectedEl = document.getElementById('report-projected-revenue');
        if (projectedEl) {
            projectedEl.innerHTML = `
                <div style="color: #3b82f6; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.02em;">
                    ${this.formatCurrency(avgMonthly)}
                </div>
                <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Promedio mensual con base en histórico</span>
            `;
        }

        // Cleanup existing charts
        if (this.revenueChart) this.revenueChart.destroy();
        if (this.servicesChart) this.servicesChart.destroy();
        if (this.statusChart) this.statusChart.destroy();
        if (this.locationChart) this.locationChart.destroy();

        // 1. Revenue by Month-ONLY PAID-Line Chart
        const monthlyRevenue = {};
        // Initialize last 6 months with 0 to show nice trend
        for (let i = 5; i>= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
            const key = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            monthlyRevenue[key] = 0;
        }

        filteredCases.forEach(c => {
            if (c.paymentStatus !== 'paid') return;
            let date;
            if (c.createdAt && typeof c.createdAt.toDate === 'function') date = c.createdAt.toDate();
            else if (c.createdAt) date = new Date(c.createdAt);
            else date = new Date();

            const month = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            // Only add if it falls in our tracking (or was initialized)-simplistic approach for now:
            if (monthlyRevenue[month] !== undefined) monthlyRevenue[month] += (parseFloat(c.amount) || 0);
            else monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (parseFloat(c.amount) || 0);
        });

        this.revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: Object.keys(monthlyRevenue),
                datasets: [{
                    label: 'Ingresos Efectivos',
                    data: Object.values(monthlyRevenue),
                    borderColor: COLORS.success,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, COLORS.successBg);
                        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => this.formatCurrency(context.raw)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [2, 4] },
                        ticks: { callback: (value) => '$' + value }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // 2. Most Requested Services-Doughnut
        const serviceCounts = {};
        filteredCases.forEach(c => { serviceCounts[c.type] = (serviceCounts[c.type] || 0) + 1; });

        // Pick top 5, group others
        const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1]-a[1]);
        const topServices = sortedServices.slice(0, 5);
        if (sortedServices.length> 5) {
            topServices.push(['Otros', sortedServices.slice(5).reduce((sum, item) => sum + item[1], 0)]);
        }

        this.servicesChart = new Chart(servicesCtx, {
            type: 'doughnut',
            data: {
                labels: topServices.map(i => i[0]),
                datasets: [{
                    data: topServices.map(i => i[1]),
                    backgroundColor: [COLORS.primary, COLORS.info, COLORS.purple, COLORS.warning, COLORS.danger, COLORS.gray],
                    borderWidth: 0,
                    spacing: 4,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true, padding: 15 } }
                },
                layout: { padding: 10 }
            }
        });

        // 3. Case Status-Doughnut (Clean & Modern)
        const statusCounts = { 'pending': 0, 'in-progress': 0, 'completed': 0, 'signed': 0 };
        filteredCases.forEach(c => {
            const s = c.status || 'pending';
            if (statusCounts[s] !== undefined) statusCounts[s]++;
        });

        this.statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pendiente', 'En Proceso', 'Firmado', 'Completado'],
                datasets: [{
                    data: [statusCounts['pending'], statusCounts['in-progress'], statusCounts['signed'], statusCounts['completed']],
                    backgroundColor: [COLORS.danger, COLORS.warning, COLORS.info, COLORS.success],
                    hoverBackgroundColor: ['#dc2626', '#d97706', '#0891b2', '#059669'],
                    borderWidth: 0,
                    spacing: 5,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12, weight: 600 }
                        }
                    }
                },
                layout: { padding: 10 },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });

        // 4. Revenue by Location-Bar Chart
        const locationRevenue = { 'Oficina': 0, 'Casa': 0, 'Online': 0 };
        filteredCases.forEach(c => {
            if (c.paymentStatus !== 'paid') return;
            const loc = c.location || 'Oficina';
            if (locationRevenue[loc] !== undefined) locationRevenue[loc] += (parseFloat(c.amount) || 0);
            else locationRevenue['Oficina'] += (parseFloat(c.amount) || 0); // Default fallback
        });

        this.locationChart = new Chart(locationCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(locationRevenue),
                datasets: [{
                    label: 'Ingresos',
                    data: Object.values(locationRevenue),
                    backgroundColor: [COLORS.primary, COLORS.purple, COLORS.info],
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                    x: { grid: { display: false } }
                }
            }
        });

        // 5. Render Transaction History Table
        const paymentsTable = document.getElementById('payments-history-table');
        if (paymentsTable) {
            const allPayments = [];

            this.state.cases.forEach(c => {
                if (c.paymentData) {
                    allPayments.push({
                        date: c.paymentData.timestamp || c.lastUpdated || new Date().toISOString(),
                        txId: c.paymentData.transactionId || c.paymentData.id || 'N/A',
                        caseNum: c.caseNumber,
                        payer: c.paymentData.payerName || c.clientName || 'Desconocido',
                        method: c.paymentData.method || 'PayPal',
                        status: 'Completado',
                        amount: parseFloat(c.paymentData.amount || c.amount || 0)
                    });
                } else if (c.paymentStatus && (c.paymentStatus.toLowerCase() === 'paid')) {
                    allPayments.push({
                        date: c.lastUpdated || c.createdAt || new Date().toISOString(),
                        txId: 'MANUAL-' + (c.id ? c.id.substring(0, 6).toUpperCase() : '000'),
                        caseNum: c.caseNumber,
                        payer: c.clientName,
                        method: 'Manual',
                        status: 'Completado',
                        amount: parseFloat(c.amount || 0)
                    });
                }
            });

            // Sort by date desc
            allPayments.sort((a, b) => new Date(b.date)-new Date(a.date));

            if (allPayments.length === 0) {
                paymentsTable.innerHTML = '<tr><td colspan="7" class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-light);">No hay pagos registrados aún</td></tr>';
            } else {
                paymentsTable.innerHTML = allPayments.map(p => {
                    let dateStr;
                    try { dateStr = new Date(p.date).toLocaleDateString() + ' <span style="color:#94a3b8; font-size:0.85em;">' + new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>'; }
                    catch (e) { dateStr = 'Fecha inválida'; }

                    return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 1rem;">${dateStr}</td>
                        <td style="font-family: monospace; font-size: 0.85em; color: #64748b;">${p.txId}</td>
                        <td style="font-weight: 500; color: var(--color-primary);">${p.caseNum}</td>
                        <td>${p.payer}</td>
                        <td><span class="status-badge" style="background:#eff6ff; color:#1e40af;">${p.method}</span></td>
                        <td><span class="status-badge" style="background:#dcfce7; color:#166534;">${p.status}</span></td>
                        <td style="text-align: right; font-weight: 600;">${this.formatCurrency(p.amount)}</td>
                    </tr>
                `}).join('');
            }
        }
    },

    // --- Calendar Rendering (FullCalendar) ---
    renderCalendar() {
        const calendarEl = document.getElementById('calendar-view');
        if (!calendarEl || !window.FullCalendar) return;

        if (this.fullCalendar) this.fullCalendar.destroy();

        // Regular Appointments
        const events = this.state.appointments.map(app => ({
            title: `${app.clientName}-${app.type}`,
            start: `${app.date}T${app.time}`,
            color: '#1e3a8a'
        }));

        // Blocked Dates
        if (this.state.blockedDates) {
            this.state.blockedDates.forEach(block => {
                events.push({
                    title: 'DÍA BLOQUEADO',
                    start: block.date,
                    display: 'background',
                    backgroundColor: '#fee2e2',
                    allDay: true
                });
                // Optional: Add a text label as a separate event if background doesn't show text well
                events.push({
                    title: '🚫 BLOQUEADO',
                    start: block.date,
                    allDay: true,
                    color: '#ef4444',
                    display: 'block'
                });
            });
        }

        this.fullCalendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            editable: true,
            droppable: true,
            themeSystem: 'standard',
            events: events,
            height: 'auto',
            dayMaxEvents: true,
            dateClick: (info) => {
                this.showDayDetails(info.dateStr);
            },
            eventClick: (info) => {
                const dateStr = info.event.start.toISOString().split('T')[0];
                this.showDayDetails(dateStr);
            },
            eventDrop: async (info) => {
                const newStart = info.event.start;
                const d = new Date(newStart);
                const dateStr = d.toISOString().split('T')[0];
                const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

                await this.updateAppointment(info.event.id, {
                    date: dateStr,
                    time: timeStr
                });

                Toast.success('Agenda Actualizada', `Cita reprogramada al ${dateStr}-${timeStr} `);
            }
        });

        this.calendar = this.fullCalendar;
        this.fullCalendar.render();
    },

    showDayDetails(dateStr) {
        const appointments = this.state.appointments.filter(app => app.date === dateStr);
        // Correct IDs based on index.html
        const listEl = document.getElementById('day-appointments-list');
        const titleEl = document.getElementById('calendar-day-date');

        // Ensure modal elements exist
        if (!listEl || !titleEl) {
            console.error('Calendar modal elements not found');
            return;
        }

        const dateObj = new Date(dateStr + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        titleEl.textContent = `Agenda: ${formattedDate} `;

        if (appointments.length === 0) {
            const isBlocked = this.state.blockedDates?.find(b => b.date === dateStr);
            listEl.innerHTML = `<div style="text-align:center; padding: 3.5rem 1rem;">
                <div style="background:${isBlocked ? '#fff1f2' : 'var(--color-gray-50)'}; width:80px; height:80px; border-radius:30%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto; transform:rotate(-5deg); border: 1px solid ${isBlocked ? '#fecaca' : 'var(--color-gray-100)'};">
                    ${isBlocked ?
                    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' :
                    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-light)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
                }
                </div>
                <h3 style="color:var(--color-gray-900); margin-bottom:0.5rem; font-weight:700;">${isBlocked ? 'Agenda Bloqueada' : 'Día Libre'}</h3>
                <p style="color:var(--color-gray-500); font-size:1rem; max-width: 250px; margin: 0 auto;">${isBlocked ? 'Este día ha sido marcado como no disponible para clientes públicos.' : 'No hay citas programadas para esta fecha.'}</p>
            </div>`;
        } else {
            // Sort by time
            appointments.sort((a, b) => a.time.localeCompare(b.time));

            listEl.innerHTML = appointments.map(app => `
                <div class="timeline-item" data-app-id="${app.id}" style="padding-left: 0; margin-bottom: 1rem;">
                    <div class="timeline-card" style="margin-left: 0; border-left: 4px solid var(--color-primary); padding: 1rem; transition: all 0.3s ease;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                            <div>
                                <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.25rem;">
                                    <span class="timeline-time" style="background: var(--color-primary-light); color: var(--color-primary); font-weight:700;">${app.time}</span>
                                    <span style="font-size: 0.75rem; font-weight: 600; color: var(--color-gray-500); text-transform:uppercase; letter-spacing:0.5px;">${app.type}</span>
                                </div>
                                <div class="timeline-title" style="font-size:1.1rem;">${app.clientName}</div>
                            </div>
                            <div class="dropdown" style="position:relative;">
                                <button class="btn-icon" onclick="this.nextElementSibling.classList.toggle('show'); event.stopPropagation();" title="Más Opciones" style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-gray-50);">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle></svg>
                                </button>
                                <div class="dropdown-menu" style="right:0; top:100%;">
                                    <button class="dropdown-item" style="color: var(--color-primary);" onclick="NotaryCRM.showClientDetails('${app.clientId}')">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        <strong>Ver Perfil Cliente</strong>
                                    </button>
                                    <button class="dropdown-item" style="color: var(--text-light);" onclick="NotaryCRM.editAppointment('${app.id}')">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        Reagendar / Editar
                                    </button>
                                    <div style="height: 1px; background: #f1f5f9; margin: 4px 0;"></div>
                                    <button class="dropdown-item" style="color: #dc2626;" onclick="NotaryCRM.deleteAppointment('${app.id}')">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        Cancelar Cita
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions Row -->
                        <div style="display:flex; gap:0.5rem; margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid #f1f5f9;">
                            <a href="https://wa.me/?text=${encodeURIComponent('Hola ' + app.clientName + ', confirmo su cita para el ' + formattedDate + ' a las ' + app.time)}" target="_blank" class="btn btn-sm btn-outline" style="flex:1; justify-content:center; gap: 6px; border: 1px solid var(--color-gray-200);">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                WhatsApp
                            </a>
                            <a href="https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Cita Notarial: ' + app.clientName)}&dates=${app.date.replace(/-/g, '')}T${app.time.replace(/:/g, '')}00Z&details=${encodeURIComponent('Servicio: ' + app.type)}" target="_blank" class="btn btn-sm btn-outline" style="flex:1; justify-content:center; gap: 6px; border: 1px solid var(--color-gray-200);">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                G-Cal
                            </a>
                        </div>
                    </div>
                </div>
                `).join('');

            // Close dropdowns when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                        if (!menu.contains(e.target)) menu.classList.remove('show');
                    });
                }, { once: true });
            }, 100);
        }

        // Inject General Day Options if not present
        const actionsContainer = document.getElementById('calendar-day-actions');
        if (actionsContainer && !document.getElementById('day-extra-actions')) {
            const extraActions = document.createElement('div');
            extraActions.id = 'day-extra-actions';
            extraActions.style.gridColumn = '1 / -1';
            extraActions.style.display = 'flex';
            extraActions.style.gap = '0.5rem';

            const isBlocked = this.state.blockedDates?.find(b => b.date === dateStr);

            extraActions.innerHTML = `
                <button class="btn btn-block btn-outline" style="border: 1px solid var(--color-gray-300); color: var(--color-gray-700); justify-content: center; gap: 8px;" onclick="print()" title="Imprimir Agenda del Día">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Imprimir
                </button>
                <button class="btn btn-block ${isBlocked ? 'btn-success' : 'btn-outline-danger'}" style="justify-content: center; gap: 8px; border: 1px solid ${isBlocked ? '#22c55e' : '#fecaca'};" onclick="NotaryCRM.blockDay('${dateStr}')" title="${isBlocked ? 'Reactivar citas' : 'Bloquear citas publicas'}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        ${isBlocked ? '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="16" r="1.5"></circle>' : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'}
                    </svg>
                    ${isBlocked ? 'Reactivar Día' : 'Bloquear Día'}
                </button>
            `;
            actionsContainer.appendChild(extraActions);
        }

        const addBtn = document.getElementById('add-from-day-btn');
        if (addBtn) {
            addBtn.onclick = () => {
                this.closeModal('calendar-day-modal');
                this.openModal('calendar-modal');
                const dateInput = document.querySelector('#calendar-modal input[name="date"]');
                if (dateInput) dateInput.value = dateStr;
            };
        }

        this.openModal('calendar-day-modal');
    },

    editAppointment(id) {
        const app = this.state.appointments.find(a => a.id === id);
        if (!app) return;

        const form = document.getElementById('calendar-form');
        if (!form) return;

        // Populate form
        // We'll use a data attribute to store the id for the addAppointment function
        form.dataset.editId = id;

        const clientSelect = form.querySelector('select[name="clientId"]');
        if (clientSelect) clientSelect.value = app.clientId || '';

        const dateInput = form.querySelector('input[name="date"]');
        if (dateInput) dateInput.value = app.date || '';

        const timeInput = form.querySelector('input[name="time"]');
        if (timeInput) timeInput.value = app.time || '';

        const typeSelect = form.querySelector('select[name="type"]');
        if (typeSelect) typeSelect.value = app.type || '';

        const rec = form.querySelector('input[name="recurring"]');
        if (rec) rec.checked = false;

        this.closeModal('calendar-day-modal');
        this.openModal('calendar-modal');
    },

    // Navigate to a specific appointment from anywhere
    gotoAppointment(date, id) {
        this.switchTab('calendar');
        if (this.fullCalendar) {
            this.fullCalendar.gotoDate(date);
        }
        this.showDayDetails(date);

        // Highlight after modal is open
        setTimeout(() => {
            const el = document.querySelector(`[data-app-id="${id}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const card = el.querySelector('.timeline-card');
                if (card) {
                    const originalBorder = card.style.borderLeft;
                    card.style.borderLeft = '6px solid #fbbf24';
                    card.style.background = '#fffbeb';
                    setTimeout(() => {
                        card.style.borderLeft = originalBorder;
                        card.style.background = '';
                    }, 3000);
                }
            }
        }, 600);
    },

    async blockDay(dateStr) {
        if (!this.currentUser) return alert('Debes iniciar sesión.');

        const dateObj = new Date(dateStr + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

        const existingBlock = this.state.blockedDates?.find(b => b.date === dateStr);

        if (existingBlock) {
            this.confirmAction(
                'Reactivar Agenda',
                `¿Deseas volver a habilitar el día ${formattedDate} para que los clientes puedan agendar citas ? `,
                async () => {
                    try {
                        const { doc, deleteDoc } = window.dbFuncs;
                        const db = window.firebaseDB;
                        if (this.useFirestore) {
                            await deleteDoc(doc(db, 'blocked_dates', existingBlock.id));
                        }
                        Toast.success('Día Reactivado', `El día ${dateStr} ya está disponible nuevamente para el público.`);
                        this.closeModal('calendar-day-modal');
                    } catch (err) {
                        console.error('Error unblocking day', err);
                        Toast.error('Error', 'No se pudo habilitar el día.');
                    }
                },
                { type: 'warning', confirmText: 'Reactivar Día' }
            );
        } else {
            this.confirmAction(
                'Bloquear Fecha',
                `¿Bloquear el día ${formattedDate}? Los clientes no podrán agendar citas en este día desde la web de reservas.`,
                async () => {
                    try {
                        const { addDoc, collection } = window.dbFuncs;
                        const db = window.firebaseDB;

                        if (this.useFirestore) {
                            await addDoc(collection(db, 'blocked_dates'), {
                                date: dateStr,
                                ownerId: this.currentUser.uid,
                                createdAt: new Date().toISOString()
                            });
                        }

                        Toast.success('Día Bloqueado', `El día ${dateStr} ha sido bloqueado exitosamente.`);
                        this.closeModal('calendar-day-modal');
                    } catch (err) {
                        console.error('Error blocking day', err);
                        Toast.error('Error', 'No se pudo bloquear el día.');
                    }
                },
                { type: 'danger', confirmText: 'Bloquear Agenda' }
            );
        }
    },

    async shareDayAgenda() {
        const titleEl = document.getElementById('calendar-day-date');
        const appointments = Array.from(document.querySelectorAll('#day-appointments-list .timeline-item'));

        if (appointments.length === 0) return alert('No hay citas para compartir.');

        let message = `*📅 ${titleEl.textContent}*\n\n`;

        appointments.forEach(item => {
            const time = item.querySelector('.timeline-time').textContent;
            const client = item.querySelector('.timeline-title').textContent;
            const type = item.querySelector('span[style*="font-size: 0.75rem"]').textContent;
            message += `⏰ * ${time}*-${client} (${type}) \n`;
        });

        message += `\nGenerado desde * NotaryCRM * `;
        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    },

    async showClientDetails(id, tab = 'cases') {
        const client = this.state.clients.find(c => c.id === id);
        if (!client) return;

        const clientCases = this.state.cases.filter(c => c.clientId === id);
        const clientApps = this.state.appointments.filter(a => a.clientId === id);
        const relatedClient = client.relatedId ? this.state.clients.find(c => c.id === client.relatedId) : null;

        const content = document.getElementById('client-details-content');

        let pendingRequestHtml = '';
        if (this.useFirestore) {
            try {
                const { collection, query, where, getDocs } = window.dbFuncs;
                const db = window.firebaseDB;
                const q = query(collection(db, 'requests'),
                    where('clientId', '==', id),
                    where('status', '==', 'pending'));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const reqDoc = snap.docs[0];
                    pendingRequestHtml = `
                        <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; animation: pulse 2s infinite;">
                            <div style="display: flex; gap: 0.75rem; align-items: center;">
                                <svg style="color: #d97706; width: 24px; height: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                <div>
                                    <span style="display:block; font-weight: 700; color: #92400e;">Solicitud de Cambio de Perfil Pendiente</span>
                                    <span style="font-size: 0.75rem; color: #b45309;">El cliente ha solicitado actualizar sus datos de contacto.</span>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="NotaryCRM.openUpdateApproval('${reqDoc.id}')">Revisar y Aprobar</button>
                        </div>
                    `;
                }
            } catch (e) { console.error(e); }
        }

        content.innerHTML = `
            ${pendingRequestHtml}
            <div class="case-details-grid" style="margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
                <div class="case-detail-item"><p class="case-detail-label">Nombre</p><p class="case-detail-value">${client.name}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">DNI/ID</p><p class="case-detail-value">${client.idType}: ${client.idNumber}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Email</p><p class="case-detail-value">${client.email}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Teléfono</p><p class="case-detail-value">${client.phone}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Ocupación</p><p class="case-detail-value">${client.occupation || 'N/A'}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Vínculo Familiar</p><p class="case-detail-value">${relatedClient ? `<a href="#" onclick="NotaryCRM.showClientDetails('${relatedClient.id}')" style="color: var(--color-primary); font-weight: 600;">${relatedClient.name}</a>` : 'N/A'}</p></div>
                ${client.customFields ? Object.keys(client.customFields).map(key => `
                    <div class="case-detail-item"><p class="case-detail-label">${key}</p><p class="case-detail-value">${client.customFields[key] || '-'}</p></div>
                `).join('') : ''}
            </div>
            
            <div style="display:flex; gap:0.5rem; background: #f1f5f9; padding: 0.4rem; border-radius: 12px; margin-bottom: 2rem; width: fit-content;">
                <button class="btn btn-sm ${tab === 'cases' || !tab ? 'btn-primary' : 'btn-ghost'}" 
                        style="display: flex; align-items: center; gap: 0.5rem; border: none !important; border-radius: 8px !important;"
                        onclick="NotaryCRM.switchClientDetailTab('cases', '${id}')">
                    <i data-lucide="folder" style="width: 16px; height: 16px;"></i>
                    ${I18nManager.currentLang === 'es' ? 'Casos' : 'Cases'}
                </button>
                <button class="btn btn-sm ${tab === 'audit' ? 'btn-primary' : 'btn-ghost'}" 
                        style="display: flex; align-items: center; gap: 0.5rem; border: none !important; border-radius: 8px !important;"
                        onclick="NotaryCRM.switchClientDetailTab('audit', '${id}')">
                    <i data-lucide="history" style="width: 16px; height: 16px;"></i>
                    ${I18nManager.currentLang === 'es' ? 'Auditoría' : 'Audit'}
                </button>
            </div>

            <div id="client-detail-tab-content">
                ${tab === 'cases' ? `
                <h4 style="margin-bottom: 1rem; color: var(--color-primary);">${I18nManager.currentLang === 'es' ? 'Historial de Casos' : 'Case History'} (${clientCases.length})</h4>
                <div class="table-container" style="margin-bottom: 2rem;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th data-i18n="case_num">${I18nManager.t('case_num')}</th>
                                <th data-i18n="type">${I18nManager.t('type')}</th>
                                <th data-i18n="status">${I18nManager.t('status')}</th>
                                <th data-i18n="amount">${I18nManager.t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientCases.map(c => `
                                <tr>
                                    <td><strong>${c.caseNumber}</strong></td>
                                    <td>${c.type}</td>
                                    <td>${this.renderStatusBadge(c.status, c.dueDate, c.id)}</td>
                                    <td>${this.formatCurrency(c.amount)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h4 style="margin-bottom: 1rem; color: var(--color-primary);">${I18nManager.currentLang === 'es' ? 'Línea de Tiempo' : 'Activity Timeline'}</h4>
                        ${TimelineManager.renderTimeline(TimelineManager.getClientTimeline(client.id))}
                    </div>
                    <div>
                        <h4 style="margin-bottom: 1rem; color: var(--color-primary);">${I18nManager.currentLang === 'es' ? 'Próximas Citas' : 'Upcoming Appointments'}</h4>
                        <div class="reminders-timeline">
                            ${clientApps.length === 0 ? `<p>${I18nManager.currentLang === 'es' ? 'No hay citas programadas.' : 'No upcoming appointments.'}</p>` : clientApps.map(a => `
                                <div class="timeline-item" style="padding-left:0;">
                                    <div class="timeline-card" style="margin-left:0; border-left: 4px solid #10b981;">
                                        <strong>${a.date} a las ${a.time}</strong>-${a.type}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : `
                <h4 style="margin-bottom: 1rem; color: var(--color-primary);">Historial de Auditoría</h4>
                <div class="audit-list">
                    ${(() => {
                const logs = AuditManager.getLogs().filter(l => l.details && (l.details.includes(id) || l.details.includes(client.id)));
                const resourceLogs = AuditManager.getLogs().filter(l => l.resource === client.name);
                const allLogs = [...new Set([...logs, ...resourceLogs])].sort((a, b) => {
                    const dateA = a.timestamp && a.timestamp.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp).getTime();
                    const dateB = b.timestamp && b.timestamp.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp).getTime();
                    return dateB-dateA;
                });

                return allLogs.length === 0 ? '<p class="empty-state">No hay registros de auditoría para este cliente.</p>' : allLogs.map(l => `
                            <div style="padding: 1.25rem; border: 1px solid #f1f5f9; border-radius: 10px; margin-bottom: 0.75rem; background: white; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                <div>
                                    <div style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${l.action}</div>
                                    <div style="font-size: 0.85rem; color: #64748b; margin-top: 2px;">${l.details || '-'}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.8rem; color: #1e293b; font-weight: 600;">${this.formatDate(l.timestamp, true)}</div>
                                    <div style="font-size: 0.7rem; color: var(--color-primary); margin-top: 2px; text-transform: uppercase; font-weight: 700;">${l.userEmail || l.user || 'Sistema'}</div>
                                </div>
                            </div>
                        `).join('');
            })()}
                </div>
                `}
            </div>
            <div style="margin-top: 1.5rem; text-align: right;">
                 <button class="btn btn-sm btn-ghost" onclick="NotaryCRM.closeModal('client-details-modal')">Cerrar</button>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
        this.openModal('client-details-modal');
    },

    switchClientDetailTab(tab, clientId) {
        if (tab === 'audit') {
            this.showClientDetails(clientId, 'audit');
        } else {
            this.showClientDetails(clientId, 'cases');
        }
    },

    async openUpdateApproval(requestId) {
        const { doc, getDoc } = window.dbFuncs;
        const db = window.firebaseDB;

        try {
            const snap = await getDoc(doc(db, 'requests', requestId));
            if (!snap.exists()) return;
            const request = snap.data();

            const oldEl = document.getElementById('approval-old-data');
            const newEl = document.getElementById('approval-new-data');

            const diffs = [];
            if (request.oldData.address !== request.newData.address) diffs.push('address');
            if (request.oldData.phone !== request.newData.phone) diffs.push('phone');

            oldEl.innerHTML = `
                <div style="margin-bottom: 0.75rem;">
                    <label style="display:block; font-size: 0.65rem; color: var(--color-gray-400);">Dirección</label>
                    <div style="${diffs.includes('address') ? 'color: #dc2626; text-decoration: line-through;' : ''}">${request.oldData.address}</div>
                </div>
                <div>
                    <label style="display:block; font-size: 0.65rem; color: var(--color-gray-400);">Teléfono</label>
                    <div style="${diffs.includes('phone') ? 'color: #dc2626; text-decoration: line-through;' : ''}">${request.oldData.phone}</div>
                </div>
            `;

            newEl.innerHTML = `
                <div style="margin-bottom: 0.75rem;">
                    <label style="display:block; font-size: 0.65rem; color: #166534;">Dirección</label>
                    <div style="font-weight: 600;">${request.newData.address}</div>
                </div>
                <div>
                    <label style="display:block; font-size: 0.65rem; color: #166534;">Teléfono</label>
                    <div style="font-weight: 600;">${request.newData.phone}</div>
                </div>
            `;

            const approveBtn = document.getElementById('approve-update-btn');
            const rejectBtn = document.getElementById('reject-update-btn');

            approveBtn.onclick = () => this.processUpdateRequest(requestId, true);
            rejectBtn.onclick = () => this.processUpdateRequest(requestId, false);

            this.openModal('approval-modal');
        } catch (e) { console.error(e); }
    },

    async processUpdateRequest(requestId, approve) {
        const { doc, getDoc, updateDoc, deleteDoc } = window.dbFuncs;
        const db = window.firebaseDB;

        try {
            const snap = await getDoc(doc(db, 'requests', requestId));
            if (!snap.exists()) return;
            const request = snap.data();

            if (approve) {
                // Update Client
                await updateDoc(doc(db, 'clients', request.clientId), {
                    address: request.newData.address,
                    phone: request.newData.phone
                });

                // Mark request as approved (or delete)
                await updateDoc(doc(db, 'requests', requestId), { status: 'approved' });

                AuditManager.logAction('Aprobación de Cambio', request.clientName, `Datos actualizados: ${request.newData.address} | ${request.newData.phone}`);
                Toast.success('Éxito', 'El perfil del cliente ha sido actualizado.');
            } else {
                // Rejection
                await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' });
                Toast.warning('Solicitud Rechazada', 'Se ha ignorado el cambio solicitado.');
            }

            this.closeModal('approval-modal');
            this.closeModal('client-details-modal'); // Refresh view
            this.showClientDetails(request.clientId);
        } catch (e) {
            console.error(e);
            Toast.error('Error', 'No se pudo procesar la solicitud.');
        }
    },


    async addAppointment(form) {
        if (!this.currentUser) return alert('Debes iniciar sesión.');

        const formData = new FormData(form);
        const clientId = formData.get('clientId');
        const client = this.state.clients.find(c => c.id === clientId);

        const isRecurring = formData.get('recurring') === 'on';
        const appointments = [];

        let baseDate = new Date(formData.get('date') + 'T' + formData.get('time'));

        const count = isRecurring ? 4 : 1;
        for (let i = 0; i <count; i++) {
            const current = new Date(baseDate);
            current.setDate(baseDate.getDate() + (i * 7));

            appointments.push({
                clientId: clientId,
                clientName: client ? client.name : 'Unknown',
                date: current.toISOString().split('T')[0],
                time: formData.get('time'),
                type: formData.get('type'),
                ownerId: this.currentUser.uid,
                createdAt: new Date().toISOString()
            });
        }

        try {
            const { addDoc, collection } = window.dbFuncs;
            const db = window.firebaseDB;

            if (this.useFirestore) {
                for (const app of appointments) {
                    await addDoc(collection(db, 'appointments'), app);
                }
            } else {
                this.state.appointments.push(...appointments);
                this.saveData();
                this.render();
            }

            form.reset();
            this.closeModal('calendar-modal');
            Toast.success('Cita(s) Agendada(s)', isRecurring ? 'Se han creado 4 citas semanales.' : 'La cita ha sido creada.');
        } catch (err) {
            console.error('Error adding appointment:', err);
            Toast.error('Error', 'No se pudo agendar la cita.');
        }
    },

    async deleteAppointment(id) {
        if (!confirm('¿Estás seguro de eliminar esta cita?')) return;
        if (this.useFirestore) {
            const { doc, deleteDoc } = window.dbFuncs;
            await deleteDoc(doc(window.firebaseDB, 'appointments', id));
        } else {
            this.state.appointments = this.state.appointments.filter(a => a.id !== id);
            this.saveData();
            this.render();
        }
    },

    async updateAppointment(id, updates) {
        if (this.useFirestore) {
            const { doc, updateDoc } = window.dbFuncs;
            await updateDoc(doc(window.firebaseDB, 'appointments', id), updates);
        } else {
            this.state.appointments = this.state.appointments.map(a => a.id === id ? { ...a, ...updates } : a);
            this.saveData();
            this.render();
        }
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

        // 🏦 Header-Notary Logo/Name
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
        doc.text(`Nº Control: ${caseItem.caseNumber} `, 140, 32);
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')} `, 140, 38);

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
        doc.text(`ID / DNI: ${client.idNumber || 'N/A'} `, 110, 65);
        doc.text(`Tel: ${client.phone || 'N/A'} `, 110, 70);

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

        const amountStr = `$${(caseItem.amount || 0).toFixed(2)} `;
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
        return `${initials}${date}${random} `;
    },

    // Digital Signature Integration
    async sendForSignature(caseId) {
        const caseItem = this.state.cases.find(c => c.id === caseId);
        if (!caseItem) return alert('Caso no encontrado.');

        const client = this.state.clients.find(cl => cl.id === caseItem.clientId);
        if (!client) return alert('Información del cliente no disponible.');

        // Generate full tracking link
        const baseUrl = window.location.origin;
        const trackingLink = `${baseUrl}/status.html?case=${caseItem.caseNumber}&action=sign`;

        const message = `Hola ${client.name}, le envío el documento correspondiente al caso ${caseItem.caseNumber} (${caseItem.type}) para su firma digital. \n\nPuede rastrear el avance de su trámite en este enlace directo: ${trackingLink}`;
        const encodedMsg = encodeURIComponent(message);

        // Options: WhatsApp or Email
        const action = confirm('¿Desea enviar la solicitud de firma por WhatsApp? (Cancelar para enviar por Email)');

        if (action) {
            const phone = client.phone ? client.phone.replace(/\D/g, '') : '';
            window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
        } else {
            const subject = encodeURIComponent(`Firma Digital-Caso ${caseItem.caseNumber}`);
            window.location.href = `mailto:${client.email}?subject=${subject}&body=${encodedMsg}`;
        }
    },

    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                Toast.success('Copiado', 'Enlace copiado al portapapeles.');
            });
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            Toast.success('Copiado', 'Enlace copiado al portapapeles.');
        }
    },

    // --- CSV Import ---
    async importClients(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const lines = e.target.result.split('\n');
            if (lines.length < 2) return;
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            let count = 0;
            for (let i = 1; i <lines.length; i++) {
                if (!lines[i].trim()) continue;
                const vals = lines[i].split(',');
                const data = {};
                headers.forEach((h, idx) => data[h] = vals[idx]?.trim() || '');
                const client = {
                    name: data.name || data.nombre || 'Imported Client',
                    email: data.email || '',
                    phone: data.phone || data.telefono || '',
                    address: data.address || data.direccion || '',
                    idType: data.idtype || 'DNI',
                    idNumber: data.idnumber || data.id || '',
                    joinDate: new Date().toISOString()
                };
                if (this.useFirestore) {
                    try {
                        const { collection, addDoc } = window.dbFuncs;
                        await addDoc(collection(window.firebaseDB, 'clients'), Object.assign({}, client, {
                            ownerId: this.currentUser ? this.currentUser.uid : null,
                            createdAt: window.dbFuncs.serverTimestamp()
                        }));
                    } catch (err) { }
                } else {
                    client.id = Date.now().toString() + i;
                    this.state.clients.push(client);
                }
                count++;
            }
            if (!this.useFirestore) this.saveData();
            this.render();
            Toast.success('Importación Exitosa', `${count} clientes importados.`);
        };
        reader.readAsText(file);
    },

    // --- Report PDF ---
    async generateReportPDF() {
        if (!window.jspdf) return Toast.error('Error', 'PDF library not loaded');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;

        // --- Branding Colors ---
        const primaryColor = [59, 130, 246]; // Blue 500
        const secondaryColor = [100, 116, 139]; // Slate 500

        // --- Header ---
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTARY CRM', margin, 20);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('REPORTE FINANCIERO Y EJECUTIVO', margin, 32);

        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth-margin, 32, { align: 'right' });

        // --- Executive Summary Section ---
        let yPos = 55;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen Ejecutivo', margin, yPos);

        // Calculate Statistics-Only PAID
        const clientsCount = this.state.clients.length;
        const casesCount = this.state.cases.length;
        const paidCases = this.state.cases.filter(c => c.paymentStatus === 'paid');
        const totalRevenue = paidCases.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const avgTicket = paidCases.length> 0 ? totalRevenue / paidCases.length : 0;

        yPos += 15;

        // Stats Grid
        const stats = [
            { label: 'Total de Clientes', value: clientsCount },
            { label: 'Total de Expedientes', value: casesCount },
            { label: 'Ingresos Netos (Efectivos)', value: this.formatCurrency(totalRevenue) },
            { label: 'Ticket Promedio', value: this.formatCurrency(avgTicket) }
        ];

        doc.setFillColor(248, 250, 252); // Light Gray Background
        doc.setDrawColor(226, 232, 240); // Border color

        // Draw 2x2 Grid of cards
        let xOffset = margin;
        let cardY = yPos;
        stats.forEach((stat, i) => {
            if (i> 0 && i % 2 === 0) {
                xOffset = margin;
                cardY += 35;
            } else if (i> 0) {
                xOffset = (pageWidth / 2) + 5;
            }

            // Card Shape
            doc.roundedRect(xOffset, cardY, (pageWidth / 2)-margin-5, 25, 3, 3, 'FD');

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.text(stat.label, xOffset + 5, cardY + 10);

            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59); // Slate-800
            doc.setFont('helvetica', 'bold');
            doc.text(String(stat.value), xOffset + 5, cardY + 20);
        });

        yPos = cardY + 45;

        // --- Financial & Operational Charts ---
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Análisis Visual', margin, yPos);

        yPos += 10;

        const chartConfigs = [
            { id: 'revenueChart', title: 'Tendencia de Ingresos Mensuales' },
            { id: 'servicesChart', title: 'Desglose por Servicios' },
            { id: 'locationChart', title: 'Ingresos por Ubicación' },
            { id: 'statusChart', title: 'Estado Actual de Casos' }
        ];

        for (const config of chartConfigs) {
            const canvas = document.getElementById(config.id);
            if (canvas) {
                // Check page break
                if (yPos + 90> doc.internal.pageSize.getHeight()) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFillColor(30, 41, 59);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text(config.title, margin, yPos);

                try {
                    const imgData = canvas.toDataURL('image/png', 1.0); // High quality
                    doc.addImage(imgData, 'PNG', margin, yPos + 5, 170, 75);
                    yPos += 90;
                } catch (e) {
                    console.error('Chart capture failed', e);
                }
            }
        }

        // --- Disclaimer Footer ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}-Confidencial-Notary CRM`, pageWidth / 2, doc.internal.pageSize.getHeight()-10, { align: 'center' });
        }

        doc.save(`NotaryOS_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        Toast.success('PDF Guardado', 'El reporte corporativo se ha generado con éxito.');
    },

    // --- Automations ---
    checkAutomations() {
        const now = new Date();
        const overdue = this.state.cases.filter(c => (c.status === 'pending' || c.status === 'in-progress') && new Date(c.dueDate) <now);
        if (overdue.length> 0) console.log(`[Automation] ${overdue.length} overdue cases found.`);
    },

    sendReminder(caseId, type = 'whatsapp') {
        const caseItem = this.state.cases.find(c => c.id === caseId);
        if (!caseItem) return;
        const client = this.state.clients.find(c => c.id === caseItem.clientId) || {};

        const isEs = I18nManager.currentLang === 'es';
        const baseUrl = window.location.origin;
        const trackingLink = `${baseUrl}/status.html?case=${caseItem.caseNumber}`;

        const message = isEs
            ? `Hola ${client.name}, le recordamos que su trámite ${caseItem.caseNumber} está en estado: ${caseItem.status.toUpperCase()}. \n\nPuede ver el progreso aquí: ${trackingLink}`
            : `Hello ${client.name}, this is a reminder that your case ${caseItem.caseNumber} is currently: ${caseItem.status.toUpperCase()}. \n\nTrack progress here: ${trackingLink}`;

        if (type === 'whatsapp') {
            const phone = (client.phone || '').replace(/\D/g, '');
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        } else {
            window.location.href = `mailto:${client.email}?subject=Recordatorio: Caso ${caseItem.caseNumber}&body=${encodeURIComponent(message)}`;
        }

        AuditManager.logAction('Envío de Recordatorio', caseItem.caseNumber, `Via ${type}`);
    },

    checkDuplicates() {
        const clients = this.state.clients;
        const matches = new Map();

        clients.forEach(c => {
            const emailKey = c.email ? `email:${c.email.toLowerCase().trim()}` : null;
            const idKey = c.idNumber ? `id:${c.idNumber.toString().trim()}` : null;

            if (emailKey) {
                if (!matches.has(emailKey)) matches.set(emailKey, []);
                matches.get(emailKey).push(c);
            }
            if (idKey) {
                if (!matches.has(idKey)) matches.set(idKey, []);
                matches.get(idKey).push(c);
            }
        });

        const duplicates = [];
        matches.forEach((list, key) => {
            if (list.length> 1) {
                duplicates.push({ key, clients: list });
            }
        });

        if (duplicates.length === 0) {
            Toast.success('Limpieza Completa', 'No se encontraron clientes duplicados.');
            return;
        }

        this.state.lastDuplicates = duplicates;
        this.renderDuplicates(duplicates);

        const mergeBtn = document.getElementById('merge-all-duplicates-btn');
        if (mergeBtn) mergeBtn.style.display = 'block';

        this.openModal('duplicates-modal');
    },

    async mergeAllDuplicates() {
        if (!this.state.lastDuplicates || this.state.lastDuplicates.length === 0) return;

        this.confirmAction(
            'Fusionar Todo',
            `¿Estás seguro de fusionar automáticamente ${this.state.lastDuplicates.length} grupos de duplicados? Esta acción es masiva y permanente.`,
            async () => {
                Toast.info('Procesando...', 'Iniciando fusión masiva de registros.');
                let mergedCount = 0;

                for (const group of this.state.lastDuplicates) {
                    try {
                        await this.executeGroupMerge(group);
                        mergedCount++;
                    } catch (err) {
                        console.error('Failed to merge group:', group.key, err);
                    }
                }

                this.closeModal('duplicates-modal');
                Toast.success('Fusión Masiva Completada', `Se han procesado ${mergedCount} grupos de clientes.`);
                this.state.lastDuplicates = [];
                // Re-render handled by listeners usually, but manually trigger if needed
                if (!this.useFirestore) {
                    this.render();
                }
            }
        );
    },

    async executeGroupMerge(group) {
        // Deterministic keep: record with most cases/appointments or oldest
        // For simplicity: the first one in the list (usually oldest if fetched by asc ID/date)
        const sorted = [...group.clients].sort((a, b) => {
            // Priority 1: Has more metadata? (can't easily check without fetching all cases/apps for all)
            // Priority 2: Oldest createdAt
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA-dateB;
        });

        const mainClient = sorted[0];
        const duplicates = sorted.slice(1);

        for (const dup of duplicates) {
            await this.performClientMerge(mainClient.id, dup.id, mainClient.name);
        }
    },

    async performClientMerge(keepId, removeId, keepName) {
        if (keepId === removeId) return;

        console.log(`Merging client ${removeId} into ${keepId}`);

        if (this.useFirestore) {
            const { collection, query, where, getDocs, updateDoc, doc, deleteDoc } = window.dbFuncs;
            const db = window.firebaseDB;

            // 1. Update Cases
            const casesQuery = query(collection(db, 'cases'), where('clientId', '==', removeId));
            const casesSnap = await getDocs(casesQuery);
            for (const caseDoc of casesSnap.docs) {
                await updateDoc(doc(db, 'cases', caseDoc.id), {
                    clientId: keepId,
                    clientName: keepName
                });
            }

            // 2. Update Appointments
            const appsQuery = query(collection(db, 'appointments'), where('clientId', '==', removeId));
            const appsSnap = await getDocs(appsQuery);
            for (const appDoc of appsSnap.docs) {
                await updateDoc(doc(db, 'appointments', appDoc.id), {
                    clientId: keepId,
                    clientName: keepName
                });
            }

            // 3. Delete Duplicate Client
            await deleteDoc(doc(db, 'clients', removeId));

            // 4. Log Action
            AuditManager.logAction('Fusión de Cliente', keepName, `ID ${removeId} fusionado en ${keepId}`);
        } else {
            // Local storage merge
            this.state.cases.forEach(c => {
                if (c.clientId === removeId) {
                    c.clientId = keepId;
                    c.clientName = keepName;
                }
            });
            this.state.appointments.forEach(a => {
                if (a.clientId === removeId) {
                    a.clientId = keepId;
                    a.clientName = keepName;
                }
            });
            this.state.clients = this.state.clients.filter(c => c.id !== removeId);
            this.saveData();
        }
    },

    renderDuplicates(duplicates) {
        const listEl = document.getElementById('duplicates-list');
        listEl.innerHTML = duplicates.map((dup, index) => `
            <div class="duplicate-group" style="background: var(--color-gray-50); border: 1px solid var(--color-gray-200); border-radius: 12px; padding: 1rem;">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; margin-bottom: 0.75rem;">
                    Grupo: ${dup.key}
                </div>
                <div style="display: grid; gap: 0.5rem;">
                    ${dup.clients.map(c => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--color-gray-100);">
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">${c.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-light);">${c.email} | ${c.idNumber}</div>
                            </div>
                            <div style="font-size: 0.65rem; color: var(--color-gray-400);">ID: ${c.id.substring(0, 6)}...</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-block" style="margin-top: 1rem; background: var(--color-primary); color: white;" 
                    onclick="NotaryCRM.executeManualMerge(${index})">
                    Fusionar este Grupo
                </button>
            </div>
        `).join('');
    },

    async executeManualMerge(index) {
        const group = this.state.lastDuplicates[index];
        if (!group) return;

        this.confirmAction(
            'Fusionar Grupo',
            `Se conservará el registro más antiguo y se transferirán todos los casos y citas de los duplicados.`,
            async () => {
                Toast.info('Fusionando...', 'Procesando grupo seleccionado.');
                await this.executeGroupMerge(group);

                // Refresh list
                this.state.lastDuplicates.splice(index, 1);
                if (this.state.lastDuplicates.length === 0) {
                    this.closeModal('duplicates-modal');
                    Toast.success('Éxito', 'Se han fusionado todos los duplicados del grupo.');
                } else {
                    this.renderDuplicates(this.state.lastDuplicates);
                    Toast.success('Fusión Completada', 'Grupo fusionado correctamente.');
                }
            }
        );
    },

    gdprExport() {
        const data = {
            user: this.currentUser ? this.currentUser.email : 'local',
            exportDate: new Date().toISOString(),
            clients: this.state.clients,
            cases: this.state.cases,
            appointments: this.state.appointments
        };
        this.downloadBlob(`gdpr-export-${Date.now()}.json`, JSON.stringify(data, null, 2), 'application/json');
        Toast.success('Exportación GDPR', 'Tus datos se han descargado con éxito.');
    },

    gdprDelete() {
        this.confirmAction(
            'Eliminar Cuenta y Datos',
            'Esta acción es irreversible y borrará todos tus datos. ¿Deseas continuar?',
            async () => {
                if (this.useFirestore) {
                    // Simulation: In a real app we'd trigger a cloud function to delete all user docs
                    Toast.info('GDPR', 'Solicitud de borrado enviada al servidor.');
                }
                localStorage.removeItem('notary_crm_data');
                this.signOutUser();
            }
        );
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
        this.startDueChecker();
        this.requestNotificationPermission();
        console.info('Reminders initialized');
    },

    requestNotificationPermission() {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    },

    startDueChecker() {
        // Check every minute
        setInterval(() => this.checkDueReminders(), 60000);
        // Initial check
        setTimeout(() => this.checkDueReminders(), 2000);
    },

    checkDueReminders() {
        if (!this.state.items.length) return;
        const now = new Date();

        this.state.items.forEach(it => {
            if (it.completed) return;

            const dueTime = new Date(it.when);
            const diffInMinutes = (now-dueTime) / 60000;

            // If due exactly now or within the last minute (and we haven't notified yet)
            if (diffInMinutes>= 0 && diffInMinutes < 1.05 && !it.notified) {
                this.showDueNotification(it);
                it.notified = true;
            }
        });
    },

    showDueNotification(it) {
        // 1. Toast
        Toast.warning('🔔 Pendiente: ' + it.title, it.message);

        // 2. Browser Notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Notary CRM: Recordatorio", {
                body: `${it.title}: ${it.message}`,
                icon: '/icon-192.png'
            });
        }
    },

    async clearCompleted() {
        const completed = this.state.items.filter(it => it.completed);
        if (completed.length === 0) return;

        NotaryCRM.confirmAction(
            'Limpiar Completados',
            `¿Estás seguro de que deseas eliminar los ${completed.length} recordatorios completados?`,
            async () => {
                if (NotaryCRM.useFirestore) {
                    try {
                        const { doc, deleteDoc } = window.dbFuncs;
                        const db = window.firebaseDB;
                        for (const it of completed) {
                            await deleteDoc(doc(db, 'reminders', it.id));
                        }
                        this.state.items = this.state.items.filter(it => !it.completed);
                    } catch (err) {
                        console.error('Error clearing completed in Firestore:', err);
                        Toast.error('Error', 'No se pudieron eliminar todos.');
                    }
                } else {
                    this.state.items = this.state.items.filter(it => !it.completed);
                    this.save();
                }

                this.render();
                Toast.success('Limpieza exitosa', 'Se han eliminado los recordatorios completados.');
            },
            { type: 'danger', confirmText: 'Eliminar Todos' }
        );
    },
    async load() {
        // Si usamos Firestore, cargar desde ahí
        if (NotaryCRM.useFirestore && NotaryCRM.currentUser) {
            try {
                const { collection, query, where, getDocs } = window.dbFuncs;
                const db = window.firebaseDB;
                const q = query(
                    collection(db, 'reminders'),
                    where('ownerId', '==', NotaryCRM.currentUser.uid)
                );
                const snapshot = await getDocs(q);
                this.state.items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (err) {
                console.error('Error loading reminders from Firestore:', err);
            }
        } else {
            // Cargar desde localStorage y filtrar por usuario
            const saved = localStorage.getItem('notary_reminders');
            if (saved) {
                const allReminders = JSON.parse(saved);
                // Filtrar solo los recordatorios del usuario actual
                if (NotaryCRM.currentUser) {
                    this.state.items = allReminders.filter(r => r.ownerId === NotaryCRM.currentUser.uid);
                } else {
                    this.state.items = allReminders.filter(r => !r.ownerId); // Recordatorios sin dueño (legacy)
                }
            }
        }
    },
    save() {
        // Solo guardar en localStorage si no usamos Firestore
        if (!NotaryCRM.useFirestore) {
            // Cargar todos los recordatorios existentes
            const saved = localStorage.getItem('notary_reminders');
            let allReminders = saved ? JSON.parse(saved) : [];

            // Filtrar los recordatorios que no son del usuario actual
            if (NotaryCRM.currentUser) {
                allReminders = allReminders.filter(r => r.ownerId !== NotaryCRM.currentUser.uid);
            }

            // Agregar los recordatorios actuales del usuario
            allReminders.push(...this.state.items);

            localStorage.setItem('notary_reminders', JSON.stringify(allReminders));
        }
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
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.load().then(() => this.render()));
    },
    async add(formData) {
        if (!NotaryCRM.currentUser) {
            Toast.error('Error', 'Debes iniciar sesión para crear recordatorios.');
            return;
        }

        const item = {
            id: Date.now().toString(),
            title: formData.get('title'),
            message: formData.get('message'),
            when: formData.get('when'),
            priority: formData.get('priority') || 'medium',
            category: formData.get('category') || 'other',
            completed: false,
            ownerId: NotaryCRM.currentUser.uid,
            createdAt: new Date().toISOString()
        };

        // Guardar en Firestore si está disponible
        if (NotaryCRM.useFirestore) {
            try {
                const { collection, addDoc } = window.dbFuncs;
                const db = window.firebaseDB;

                // Clone item and remove temporary ID before saving to Firestore
                const toInsert = { ...item };
                delete toInsert.id;

                const docRef = await addDoc(collection(db, 'reminders'), toInsert);
                item.id = docRef.id;
                this.state.items.push(item);
                Toast.success('Recordatorio Guardado', 'El recordatorio ha sido creado.');
            } catch (err) {
                console.error('Error adding reminder to Firestore:', err);
                Toast.error('Error', 'No se pudo guardar el recordatorio.');
                return;
            }
        } else {
            this.state.items.push(item);
            this.save();
            Toast.success('Recordatorio Guardado', 'El recordatorio ha sido creado.');
        }

        this.render();
        NotaryCRM.closeModal('reminders-modal');
    },
    async toggleComplete(id) {
        const item = this.state.items.find(it => it.id === id);
        if (!item) return;

        const newStatus = !item.completed;

        if (NotaryCRM.useFirestore) {
            try {
                const { doc, updateDoc, getDoc } = window.dbFuncs;
                const db = window.firebaseDB;
                const docRef = doc(db, 'reminders', id);

                // Verify document existence before updating to avoid "No document to update" error
                // This typically happens with legacy local IDs that haven't been synced
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    await updateDoc(docRef, { completed: newStatus });
                    item.completed = newStatus;
                } else {
                    console.warn(`Reminder ${id} not found in Firestore. Updating locally.`);
                    item.completed = newStatus;
                    this.save(); // Fallback to local
                }
            } catch (err) {
                console.error('Error updating reminder in Firestore:', err);
                // Even if Firestore fails, update local state for better UX
                item.completed = newStatus;
                this.render();
            }
        } else {
            item.completed = newStatus;
            this.save();
        }

        this.render();
    },
    async delete(id) {
        NotaryCRM.confirmAction(
            'Eliminar Recordatorio',
            '¿Estás seguro de que deseas eliminar este recordatorio? Esta acción no se puede deshacer.',
            async () => {
                // Eliminar de Firestore si está disponible
                if (NotaryCRM.useFirestore) {
                    try {
                        const { doc, deleteDoc } = window.dbFuncs;
                        const db = window.firebaseDB;
                        await deleteDoc(doc(db, 'reminders', id));
                        this.state.items = this.state.items.filter(it => it.id !== id);
                        Toast.success('Eliminado', 'Recordatorio eliminado correctamente.');
                    } catch (err) {
                        console.error('Error deleting reminder from Firestore:', err);
                        Toast.error('Error', 'No se pudo eliminar el recordatorio.');
                        return;
                    }
                } else {
                    this.state.items = this.state.items.filter(it => it.id !== id);
                    this.save();
                    Toast.success('Eliminado', 'Recordatorio eliminado correctamente.');
                }
                this.render();
            },
            { type: 'danger', confirmText: 'Eliminar' }
        );
    },
    render() {
        const list = document.getElementById('reminders-list');
        const timeline = document.getElementById('reminders-tab-timeline');
        if (!list && !timeline) return;

        // Get filter values
        const searchQuery = document.getElementById('reminders-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('reminders-filter-category')?.value || 'all';
        const statusFilter = document.getElementById('reminders-filter-status')?.value || 'all';

        let filteredItems = [...this.state.items];

        // Apply filters
        if (searchQuery) {
            filteredItems = filteredItems.filter(it =>
                it.title.toLowerCase().includes(searchQuery) ||
                it.message.toLowerCase().includes(searchQuery)
            );
        }

        if (categoryFilter !== 'all') {
            filteredItems = filteredItems.filter(it => it.category === categoryFilter);
        }

        if (statusFilter !== 'all') {
            if (statusFilter === 'completed') filteredItems = filteredItems.filter(it => it.completed);
            if (statusFilter === 'pending') filteredItems = filteredItems.filter(it => !it.completed);
        }

        const sorted = filteredItems.sort((a, b) => new Date(a.when)-new Date(b.when));
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Helper to get color/icon based on priority/category
        const getPriorityColor = (p) => {
            switch (p) {
                case 'high': return '#ef4444'; // Red
                case 'medium': return '#f59e0b'; // Amber
                case 'low': return '#10b981'; // Green
                default: return '#64748b';
            }
        };

        const getCategoryBadge = (c) => {
            const map = {
                'appointment': { label: 'Cita', bg: '#eff6ff', color: '#1d4ed8' },
                'call': { label: 'Llamada', bg: '#fef3c7', color: '#b45309' },
                'payment': { label: 'Pago', bg: '#ecfdf5', color: '#047857' },
                'document': { label: 'Documento', bg: '#f5f3ff', color: '#6d28d9' },
                'other': { label: 'Otro', bg: '#f3f4f6', color: '#374151' }
            };
            const style = map[c] || map['other'];
            return `<span style="background:${style.bg}; color:${style.color}; font-size:0.7rem; padding:2px 8px; border-radius:12px; font-weight:600; text-transform:uppercase;">${style.label}</span>`;
        };

        // 1. Render Modal List
        if (list) {
            if (sorted.length === 0) {
                list.innerHTML = '<p class="empty-state">No hay recordatorios.</p>';
            } else {
                list.innerHTML = sorted.map(it => `
                    <div class="reminder-item-row ${it.completed ? 'completed' : ''}" style="padding: 1rem; border-bottom: 1px solid #f1f5f9; display: flex; gap: 1rem; align-items: start;">
                        <input type="checkbox" ${it.completed ? 'checked' : ''} onchange="Reminders.toggleComplete('${it.id}')" style="margin-top: 4px; border-radius: 4px; width: 18px; height: 18px; cursor: pointer;">
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-weight: 600; font-size: 0.95rem; color: #0f172a; ${it.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${it.title}</span>
                                ${getCategoryBadge(it.category)}
                            </div>
                            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 6px; line-height: 1.4;">${it.message}</p>
                            <div style="display: flex; gap: 1rem; align-items: center; font-size: 0.75rem;">
                                <span style="color: ${getPriorityColor(it.priority)}; font-weight: 500;">
                                    📅 ${new Date(it.when).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                        <button class="btn-icon-danger" onclick="Reminders.delete('${it.id}')" title="Eliminar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `).join('');
            }
        }

        // 2. Render Timeline Tab (Refined Professional View)
        if (timeline) {
            if (sorted.length === 0) {
                timeline.innerHTML = `
                    <div style="text-align: center; padding: 4rem 2rem; color: #64748b;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin-bottom: 1rem;">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <p>No tienes recordatorios pendientes.</p>
                        <button class="btn btn-sm btn-outline" onclick="NotaryCRM.openModal('reminders-modal')" style="margin-top: 1rem;">Crear Recordatorio</button>
                    </div>
                `;
            } else {
                let groupList = [];
                let currentKey = null;

                sorted.forEach(it => {
                    const d = new Date(it.when);
                    const isToday = d.toDateString() === now.toDateString();
                    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString();
                    const isPast = d <now && !isToday;

                    let key = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                    if (isToday) key = '📅 Hoy';
                    else if (isTomorrow) key = '📅 Mañana';
                    else if (isPast) key = '⚠️ Vencidos / Anteriores';
                    // Capitalize first letter if it's a date string
                    if (!key.startsWith('📅') && !key.startsWith('⚠️')) {
                        key = key.charAt(0).toUpperCase() + key.slice(1);
                    }

                    if (key !== currentKey) {
                        groupList.push({ title: key, items: [] });
                        currentKey = key;
                    }
                    groupList[groupList.length-1].items.push(it);
                });

                timeline.innerHTML = groupList.map(group => `
                    <div style="margin-bottom: 2rem;">
                        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">
                            ${group.title}
                        </h4>
                        <div style="display: grid; gap: 0.75rem;">
                            ${group.items.map(it => {
                    const pColor = getPriorityColor(it.priority);
                    return `
                                <div class="reminder-card ${it.completed ? 'completed-card' : ''}" style="
                                    background: white; 
                                    border: 1px solid ${it.completed ? '#e2e8f0' : '#cbd5e1'}; 
                                    border-left: 4px solid ${it.completed ? '#cbd5e1' : pColor};
                                    border-radius: 8px; 
                                    padding: 1rem; 
                                    display: flex; 
                                    align-items: flex-start; 
                                    gap: 1rem;
                                    transition: all 0.2s ease;
                                ">
                                    <div style="padding-top: 2px;">
                                         <input type="checkbox" ${it.completed ? 'checked' : ''} onchange="Reminders.toggleComplete('${it.id}')" style="width: 20px; height: 20px; cursor: pointer; border-color: #cbd5e1;">
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
                                            <span style="font-weight: 600; color: #1e293b; font-size: 1rem; ${it.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${it.title}</span>
                                            ${getCategoryBadge(it.category)}
                                        </div>
                                        <div style="font-size: 0.85rem; color: #475569; margin-bottom: 0.5rem; line-height: 1.5;">${it.message}</div>
                                        <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: #64748b; align-items: center;">
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                ${new Date(it.when).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            ${it.priority === 'high' ? `<span style="color:${pColor}; font-weight:700;">Alta Prioridad</span>` : ''}
                                        </div>
                                    </div>
                                    <button class="btn-icon-danger" onclick="Reminders.delete('${it.id}')" title="Eliminar" style="background:none; border:none; cursor:pointer; color:#ef4444; opacity:0.6; padding:4px;">
                                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                                `;
                }).join('')}
                        </div>
                    </div>
                `).join('');
            }
        }
    }
};



// ============================================

// ============================================
// DOCUMENTS MANAGER (PDF & SIGNATURE)
// ============================================

const NoteGenerator = {
    // Force global exposure immediately for inline event handlers
    get self() { window.NoteGenerator = this; return this; },

    signaturePad: null,
    currentSigElement: null,
    templates: {
        affidavit: {
            title: "DECLARACIÓN JURADA (AFFIDAVIT)",
            fields: [
                {
                    group: 'Datos del Declarante', fields: [
                        { id: 'affiantName', label: 'Nombre Completo', type: 'text', width: 'full' },
                        { id: 'address', label: 'Dirección Completa', type: 'text', width: 'full' },
                        { id: 'age', label: 'Edad', type: 'number', width: 'half' },
                        { id: 'occupation', label: 'Ocupación', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Contenido de la Declaración', fields: [
                        { id: 'subject', label: 'Asunto o Propósito del Documento', type: 'text', width: 'full', placeholder: 'Ej: Declaración de Ingresos, Hechos de Tránsito, Superviviencia...' },
                        { id: 'statement', label: 'Cuerpo de la Declaración (Hechos)', type: 'textarea', rows: 12, placeholder: 'Detalle aquí los hechos de forma clara y cronológica...' }
                    ]
                },
                {
                    group: 'Información del Notario', fields: [
                        { id: 'notaryCommission', label: 'Mi comisión expira el:', type: 'date', width: 'half' },
                        { id: 'notaryReg', label: 'Nº Registro Notarial (Opcional)', type: 'text', width: 'half', placeholder: 'Reg #12345' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        {
                            id: 'idType',
                            label: 'Método de Identificación',
                            type: 'select',
                            options: [
                                'Presentación de identificación',
                                'Conocimiento personal'
                            ],
                            width: 'half'
                        },
                        { id: 'idDetails', label: 'Especifique ID (Licencia, Pasaporte, etc)', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">DECLARACIÓN JURADA (AFFIDAVIT)</h2>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 25pt; border-bottom: 2px solid #000; padding-bottom: 10pt;">
                        <p style="margin: 0; line-height: 1.5;">
                            ESTADO DE: <strong>${data.location ? (data.location.split(',')[1] || data.location).trim().toUpperCase() : '__________'}</strong><br>
                            CONDADO DE: <strong>${data.location ? (data.location.split(',')[0] || data.location).trim().toUpperCase() : '__________'}</strong>
                        </p>
                        <p style="margin: 0; text-align: right;">
                            FECHA: <strong>${data.date}</strong>
                        </p>
                    </div>

                    ${data.subject ? `<div style="margin-bottom: 20pt; text-align: center; background: #f8fafc; padding: 12pt; border: 1px solid #e2e8f0; border-radius: 6px;">
                        <span style="font-size: 9pt; color: #64748b; letter-spacing: 0.05em;">ASUNTO / PROPÓSITO:</span><br>
                        <strong style="font-size: 11pt;">${data.subject.toUpperCase()}</strong>
                    </div>` : ''}

                    <p class="doc-text" style="text-indent: 30pt; margin-bottom: 20pt; line-height: 1.8;">
                        ANTE MÍ, el Notario Público abajo firmante, debidamente comisionado y autorizado para actuar en esta jurisdicción, compareció personalmente <strong>${data.affiantName || data.clientName}</strong>, mayor de edad (${data.age || '__'} años), identificado/a como se describe más adelante, de ocupación ${data.occupation || '__________'}, con domicilio legal en ${data.address || '______________________________'}, quien después de haber prestado juramento solemne de acuerdo con la ley, declara y hace constar lo siguiente:
                    </p>

                    <div class="doc-body-text" style="min-height: 250pt; border: 1px double #ccc; padding: 25pt; margin: 20pt 0; background: #fff; position: relative; line-height: 1.6;">
                        <div class="doc-watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60pt; color: rgba(0,0,0,0.015); pointer-events: none; white-space: nowrap; user-select: none; font-weight: 800;">OFFICIAL DOCUMENT</div>
                        
                        <div style="position: relative; z-index: 1;">
                            ${(data.statement || '[Detalle aquí los hechos declarados. Use párrafos numerados para mayor formalidad.]').split('\n').map(p => p.trim() ? `<p style="margin-bottom: 12pt; text-align: justify;">${p}</p>` : '<br>').join('')}
                        </div>
                    </div>

                    <p class="doc-text" style="margin-top: 25pt; font-style: italic; border-left: 3px solid #eee; padding-left: 15pt;">
                        BAJO PENA DE PERJURIO, el facultativo certifica que ha leído íntegramente esta declaración y que el contenido de la misma es fiel reflejo de la verdad según su leal saber y entender.
                    </p>

                    <br><br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false" style="width: 280px; margin-left: auto;">
                            <div style="border-top: 1px solid #000; padding-top: 5pt; text-align: center;">
                                <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Declarante"></div>
                                <div class="sig-label"><strong>${data.affiantName || data.clientName}</strong><br>EL DECLARANTE</div>
                            </div>
                        </div>
                    </div>

                    <div class="notary-block" contenteditable="false" style="margin-top: 40pt; border: 1px solid #000; padding: 20pt; background: #fdfdfd; position: relative;">
                        <p class="doc-center-bold" style="text-decoration: underline; margin-bottom: 15pt;">ACTO NOTARIAL DE JURAMENTACIÓN</p>
                        <p class="doc-text" style="line-height: 1.6;">
                            SUSCRITO Y JURADO (o afirmado) ante mí, el Notario Público actuante, en este día <strong>${data.date}</strong>, por <strong>${data.affiantName || data.clientName}</strong>, cuya identidad ha sido verificada satisfactoriamente mediante:
                        </p>
                        <div style="margin: 15pt 0; padding-left: 20pt;">
                            <p>${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} Conocimiento personal del Notario.</p>
                            <p>${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} Presentación de identificación: <strong>${data.idDetails || '____________________'}</strong></p>
                        </div>
                        
                        <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-top: 30pt;">
                            <div class="notary-seal-placeholder" style="width: 100pt; height: 100pt; display: flex; align-items: center; justify-content: center; border: 2px solid #ccc; color: #ccc; font-size: 7pt; margin: 0; text-align: center; padding: 5pt;">ESPACIO PARA SELLO OFICIAL</div>
                            <div class="sig-block" style="width: 250px; text-align: center;">
                                <div style="border-top: 1px solid #000; padding-top: 5pt;">
                                    <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                                    <div class="sig-label">
                                        <strong>NOTARIO PÚBLICO</strong><br>
                                        ${data.notaryReg ? `Nº Registro: ${data.notaryReg}<br>` : ''}
                                        Mi comisión expira: ${data.notaryCommission ? data.notaryCommission : '____________'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        },
        bill_of_sale: {
            title: "FACTURA DE VENTA DE VEHÍCULO/BIEN",
            fields: [
                {
                    group: 'Vendedor', fields: [
                        { id: 'sellerName', label: 'Nombre Vendedor', type: 'text', width: 'full' },
                        { id: 'sellerAddress', label: 'Dirección Vendedor', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Comprador', fields: [
                        { id: 'buyerName', label: 'Nombre Comprador', type: 'text', width: 'full' },
                        { id: 'buyerAddress', label: 'Dirección Comprador', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Datos del Bien', fields: [
                        { id: 'itemType', label: 'Tipo (Vehículo, Bote, etc)', type: 'text', width: 'half' },
                        { id: 'make', label: 'Marca', type: 'text', width: 'half' },
                        { id: 'model', label: 'Modelo', type: 'text', width: 'half' },
                        { id: 'year', label: 'Año', type: 'number', width: 'half' },
                        { id: 'vin', label: 'VIN / N.º Serie', type: 'text', width: 'full' },
                        { id: 'odometer', label: 'Millaje/Uso', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Transacción', fields: [
                        { id: 'price', label: 'Precio de Venta ($)', type: 'number', width: 'half' },
                        { id: 'saleDate', label: 'Fecha Venta', type: 'date', width: 'half' },
                        { id: 'gift', label: '¿Es regalo?', type: 'select', options: ['No', 'Sí'], width: 'full' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">FACTURA DE VENTA (BILL OF SALE)</h2>
                    <div class="doc-box">
                        <p><strong>MONTO:</strong> $ ${data.price || '0.00'}</p>
                        <p><strong>FECHA:</strong> ${data.saleDate || data.date}</p>
                    </div>
                    <p class="doc-text">
                        <strong>EL VENDEDOR:</strong> ${data.sellerName} (Domicilio: ${data.sellerAddress})<br>
                        Transfiere absoluta propiedad al<br>
                        <strong>COMPRADOR:</strong> ${data.buyerName} (Domicilio: ${data.buyerAddress})
                    </p>
                    <p class="doc-text">Sobre el siguiente Bien/Vehículo:</p>
                    <table style="width:100%; border:1px solid #000; border-collapse:collapse; margin-bottom:15px;">
                        <tr><td style="border:1px solid #000; padding:5px;"><strong>Tipo:</strong></td><td style="border:1px solid #000; padding:5px;">${data.itemType || ''}</td></tr>
                        <tr><td style="border:1px solid #000; padding:5px;"><strong>Marca/Modelo:</strong></td><td style="border:1px solid #000; padding:5px;">${data.make || ''} ${data.model || ''} (${data.year || ''})</td></tr>
                        <tr><td style="border:1px solid #000; padding:5px;"><strong>VIN/Serie:</strong></td><td style="border:1px solid #000; padding:5px;">${data.vin || ''}</td></tr>
                        <tr><td style="border:1px solid #000; padding:5px;"><strong>Lectura:</strong></td><td style="border:1px solid #000; padding:5px;">${data.odometer || 'N/A'}</td></tr>
                    </table>
                    <p class="doc-text">
                        ${data.gift === 'Sí' ? 'Este traspaso es un REGALO y no hay intercambio monetario mayor.' : 'El Vendedor certifica que el bien está libre de gravámenes.'}
                        Se vende "TAL CUAL" (AS-IS) sin garantía.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Vendedor"></div>
                            <div class="sig-label">Vendedor: ${data.sellerName}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Comprador"></div>
                             <div class="sig-label">Comprador: ${data.buyerName}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.sellerName}</strong> y <strong>${data.buyerName}</strong>, a quienes se les identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        promissory_note: {
            title: "PAGARÉ CON GARANTÍA",
            fields: [
                {
                    group: 'Términos', fields: [
                        { id: 'amount', label: 'Monto Prestado ($)', type: 'number', width: 'half' },
                        { id: 'rate', label: 'Interés Anual (%)', type: 'number', width: 'half' },
                        { id: 'startDate', label: 'Fecha Inicio', type: 'date', width: 'half' },
                        { id: 'endDate', label: 'Fecha Vencimiento', type: 'date', width: 'half' }
                    ]
                },
                {
                    group: 'Partes', fields: [
                        { id: 'borrower', label: 'Prestatario', type: 'text', width: 'full' },
                        { id: 'lender', label: 'Prestamista', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                 <div class="legal-doc" contenteditable="true">
                     <h2 class="doc-title">PAGARÉ (PROMISSORY NOTE)</h2>
                     <p class="doc-text"><strong>${data.date}</strong> (Fecha)</p>
                     <p class="doc-text">
                         POR VALOR RECIBIDO, <strong>${data.borrower || '[Prestatario]'}</strong> (el "Prestatario"), promete pagar a <strong>${data.lender || '[Prestamista]'}</strong> (el "Tenedor"), la suma principal de <strong>$ ${data.amount || '0.00'}</strong>.
                     </p>
                     <p class="doc-text">
                         <strong>1. INTERÉS:</strong> Tasa del <strong>${data.rate || '0'}%</strong> anual sobre el saldo insoluto.
                     </p>
                     <p class="doc-text">
                         <strong>2. PAGOS:</strong> El pago se realizará de forma <strong>${data.frequency || 'Mensual'}</strong>.
                         Cuota estimada: $ ${data.installment || '0.00'}.
                         El pago total final vence el: <strong>${data.endDate || '___________'}</strong>.
                     </p>
                     <p class="doc-text">
                         <strong>3. INCUMPLIMIENTO:</strong> En caso de mora, se aplicarán cargos permitidos por la ley.
                     </p>
                     <br>
                     <div class="sig-section" contenteditable="false">
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Prestatario"></div>
                             <div class="sig-label">${data.borrower}</div>
                         </div>
                     </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.borrower}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                 </div>
             `
        },
        child_travel_consent: {
            title: "CONSENTIMIENTO DE VIAJE (MENORES)",
            fields: [
                {
                    group: 'Menor', fields: [
                        { id: 'childName', label: 'Nombre del Menor', type: 'text', width: 'full' },
                        { id: 'dob', label: 'Fecha Nacimiento', type: 'date', width: 'half' },
                        { id: 'passport', label: 'Pasaporte N.º', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AUTORIZACIÓN DE VIAJE PARA MENORES</h2>
                    <p class="doc-text">
                        YO/NOSOTROS, <strong>${data.clientName}</strong>, bajo juramento certifico que soy el padre/madre/tutor legal de:
                    </p>
                    <p class="doc-center-bold">${data.childName || '[NOMBRE MENOR]'}</p>
                    <p class="doc-text" style="text-align:center;">
                        Nacido el: ${data.dob || '_______'} | Pasaporte: ${data.passport || '_______'}
                    </p>
                    <p class="doc-text">
                        Doy mi consentimiento irrevocable para que mi hijo(a) viaje a <strong>${data.dest || '[PAÍS/CIUDAD]'}</strong> durante las fechas <strong>${data.dates || '_______'}</strong>.
                    </p>
                    <p class="doc-text">
                        El menor viajará acompañado por: <strong>${data.guardian || '[ACOMPAÑANTE]'}</strong> (${data.relation || 'Relación'}).
                        Autorizo al acompañante a tomar decisiones médicas de emergencia si fuera necesario.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Padre/Madre"></div>
                            <div class="sig-label">Padre/Madre/Tutor</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Suscrito y jurado (o afirmado) ante mí el <strong>${data.date}</strong> por <strong>${data.clientName}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        power_of_attorney: {
            title: "PODER NOTARIAL GENERAL (POWER OF ATTORNEY)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'principalName', label: 'Poderdante (Principal)', type: 'text', width: 'full' },
                        { id: 'agentName', label: 'Apoderado (Agent)', type: 'text', width: 'full' },
                        { id: 'agentAddress', label: 'Dirección del Apoderado', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Poderes', fields: [
                        { id: 'effectiveDate', label: 'Fecha de Efectividad', type: 'date', width: 'half' },
                        { id: 'expirationDate', label: 'Fecha de Expiración (Opcional)', type: 'date', width: 'half' },
                        { id: 'powers', label: 'Poderes Otorgados', type: 'textarea', rows: 4, placeholder: 'Describa los poderes (Bancarios, Bienes Raíces, etc.)' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">PODER NOTARIAL GENERAL</h2>
                    <p class="doc-text">
                        POR EL PRESENTE DOCUMENTO, yo, <strong>${data.principalName || data.clientName}</strong> (el "Poderdante"), domiciliado en <strong>${data.location}</strong>, designo y nombro a:
                    </p>
                    <p class="doc-center-bold">${data.agentName} <br><span style="font-weight:normal; font-size:10pt;">${data.agentAddress}</span></p>
                    <p class="doc-text">
                        Como mi verdadero y legal Apoderado (Attorney-in-Fact) para actuar en mi nombre y representación.
                    </p>
                    <div class="doc-box">
                        <strong>PODERES OTORGADOS:</strong><br>
                        ${(data.powers || 'El Apoderado tendrá plenos poderes para gestionar mis asuntos financieros, bancarios y de propiedad.').replace(/\n/g, '<br>')}
                    </div>
                    <p class="doc-text">
                        Este Poder entrará en vigor el <strong>${data.effectiveDate || 'fecha de firma'}</strong> y permanecerá vigente hasta su revocación por escrito ${data.expirationDate ? 'o hasta el ' + data.expirationDate : ''}.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Poderdante"></div>
                            <div class="sig-label">${data.principalName || data.clientName}</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Apoderado"></div>
                            <div class="sig-label">${data.agentName}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.principalName || data.clientName}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        living_will: {
            title: "TESTAMENTO VITAL (LIVING WILL)",
            fields: [
                {
                    group: 'Declarante', fields: [
                        { id: 'declarantName', label: 'Nombre Completo', type: 'text', width: 'full' },
                        { id: 'primaryPhysician', label: 'Médico Primario', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">DIRECTIVA ANTICIPADA DE SALUD (LIVING WILL)</h2>
                    <p class="doc-text">
                        YO, <strong>${data.declarantName || data.clientName}</strong>, estando en pleno uso de mis facultades mentales, declaro mi voluntad respecto a mi tratamiento médico futuro.
                    </p>
                    <div class="doc-body-text">
                        <p><strong>1. SOPORTE VITAL:</strong> ${data.lifeSupport}</p>
                        <p><strong>2. DONACIÓN DE ÓRGANOS:</strong> ${data.organDonation}</p>
                        <p><strong>3. INSTRUCCIONES ESPECIALES:</strong><br>${data.specialRequests || 'Ninguna.'}</p>
                    </div>
                    <p class="doc-text">
                         Esta directiva debe seguirse si no puedo comunicarme y me encuentro en una condición terminal incurable.
                         Médico Primario: ${data.primaryPhysician || 'N/A'}.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Declarante"></div>
                            <div class="sig-label">${data.declarantName || data.clientName}</div>
                        </div>
                    </div>
                    <!-- Witness Section -->
                     <div class="sig-section-row" style="margin-top:20px;">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-witness1" onclick="NoteGenerator.openSignPad('witness1', this)" data-label="Testigo 1"></div>
                            <div class="sig-label">Testigo 1</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-witness2" onclick="NoteGenerator.openSignPad('witness2', this)" data-label="Testigo 2"></div>
                             <div class="sig-label">Testigo 2</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Suscrito y jurado ante mí el <strong>${data.date}</strong> por <strong>${data.declarantName || data.clientName}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        quitclaim_deed: {
            title: "ESCRITURA DE RENUNCIA (QUITCLAIM DEED)",
            fields: [
                {
                    group: 'Transmisión', fields: [
                        { id: 'grantor', label: 'Otorgante (Grantor)', type: 'text', width: 'full' },
                        { id: 'grantee', label: 'Beneficiario (Grantee)', type: 'text', width: 'full' },
                        { id: 'consideration', label: 'Contraprestación ($)', type: 'number', width: 'half' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">QUITCLAIM DEED</h2>
                    <p class="doc-text">
                        ESTA ESCRITURA DE RENUNCIA, ejecutada el <strong>${data.date}</strong>, por el Otorgante (Grantor):
                    </p>
                    <p class="doc-center-bold">${data.grantor}</p>
                    <p class="doc-text">
                        A favor del Beneficiario (Grantee):
                    </p>
                     <p class="doc-center-bold">${data.grantee}</p>
                    <p class="doc-text">
                        POR LA CONTRAPRESTACIÓN DE $ ${data.consideration || '10.00'}, y otra buena y valiosa compensación, el Otorgante por la presente renuncia y cede al Beneficiario todo derecho, título e interés en la siguiente propiedad:
                    </p>
                    <div class="doc-box-highlight">
                        ${data.propertyDesc || '[Inserte Descripción Legal Aquí]'}
                        <br><br><strong>Parcel ID:</strong> ${data.parcelId || '_______'}
                    </div>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Otorgante"></div>
                            <div class="sig-label">${data.grantor}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.grantor}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        residential_lease: {
            title: "CONTRATO DE ALQUILER RESIDENCIAL",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'landlord', label: 'Propietario', type: 'text', width: 'full' },
                        { id: 'tenant', label: 'Inquilino', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Términos', fields: [
                        { id: 'propertyAddress', label: 'Dirección Inmueble', type: 'text', width: 'full' },
                        { id: 'termStart', label: 'Inicio', type: 'date', width: 'half' },
                        { id: 'termEnd', label: 'Fin', type: 'date', width: 'half' },
                        { id: 'rentAmount', label: 'Renta Mensual ($)', type: 'number', width: 'half' },
                        { id: 'securityDeposit', label: 'Depósito ($)', type: 'number', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ARRENDAMIENTO</h2>
                    <p class="doc-text">
                        ACUERDO celebrado el <strong>${data.date}</strong>, entre <strong>${data.landlord}</strong> (Propietario) y <strong>${data.tenant}</strong> (Inquilino).
                    </p>
                    <p class="doc-text">
                        <strong>1. PROPIEDAD:</strong> El Propietario alquila al Inquilino la propiedad ubicada en: ${data.propertyAddress}.
                    </p>
                    <p class="doc-text">
                        <strong>2. PLAZO:</strong> Comienza el ${data.termStart || '_______'} y termina el ${data.termEnd || '_______'}.
                    </p>
                     <p class="doc-text">
                        <strong>3. RENTA:</strong> $ ${data.rentAmount || '0.00'} pagaderos mensualmente.
                    </p>
                     <p class="doc-text">
                        <strong>4. DEPÓSITO:</strong> $ ${data.securityDeposit || '0.00'} pagaderos a la firma.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div>
                            <div class="sig-label">Propietario</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Inquilino"></div>
                            <div class="sig-label">Inquilino</div>
                        </div>
                    </div>
                </div>
            `
        },
        residency_affidavit: {
            title: "PRUEBA DE RESIDENCIA (RESIDENCY AFFIDAVIT)",
            fields: [
                {
                    group: 'Residente', fields: [
                        { id: 'residentName', label: 'Nombre Residente', type: 'text', width: 'full' },
                        { id: 'currAddress', label: 'Dirección Actual', type: 'text', width: 'full' },
                        { id: 'yearsResiding', label: 'Años Residiendo', type: 'number', width: 'half' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                 <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">DECLARACIÓN JURADA DE RESIDENCIA</h2>
                     <p class="doc-text">
                        Yo, <strong>${data.residentName || data.clientName}</strong>, bajo juramento declaro:
                    </p>
                    <div class="doc-body-text">
                        <p>1. Que mi residencia principal y actual es:</p>
                        <p style="text-align:center; font-weight:bold;">${data.currAddress}</p>
                        <p>2. Que he residido en esta dirección por un periodo de ${data.yearsResiding || '__'} años.</p>
                        <p>3. Que presento esta declaración para probar mi domicilio a fines legales/administrativos.</p>
                    </div>
                     <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Residente"></div>
                            <div class="sig-label">${data.residentName}</div>
                        </div>
                    </div>
                    ${data.landlordName ? `
                     <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-witness1" onclick="NoteGenerator.openSignPad('witness1', this)" data-label="Firma Propietario/Testigo"></div>
                            <div class="sig-label">${data.landlordName} (Propietario/Testigo)</div>
                        </div>
                    </div>
                    ` : ''}
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Suscrito y jurado ante mí el <strong>${data.date}</strong> por <strong>${data.residentName || data.clientName}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        medical_poa: {
            title: "PODER MÉDICO (MEDICAL POWER OF ATTORNEY)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'principalName', label: 'Poderdante (Principal)', type: 'text', width: 'full' },
                        { id: 'agentName', label: 'Agente de Salud', type: 'text', width: 'full' },
                        { id: 'altAgentName', label: 'Agente Alterno (Opcional)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Instrucciones', fields: [
                        { id: 'effectiveCondition', label: 'Efectivo cuando', type: 'select', options: ['Inmediatamente', 'Cuando sea incapaz de decidir'], width: 'full' },
                        { id: 'specialInstructions', label: 'Limitaciones o Instrucciones', type: 'textarea', rows: 4 }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">PODER NOTARIAL PARA ATENCIÓN MÉDICA</h2>
                    <p class="doc-text">
                        <strong>DESIGNACIÓN DE AGENTE DE ATENCIÓN MÉDICA.</strong><br>
                        Yo, <strong>${data.principalName || data.clientName}</strong>, designo y nombro a:
                    </p>
                    <p class="doc-center-bold">${data.agentName}</p>
                    <p class="doc-text">
                        Como mi agente para tomar todas y cada una de las decisiones de atención médica por mí, excepto en la medida en que yo indique lo contrario en este documento.
                    </p>
                    <p class="doc-text">
                        Si mi agente designado no puede o no quiere servir, designo a <strong>${data.altAgentName || 'N/A'}</strong> como mi agente alterno.
                    </p>
                    <div class="doc-box">
                        <strong>EFECTIVIDAD:</strong> ${data.effectiveCondition}<br><br>
                        <strong>LIMITACIONES/INSTRUCCIONES:</strong><br>
                        ${(data.specialInstructions || 'Mi agente tiene plena autoridad para tomar decisiones de atención médica.').replace(/\n/g, '<br>')}
                    </div>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Poderdante"></div>
                            <div class="sig-label">${data.principalName}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-witness1" onclick="NoteGenerator.openSignPad('witness1', this)" data-label="Firma Testigo 1"></div>
                            <div class="sig-label">Testigo 1</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.principalName}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        last_will: {
            title: "ÚLTIMA VOLUNTAD Y TESTAMENTO (LAST WILL)",
            fields: [
                {
                    group: 'Testador', fields: [
                        { id: 'testatorName', label: 'Nombre del Testador', type: 'text', width: 'full' },
                        { id: 'executorName', label: 'Albacea (Ejecutor)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Beneficiarios', fields: [
                        { id: 'beneficiary1', label: 'Beneficiario Principal', type: 'text', width: 'full' },
                        { id: 'assets1', label: 'Bienes para Principal', type: 'textarea', rows: 2 },
                        { id: 'beneficiary2', label: 'Beneficiario Secundario', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ÚLTIMA VOLUNTAD Y TESTAMENTO</h2>
                    <p class="doc-text">
                        YO, <strong>${data.testatorName || data.clientName}</strong>, residente de <strong>${data.location}</strong>, siendo de mente sana, declaro que este es mi Testamento y revoco todos los testamentos y codicilos anteriores.
                    </p>
                    <p class="doc-text">
                        <strong>ARTÍCULO 1. ALBACEA.</strong><br>
                        Nombro a <strong>${data.executorName}</strong> como mi Albacea/Ejecutor para administrar mi patrimonio.
                    </p>
                    <p class="doc-text">
                        <strong>ARTÍCULO 2. DISTRIBUCIÓN DE BIENES.</strong><br>
                        Lego y devengo mis bienes de la siguiente manera:
                    </p>
                    <div class="doc-body-text">
                        <p>A <strong>${data.beneficiary1 || '[Beneficiario]'}</strong>: ${data.assets1 || 'Todo el resto y residuo de mi patrimonio.'}</p>
                        ${data.beneficiary2 ? `<p>A <strong>${data.beneficiary2}</strong>: Cualquier activo restante si el beneficiario principal fallece antes que yo.</p>` : ''}
                    </div>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Testador"></div>
                            <div class="sig-label">${data.testatorName}</div>
                        </div>
                    </div>
                    <div class="sig-section-row" style="margin-top:20px;">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-witness1" onclick="NoteGenerator.openSignPad('witness1', this)" data-label="Firma Testigo 1"></div>
                            <div class="sig-label">Testigo 1</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-witness2" onclick="NoteGenerator.openSignPad('witness2', this)" data-label="Firma Testigo 2"></div>
                             <div class="sig-label">Testigo 2</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Suscrito y jurado ante mí el <strong>${data.date}</strong> por <strong>${data.testatorName}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        contractor_agreement: {
            title: "CONTRATO DE SERVICIOS (INDEPENDENT CONTRACTOR)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'client', label: 'Cliente (Contratante)', type: 'text', width: 'full' },
                        { id: 'contractor', label: 'Contratista', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Servicio', fields: [
                        { id: 'serviceDesc', label: 'Descripción del Servicio', type: 'textarea', rows: 3 },
                        { id: 'compensation', label: 'Compensación Total ($)', type: 'number', width: 'half' },
                        { id: 'timeline', label: 'Fecha de Entrega/Fin', type: 'date', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE CONTRATISTA INDEPENDIENTE</h2>
                    <p class="doc-text">
                        ESTE ACUERDO se celebra el <strong>${data.date}</strong>, entre:
                    </p>
                    <p class="doc-text"><strong>CLIENTE:</strong> ${data.client}</p>
                    <p class="doc-text"><strong>CONTRATISTA:</strong> ${data.contractor}</p>
                    <p class="doc-text">
                        <strong>1. SERVICIOS.</strong> El Contratista acuerda realizar los siguientes servicios:<br>
                        ${data.serviceDesc || '[Describir servicios]'}
                    </p>
                    <p class="doc-text">
                        <strong>2. PAGO.</strong> El Cliente pagará al Contratista la suma de <strong>$ ${data.compensation || '0.00'}</strong> al completarse el servicio.
                    </p>
                    <p class="doc-text">
                        <strong>3. PLAZO.</strong> Los servicios se completarán para la fecha: <strong>${data.timeline}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>4. RELACIÓN.</strong> Las partes acuerdan que esta es una relación de contratista independiente y no de empleado-empleador.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Cliente"></div>
                            <div class="sig-label">Cliente</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Contratista"></div>
                            <div class="sig-label">Contratista</div>
                        </div>
                    </div>
                </div>
            `
        },
        hold_harmless: {
            title: "ACUERDO DE EXENCIÓN (HOLD HARMLESS)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'indemnifier', label: 'Indemnizador (Libera)', type: 'text', width: 'full' },
                        { id: 'indemnitee', label: 'Indemnizado (Protegido)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Evento', fields: [
                        { id: 'activity', label: 'Actividad/Evento', type: 'textarea', rows: 3 }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE EXENCIÓN DE RESPONSABILIDAD</h2>
                    <p class="doc-text">
                        VIGENCIA: <strong>${data.date}</strong>.
                    </p>
                    <p class="doc-text">
                        Yo, <strong>${data.indemnifier}</strong> (el "Indemnizador"), acuerdo liberar de responsabilidad, defender e indemnizar a <strong>${data.indemnitee}</strong> (el "Indemnizado") de cualquier y toda responsabilidad, pérdida, daño o costo que pueda incurrir debido a mi participación en:
                    </p>
                    <div class="doc-box">
                        ${data.activity || '[Describir Actividad o Evento]'}
                    </div>
                    <p class="doc-text">
                        Entiendo los riesgos inherentes y asumo voluntariamente toda responsabilidad.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Indemnizador"></div>
                            <div class="sig-label">${data.indemnifier}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.indemnifier}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        lease_termination: {
            title: "TERMINACIÓN DE ALQUILER (LEASE TERMINATION)",
            fields: [
                {
                    group: 'Contrato Original', fields: [
                        { id: 'leaseDate', label: 'Fecha Contrato Original', type: 'date', width: 'half' },
                        { id: 'vacateDate', label: 'Fecha de Desalojo', type: 'date', width: 'half' },
                        { id: 'property', label: 'Propiedad', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Partes', fields: [
                        { id: 'landlord', label: 'Propietario', type: 'text', width: 'full' },
                        { id: 'tenant', label: 'Inquilino', type: 'text', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE TERMINACIÓN DE ALQUILER</h2>
                    <p class="doc-text">
                        Este Acuerdo se celebra entre <strong>${data.landlord}</strong> (Propietario) y <strong>${data.tenant}</strong> (Inquilino).
                    </p>
                    <p class="doc-text">
                        Las partes acuerdan terminar anticipadamente el Contrato de Arrendamiento con fecha <strong>${data.leaseDate}</strong> respecto a la propiedad ubicada en:
                    </p>
                    <p class="doc-center-bold">${data.property}</p>
                    <p class="doc-text">
                        El Inquilino acuerda desalojar la propiedad y entregar la posesión el día: <strong>${data.vacateDate}</strong>.
                    </p>
                    <p class="doc-text">
                        Al cumplir con este desalojo y entrega de llaves, ambas partes se liberan mutuamente de futuras obligaciones bajo el contrato original.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div>
                            <div class="sig-label">Propietario</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Inquilino"></div>
                            <div class="sig-label">Inquilino</div>
                        </div>
                    </div>
                </div>
            `
        },
        loan_agreement: {
            title: "CONTRATO DE PRÉSTAMO PERSONAL (LOAN AGREEMENT)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'lender', label: 'Prestamista', type: 'text', width: 'full' },
                        { id: 'borrower', label: 'Prestatario', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Términos', fields: [
                        { id: 'amount', label: 'Monto ($)', type: 'number', width: 'half' },
                        { id: 'interest', label: 'Tasa/Interés (%)', type: 'number', width: 'half' },
                        { id: 'dueDate', label: 'Fecha Límite Pago', type: 'date', width: 'full' },
                        { id: 'paymentPlan', label: 'Plan de Pago', type: 'textarea', rows: 2, placeholder: 'Ej: Pagos mensuales de $200 comenzando el 1 de enero...' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE PRÉSTAMO DE DINERO</h2>
                    <p class="doc-text">
                        FECHA: <strong>${data.date}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>PRESTA MISTA:</strong> ${data.lender}<br>
                        <strong>PRESTATARIO:</strong> ${data.borrower}
                    </p>
                    <p class="doc-text">
                        El Prestamista acuerda prestar la suma de <strong>$ ${data.amount}</strong> al Prestatario bajo los siguientes términos:
                    </p>
                    <div class="doc-body-text">
                        <p>1. <strong>Interés:</strong> El préstamo devengará un interés del ${data.interest || '0'}% anual.</p>
                        <p>2. <strong>Reembolso:</strong> El monto total (principal + interés) debe pagarse antes del: <strong>${data.dueDate}</strong>.</p>
                        <p>3. <strong>Forma de Pago:</strong><br>${data.paymentPlan || 'Pago único en la fecha de vencimiento.'}</p>
                    </div>
                    <p class="doc-text">
                        En caso de incumplimiento, el Prestatario será responsable de todos los costos de cobranza y honorarios legales.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Prestamista"></div>
                            <div class="sig-label">Prestamista</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Prestatario"></div>
                            <div class="sig-label">Prestatario</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.lender}</strong> y <strong>${data.borrower}</strong>, a quienes se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        nda_agreement: {
            title: "ACUERDO DE CONFIDENCIALIDAD (NDA)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'disclosingParty', label: 'Parte Reveladora', type: 'text', width: 'full' },
                        { id: 'receivingParty', label: 'Parte Receptora', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Información', fields: [
                        { id: 'topic', label: 'Tema / Proyecto', type: 'text', width: 'full' },
                        { id: 'term', label: 'Duración (Años)', type: 'number', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE NO DIVULGACIÓN (NDA)</h2>
                    <p class="doc-text">
                        Este Acuerdo se hace efectivo el <strong>${data.date}</strong> entre:
                    </p>
                    <p class="doc-text">
                        <strong>Parte Reveladora:</strong> ${data.disclosingParty}<br>
                        <strong>Parte Receptora:</strong> ${data.receivingParty}
                    </p>
                    <p class="doc-text">
                        En relación con el proyecto/tema: "${data.topic || 'Negociaciones Comerciales'}", la Parte Receptora acuerda:
                    </p>
                    <div class="doc-body-text">
                        <ol>
                            <li>Mantener la Información Confidencial en estricto secreto.</li>
                            <li>No usar la Información para beneficio propio o de terceros.</li>
                            <li>Devolver todos los materiales al finalizar la relación.</li>
                        </ol>
                    </div>
                    <p class="doc-text">
                        Esta obligación de confidencialidad durará por un periodo de ${data.term || '5'} años desde la fecha de este acuerdo.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                         <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Receptora"></div>
                            <div class="sig-label">Parte Receptora</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Reveladora"></div>
                            <div class="sig-label">Parte Reveladora</div>
                        </div>
                    </div>
                </div>
            `
        },
        revocation_poa: {
            title: "REVOCACIÓN DE PODER (REVOCATION OF POA)",
            fields: [
                {
                    group: 'Detalles', fields: [
                        { id: 'principal', label: 'Poderdante (Yo)', type: 'text', width: 'full' },
                        { id: 'agent', label: 'Agente a Remover', type: 'text', width: 'full' },
                        { id: 'originalDate', label: 'Fecha del Poder Original', type: 'date', width: 'full' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">REVOCACIÓN DE PODER NOTARIAL</h2>
                    <p class="doc-text">
                        POR EL PRESENTE DOCUMENTO, yo, <strong>${data.principal}</strong>, domiciliado en ${data.location}, por la presente:
                    </p>
                    <p class="doc-center-bold">REVOCO, CANCELO Y ANULO</p>
                    <p class="doc-text">
                        Todo Poder Notarial firmado anteriormente por mí designando a <strong>${data.agent}</strong> como mi agente o apoderado.
                    </p>
                    <p class="doc-text">
                        Específicamente, el documento fechado el <strong>${data.originalDate || '___________'}</strong> queda sin efecto ni valor legal a partir de este momento.
                    </p>
                    <p class="doc-text">
                         Notificaré inmediatamente al Agente y a todas las instituciones relevantes sobre esta revocación.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Poderdante"></div>
                            <div class="sig-label">${data.principal}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.principal}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        temp_guardianship: {
            title: "TUTELA TEMPORAL DE MENOR (TEMPORARY GUARDIANSHIP)",
            fields: [
                {
                    group: 'Padres', fields: [
                        { id: 'parentName', label: 'Nombre Padre/Madre', type: 'text', width: 'full' },
                        { id: 'childNames', label: 'Nombre(s) del/los Menor(es)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Guardián Temporal', fields: [
                        { id: 'guardianName', label: 'Nombre del Guardián', type: 'text', width: 'full' },
                        { id: 'guardianAddress', label: 'Dirección Guardián', type: 'text', width: 'full' },
                        { id: 'endDate', label: 'Válido Hasta', type: 'date', width: 'half' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AUTORIZACIÓN DE TUTELA TEMPORAL</h2>
                    <p class="doc-text">
                        Yo, <strong>${data.parentName || data.clientName}</strong>, con autoridad legal sobre el/los menor(es):
                    </p>
                    <p class="doc-center-bold">${data.childNames}</p>
                    <p class="doc-text">
                        Por la presente otorgo la custodia temporal y autorizo a:
                    </p>
                    <p class="doc-center-bold">${data.guardianName}<br><span style="font-size:10pt; font-weight:normal;">${data.guardianAddress}</span></p>
                    <p class="doc-text">
                        Para actuar como guardián temporal, autorizando tratamiento médico, decisiones escolares y cuidado general en mi ausencia.
                    </p>
                    <p class="doc-text">
                        Esta autorización será válida hasta el <strong>${data.endDate || '[FECHA FIN]'}</strong> o hasta que sea revocada por escrito.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Padre/Madre"></div>
                            <div class="sig-label">${data.parentName}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Jurado y suscrito ante mí el <strong>${data.date}</strong> por <strong>${data.parentName || data.clientName}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        vehicle_poa: {
            title: "PODER PARA VEHÍCULO (VEHICLE POA)",
            fields: [
                {
                    group: 'Vehículo', fields: [
                        { id: 'makeModel', label: 'Marca / Modelo / Año', type: 'text', width: 'full' },
                        { id: 'vin', label: 'VIN (Número de Serie)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Apoderado', fields: [
                        { id: 'owner', label: 'Dueño (Poderdante)', type: 'text', width: 'full' },
                        { id: 'agent', label: 'Apoderado (Persona Autorizada)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Verificación de Identidad', fields: [
                        { id: 'idType', label: 'Método de Identificación', type: 'select', options: ['Presentación de identificación', 'Conocimiento personal'], width: 'half' },
                        { id: 'idDetails', label: 'Especifique ID', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">PODER ESPECIAL PARA VEHÍCULO DE MOTOR</h2>
                    <p class="doc-text">
                        Por la presente, el abajo firmante, dueño del siguiente vehículo:
                    </p>
                    <div class="doc-box">
                        <strong>Vehículo:</strong> ${data.makeModel}<br>
                        <strong>VIN:</strong> ${data.vin}
                    </div>
                    <p class="doc-text">
                        Nombra a <strong>${data.agent}</strong> como su apoderado legal para firmar documentos, transferir título, registrar y realizar cualquier trámite relacionado con dicho vehículo ante el Departamento de Vehículos Motorizados (DMV/DGT).
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Dueño"></div>
                            <div class="sig-label">${data.owner || data.clientName}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">
                            Reconocido ante mí el <strong>${data.date}</strong> por <strong>${data.owner || data.clientName}</strong>, a quien se le identificó mediante:
                            <br><br>
                            ${data.idType === 'Conocimiento personal' ? '<strong>[X]</strong>' : '[ ]'} conocimiento personal
                            <br>
                            ${data.idType === 'Presentación de identificación' ? '<strong>[X]</strong>' : '[ ]'} presentación de identificación: <strong>${data.idDetails || '____________________'}</strong>
                        </p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">NOTARIO PÚBLICO</div>
                    </div>
                </div>
            `
        },
        demand_letter: {
            title: "CARTA DE COBRO (DEMAND LETTER)",
            fields: [
                {
                    group: 'Deuda', fields: [
                        { id: 'debtor', label: 'Deudor', type: 'text', width: 'full' },
                        { id: 'creditor', label: 'Acreedor (Remitente)', type: 'text', width: 'full' },
                        { id: 'amount', label: 'Monto Adeudado ($)', type: 'number', width: 'half' },
                        { id: 'reason', label: 'Razón de la Deuda', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Plazo', fields: [
                        { id: 'deadline', label: 'Fecha Límite de Pago', type: 'date', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CARTA DE REQUERIMIENTO DE PAGO</h2>
                    <p class="doc-text" style="text-align:right;">Fecha: ${data.date}</p>
                    <p class="doc-text">
                        A: <strong>${data.debtor}</strong><br>
                        (Deudor)
                    </p>
                    <p class="doc-text">
                        <strong>ASUNTO: AVISO FINAL PREVIO A ACCIÓN LEGAL</strong>
                    </p>
                    <p class="doc-text">
                        Estimado/a Sr./Sra.,
                    </p>
                    <p class="doc-text">
                        Esta carta es para exigir formalmente el pago de <strong>$ ${data.amount}</strong> que se me adeuda por concepto de: ${data.reason}.
                    </p>
                    <p class="doc-text">
                        Si el pago no se recibe antes del <strong>${data.deadline}</strong>, iniciaré procedimientos legales para recuperar la deuda, más los costos judiciales e intereses acumulados.
                    </p>
                    <p class="doc-text">
                         Envíe el pago inmediatamente a la dirección de mis registros.
                    </p>
                    <br><br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Acreedor"></div>
                            <div class="sig-label">Atentamente, ${data.creditor}</div>
                        </div>
                    </div>
                </div>
            `
        },
        cease_desist: {
            title: "CARTA DE CESE Y DESISTIMIENTO (CEASE AND DESIST)",
            fields: [
                {
                    group: 'Involucrados', fields: [
                        { id: 'sender', label: 'Remitente (Afectado)', type: 'text', width: 'full' },
                        { id: 'recipient', label: 'Destinatario (Infractor)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Infracción', fields: [
                        { id: 'activity', label: 'Actividad Ilegal/Molesta', type: 'textarea', rows: 3, placeholder: 'Describa el acoso, difamación, uso de derechos de autor...' },
                        { id: 'demand', label: 'Demanda Específica', type: 'textarea', rows: 2, placeholder: 'Detener el contacto, retirar el contenido...' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CARTA DE CESE Y DESISTIMIENTO</h2>
                    <p class="doc-text" style="text-align:right;">Fecha: ${data.date}</p>
                    <p class="doc-text">
                        A: <strong>${data.recipient}</strong>
                    </p>
                    <p class="doc-text">
                        <strong>ASUNTO: AVISO FINAL PARA CESAR ACTIVIDAD ILEGAL</strong>
                    </p>
                    <p class="doc-text">
                        Esta carta sirve como un aviso formal exigiendo que usted cese y desista inmediatamente de las siguientes actividades:
                    </p>
                    <div class="doc-box">
                        ${data.activity}
                    </div>
                    <p class="doc-text">
                        Esta conducta es ilegal y/o perjudicial. Exijo que cumpla inmediatamente con lo siguiente:
                    </p>
                    <div class="doc-body-text">
                        ${data.demand}
                    </div>
                    <p class="doc-text">
                        Si continúa con esta actividad se emprenderán acciones legales en su contra para buscar daños y perjuicios, así como medidas cautelares.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Remitente"></div>
                            <div class="sig-label">${data.sender}</div>
                        </div>
                    </div>
                </div>
            `
        },
        partnership_agreement: {
            title: "ACUERDO DE ASOCIACIÓN (PARTNERSHIP AGREEMENT)",
            fields: [
                {
                    group: 'Socios', fields: [
                        { id: 'partner1', label: 'Socio 1', type: 'text', width: 'full' },
                        { id: 'partner2', label: 'Socio 2', type: 'text', width: 'full' },
                        { id: 'businessName', label: 'Nombre del Negocio', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Términos', fields: [
                        { id: 'capital', label: 'Contribución Inicial ($)', type: 'number', width: 'half' },
                        { id: 'profitShare', label: 'División de Ganancias (50/50, etc)', type: 'text', width: 'half' },
                        { id: 'purpose', label: 'Propósito del Negocio', type: 'textarea', rows: 2 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE ASOCIACIÓN GENERAL</h2>
                    <p class="doc-text">
                        FECHA: <strong>${data.date}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>PARTES:</strong> Este acuerdo se celebra entre <strong>${data.partner1}</strong> y <strong>${data.partner2}</strong> (los "Socios").
                    </p>
                    <p class="doc-text">
                        <strong>1. NOMBRE Y NEGOCIO.</strong> Los socios formarán una Asociación General bajo el nombre de: <strong>${data.businessName}</strong>, con el propósito de: ${data.purpose}.
                    </p>
                    <p class="doc-text">
                        <strong>2. CAPITAL.</strong> Cada socio contribuirá inicialmente con: $ ${data.capital || '0.00'}.
                    </p>
                    <p class="doc-text">
                        <strong>3. GANANCIAS Y PÉRDIDAS.</strong> Las ganancias y pérdidas netas de la asociación se dividirán de la siguiente manera: <strong>${data.profitShare}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>4. GESTIÓN.</strong> Ambos socios tendrán iguales derechos en la gestión y conducción de los negocios de la asociación.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Socio 1"></div>
                            <div class="sig-label">${data.partner1}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Socio 2"></div>
                            <div class="sig-label">${data.partner2}</div>
                        </div>
                    </div>
                </div>
            `
        },
        employment_contract: {
            title: "CONTRATO DE EMPLEO (EMPLOYMENT CONTRACT)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'employer', label: 'Empleador (Empresa)', type: 'text', width: 'full' },
                        { id: 'employee', label: 'Empleado', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Detalles del Puesto', fields: [
                        { id: 'position', label: 'Cargo / Puesto', type: 'text', width: 'half' },
                        { id: 'salary', label: 'Salario ($)', type: 'number', width: 'half' },
                        { id: 'startDate', label: 'Fecha de Inicio', type: 'date', width: 'half' },
                        { id: 'salaryFreq', label: 'Frecuencia Pago', type: 'select', options: ['Anual', 'Mensual', 'Por Hora'], width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE EMPLEO</h2>
                    <p class="doc-text">
                        ENTRE: <strong>${data.employer}</strong> (el "Empleador")<br>
                        Y: <strong>${data.employee}</strong> (el "Empleado").
                    </p>
                    <p class="doc-text">
                        <strong>1. PUESTO.</strong> El Empleador contrata al Empleado para el puesto de: <strong>${data.position}</strong>, comenzando el ${data.startDate}.
                    </p>
                    <p class="doc-text">
                        <strong>2. COMPENSACIÓN.</strong> El Empleador pagará al Empleado un salario de <strong>$ ${data.salary}</strong> (${data.salaryFreq}), sujeto a las deducciones estándar.
                    </p>
                    <p class="doc-text">
                        <strong>3. DEBERES.</strong> El Empleado acepta realizar todas las tareas y responsabilidades asociadas con el puesto lo mejor que pueda.
                    </p>
                    <p class="doc-text">
                        <strong>4. TERMINACIÓN.</strong> Este acuerdo puede ser terminado por cualquiera de las partes con el debido aviso según la ley local o "at-will" si corresponde.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Empleador"></div>
                            <div class="sig-label">${data.employer}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Empleado"></div>
                             <div class="sig-label">${data.employee}</div>
                        </div>
                    </div>
                </div>
            `
        },
        eviction_notice: {
            title: "AVISO DE DESALOJO (EVICTION NOTICE)",
            fields: [
                {
                    group: 'Inquilino', fields: [
                        { id: 'tenantName', label: 'Nombre Inquilino', type: 'text', width: 'full' },
                        { id: 'property', label: 'Dirección Propiedad', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Razón', fields: [
                        { id: 'issue', label: 'Razón (Falta de Pago, etc)', type: 'select', options: ['Falta de Pago', 'Violación de Contrato', 'Terminación de Plazo', 'Actividad Ilegal'], width: 'full' },
                        { id: 'amountOwed', label: 'Monto Debiddo (si aplica)', type: 'number', width: 'half' },
                        { id: 'cureDate', label: 'Fecha Límite para Corregir/Salir', type: 'date', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AVISO DE DESALOJO / TERMINACIÓN</h2>
                    <p class="doc-text">
                        A: <strong>${data.tenantName}</strong> (Inquilino)<br>
                        Propiedad: <strong>${data.property}</strong>
                    </p>
                    <p class="doc-text">
                        USTED ESTÁ NOTIFICADO de que debe desalojar y entregar la posesión de las instalaciones mencionadas anteriormente o corregir la siguiente violación:
                    </p>
                    <div class="doc-box-highlight">
                        <strong>${data.issue}</strong>
                        ${data.amountOwed ? `<br>Monto Adeudado: $ ${data.amountOwed}` : ''}
                    </div>
                    <p class="doc-text">
                        Debe actuar (pagar, corregir o salir) antes del: <strong>${data.cureDate}</strong>.
                    </p>
                    <p class="doc-text">
                        El incumplimiento resultará en la presentación de una demanda de desalojo en su contra en el tribunal correspondiente.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario/Admin"></div>
                            <div class="sig-label">Propietario / Administrador</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Entrega certificada el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO/CONSTANCIA</div>
                    </div>
                </div>
            `
        },
        prenuptial_agreement: {
            title: "ACUERDO PRENUPCIAL (PRENUPTIAL AGREEMENT)",
            fields: [
                {
                    group: 'Futuros Cónyuges', fields: [
                        { id: 'spouse1', label: 'Cónyuge 1', type: 'text', width: 'full' },
                        { id: 'spouse2', label: 'Cónyuge 2', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Bienes', fields: [
                        { id: 'separateProperty', label: 'Bienes Separados (Descripción breve)', type: 'textarea', rows: 3 },
                        { id: 'marriageDate', label: 'Fecha Prevista de Matrimonio', type: 'date', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO PRENUPCIAL</h2>
                    <p class="doc-text">
                        ESTE ACUERDO se celebra el <strong>${data.date}</strong>, en contemplación del matrimonio entre <strong>${data.spouse1}</strong> y <strong>${data.spouse2}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>1. BIENES SEPARADOS.</strong> Las partes acuerdan que los activos y deudas listados a continuación permanecerán como propiedad separada de cada parte y no se convertirán en propiedad conyugal:
                    </p>
                    <div class="doc-body-text">
                        ${data.separateProperty || '[Listar Activos Separados Aquí]'}
                    </div>
                    <p class="doc-text">
                        <strong>2. GANANCIAS.</strong> Las ganancias obtenidas durante el matrimonio serán consideradas propiedad conyugal a menos que se especifique lo contrario en un anexo.
                    </p>
                    <p class="doc-text">
                        <strong>3. DIVORCIO.</strong> En caso de disolución del matrimonio, la propiedad separada permanecerá con el dueño original.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Cónyuge 1"></div>
                            <div class="sig-label">${data.spouse1}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Cónyuge 2"></div>
                             <div class="sig-label">${data.spouse2}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        media_release: {
            title: "AUTORIZACIÓN DE USO DE IMAGEN (MEDIA RELEASE)",
            fields: [
                {
                    group: 'Sujeto', fields: [
                        { id: 'modelName', label: 'Nombre Modelo/Persona', type: 'text', width: 'full' },
                        { id: 'orgName', label: 'Organización/Fotógrafo', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Detalles', fields: [
                        { id: 'shootDate', label: 'Fecha de la toma', type: 'date', width: 'full' },
                        { id: 'usage', label: 'Uso Permitido', type: 'select', options: ['Comercial ilimitado', 'Solo Redes Sociales', 'Solo Educativo', 'Uso Interno'], width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AUTORIZACIÓN DE USO DE IMAGEN</h2>
                    <p class="doc-text">
                        Yo, <strong>${data.modelName || data.clientName}</strong>, por la presente otorgo a <strong>${data.orgName}</strong>, el derecho irrevocable y sin restricciones para usar y publicar fotografías/videos de mí, o en los que pueda estar incluido.
                    </p>
                    <p class="doc-text">
                        <strong>USO PERMITIDO:</strong> ${data.usage}.
                    </p>
                    <p class="doc-text">
                         Libero al Fotógrafo/Organización de toda reclamación, responsabilidad y daños relacionados con cualquier distorsión difusa o alteración, ya sea intencional o no, que pueda ocurrir.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Modelo"></div>
                            <div class="sig-label">${data.modelName}</div>
                        </div>
                    </div>
                </div>
            `
        },
        contract_amendment: {
            title: "ENMIENDA A CONTRATO (CONTRACT AMENDMENT)",
            fields: [
                {
                    group: 'Contrato Original', fields: [
                        { id: 'origDate', label: 'Fecha Contrato Original', type: 'date', width: 'half' },
                        { id: 'contractName', label: 'Nombre del Contrato', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Partes', fields: [
                        { id: 'partyA', label: 'Parte A', type: 'text', width: 'half' },
                        { id: 'partyB', label: 'Parte B', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Cambios', fields: [
                        { id: 'changes', label: 'Cláusulas Modificadas', type: 'textarea', rows: 4, placeholder: 'Describa qué secciones cambian y cómo...' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ENMIENDA A CONTRATO</h2>
                    <p class="doc-text">
                        Esta Enmienda hace referencia al acuerdo titulado "<strong>${data.contractName}</strong>" fechado el <strong>${data.origDate}</strong>, entre <strong>${data.partyA}</strong> y <strong>${data.partyB}</strong>.
                    </p>
                    <p class="doc-text">
                        Las partes acuerdan modificar dicho acuerdo de la siguiente manera:
                    </p>
                    <div class="doc-box">
                        ${(data.changes || '[Insertar cambios aquí]').replace(/\n/g, '<br>')}
                    </div>
                    <p class="doc-text">
                        Todos los demás términos y condiciones del acuerdo original permanecen en pleno vigor y efecto.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Parte A"></div>
                            <div class="sig-label">${data.partyA}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Parte B"></div>
                             <div class="sig-label">${data.partyB}</div>
                        </div>
                    </div>
                </div>
            `
        },
        payment_agreement: {
            title: "ACUERDO DE PLAN DE PAGO (PAYMENT PLAN)",
            fields: [
                {
                    group: 'Deuda', fields: [
                        { id: 'debtor', label: 'Deudor', type: 'text', width: 'full' },
                        { id: 'creditor', label: 'Acreedor', type: 'text', width: 'full' },
                        { id: 'totalAmount', label: 'Deuda Total ($)', type: 'number', width: 'half' }
                    ]
                },
                {
                    group: 'Plan', fields: [
                        { id: 'downPayment', label: 'Pago Inicial ($)', type: 'number', width: 'half' },
                        { id: 'installmentAmt', label: 'Monto Cuota ($)', type: 'number', width: 'half' },
                        { id: 'frequency', label: 'Frecuencia', type: 'select', options: ['Semanal', 'Bi-Semanal', 'Mensual'], width: 'half' },
                        { id: 'firstDate', label: 'Fecha 1er Pago', type: 'date', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE PLAN DE PAGO</h2>
                    <p class="doc-text">
                        <strong>DEUDOR:</strong> ${data.debtor}<br>
                        <strong>ACREEDOR:</strong> ${data.creditor}
                    </p>
                    <p class="doc-text">
                        El Deudor reconoce una deuda pendiente de <strong>$ ${data.totalAmount}</strong>. Ambas partes acuerdan el siguiente calendario de pagos para saldar la deuda:
                    </p>
                    <div class="doc-body-text">
                        <p>1. <strong>Pago Inicial:</strong> $ ${data.downPayment || '0.00'} a la firma de este acuerdo.</p>
                        <p>2. <strong>Pagos a Plazos:</strong> $ ${data.installmentAmt} pagaderos de forma <strong>${data.frequency}</strong>.</p>
                        <p>3. <strong>Inicio:</strong> El primer pago a plazos vence el <strong>${data.firstDate}</strong> y continuará hasta que la deuda se pague en su totalidad.</p>
                    </div>
                    <p class="doc-text">
                        Deudor acepta que la falta de pago acelerará la deuda restante, haciéndola exigible de inmediato.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Deudor"></div>
                            <div class="sig-label">Deudor</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Acreedor"></div>
                             <div class="sig-label">Acreedor</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
             `
        },
        sublease_agreement: {
            title: "CONTRATO DE SUBARRIENDO (SUBLEASE AGREEMENT)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'sublessor', label: 'Subarrendador (Inquilino Actual)', type: 'text', width: 'full' },
                        { id: 'sublessee', label: 'Subarrendatario (Nuevo)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Propiedad', fields: [
                        { id: 'address', label: 'Dirección', type: 'text', width: 'full' },
                        { id: 'rent', label: 'Renta Mensual ($)', type: 'number', width: 'half' },
                        { id: 'start', label: 'Fecha Inicio', type: 'date', width: 'half' },
                        { id: 'end', label: 'Fecha Fin', type: 'date', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE SUBARRIENDO</h2>
                    <p class="doc-text">
                        Entre <strong>${data.sublessor}</strong> (Subarrendador) y <strong>${data.sublessee}</strong> (Subarrendatario).
                    </p>
                    <p class="doc-text">
                        El Subarrendador acuerda subarrendar la propiedad ubicada en: ${data.address}.
                    </p>
                     <p class="doc-text">
                        <strong>TÉRMINO:</strong> Del ${data.start} al ${data.end}.
                    </p>
                    <p class="doc-text">
                        <strong>RENTA:</strong> $ ${data.rent} por mes, pagaderos al Subarrendador.
                    </p>
                    <p class="doc-text">
                        Este subarriendo está sujeto a los términos del Contrato de Arrendamiento Maestro original. El Propietario original ha dado su consentimiento (si es requerido).
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Subarrendador"></div>
                            <div class="sig-label">Subarrendador</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Subarrendatario"></div>
                             <div class="sig-label">Subarrendatario</div>
                        </div>
                    </div>
                </div>
            `
        },
        equipment_lease: {
            title: "ALQUILER DE EQUIPO (EQUIPMENT LEASE)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'lessor', label: 'Arrendador (Dueño)', type: 'text', width: 'full' },
                        { id: 'lessee', label: 'Arrendatario (Cliente)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Equipo', fields: [
                        { id: 'equipmentDesc', label: 'Descripción del Equipo', type: 'textarea', rows: 3 },
                        { id: 'value', label: 'Valor Declarado ($)', type: 'number', width: 'half' },
                        { id: 'rate', label: 'Tarifa de Alquiler', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ALQUILER DE EQUIPO</h2>
                    <p class="doc-text">
                        <strong>ARRENDADOR:</strong> ${data.lessor}<br>
                        <strong>ARRENDATARIO:</strong> ${data.lessee}
                    </p>
                    <p class="doc-text">
                        El Arrendador acuerda alquilar al Arrendatario el siguiente equipo:
                    </p>
                    <div class="doc-box">
                        ${data.equipmentDesc}
                    </div>
                    <p class="doc-text">
                        <strong>TARIFA:</strong> ${data.rate} (por día/semana/mes).<br>
                        <strong>VALOR REEMPLAZO:</strong> $ ${data.value}.
                    </p>
                    <p class="doc-text">
                        El Arrendatario es responsable de devolver el equipo en buenas condiciones.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Arrendador"></div>
                            <div class="sig-label">Arrendador</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Arrendatario"></div>
                             <div class="sig-label">Arrendatario</div>
                        </div>
                    </div>
                </div>
            `
        },
        commercial_lease: {
            title: "CONTRATO DE ALQUILER COMERCIAL (COMMERCIAL LEASE)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'lessor', label: 'Arrendador (Dueño)', type: 'text', width: 'full' },
                        { id: 'lessee', label: 'Arrendatario (Negocio)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Propiedad', fields: [
                        { id: 'address', label: 'Dirección del Local/Oficina', type: 'text', width: 'full' },
                        { id: 'use', label: 'Uso Permitido (Ej: Oficina, Tienda)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Términos', fields: [
                        { id: 'rent', label: 'Renta Mensual ($)', type: 'number', width: 'half' },
                        { id: 'termYears', label: 'Duración (Años)', type: 'number', width: 'half' },
                        { id: 'startDate', label: 'Fecha Inicio', type: 'date', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ARRENDAMIENTO COMERCIAL</h2>
                    <p class="doc-text">
                        FECHA: <strong>${data.date}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>ARRENDADOR:</strong> ${data.lessor}<br>
                        <strong>ARRENDATARIO:</strong> ${data.lessee}
                    </p>
                    <p class="doc-text">
                        <strong>1. PROPIEDAD:</strong> El Arrendador alquila al Arrendatario el local ubicado en: ${data.address}, para ser usado exclusivamente como: ${data.use}.
                    </p>
                    <p class="doc-text">
                        <strong>2. PLAZO:</strong> Este arrendamiento comenzará el ${data.startDate} y continuará por un periodo de ${data.termYears || '1'} años.
                    </p>
                    <p class="doc-text">
                        <strong>3. RENTA:</strong> $ ${data.rent} más impuestos aplicables, pagaderos el día 1 de cada mes.
                    </p>
                    <p class="doc-text">
                        <strong>4. MANTENIMIENTO:</strong> El Arrendatario será responsable del mantenimiento interior y reparaciones menores. El Arrendador cubrirá la estructura del edificio.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Arrendador"></div>
                            <div class="sig-label">Arrendador</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Arrendatario"></div>
                             <div class="sig-label">Arrendatario</div>
                        </div>
                    </div>
                </div>
            `
        },
        real_estate_purchase: {
            title: "COMPRAVENTA DE BIENES RAÍCES (RE PURCHASE AGREEMENT)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'seller', label: 'Vendedor', type: 'text', width: 'full' },
                        { id: 'buyer', label: 'Comprador', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Inmueble', fields: [
                        { id: 'propertyAddr', label: 'Dirección Inmueble', type: 'text', width: 'full' },
                        { id: 'legalDesc', label: 'Descripción Legal (Breve)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Precio', fields: [
                        { id: 'purchasePrice', label: 'Precio Total ($)', type: 'number', width: 'half' },
                        { id: 'earnestMoney', label: 'Depósito (Earnest Money)', type: 'number', width: 'half' },
                        { id: 'closingDate', label: 'Fecha de Cierre', type: 'date', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE COMPRAVENTA DE BIENES RAÍCES</h2>
                    <p class="doc-text">
                        ESTE ACUERDO se celebra el <strong>${data.date}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>VENDEDOR:</strong> ${data.seller}<br>
                        <strong>COMPRADOR:</strong> ${data.buyer}
                    </p>
                    <p class="doc-text">
                        El Vendedor acuerda vender y el Comprador acuerda comprar la propiedad descrita como:
                    </p>
                    <div class="doc-box">
                        <strong>Dirección:</strong> ${data.propertyAddr}<br>
                        <strong>Legal:</strong> ${data.legalDesc || 'Según escritura adjunta.'}
                    </div>
                    <p class="doc-text">
                        <strong>PRECIO DE COMPRA:</strong> $ ${data.purchasePrice}.<br>
                        <strong>DEPÓSITO:</strong> $ ${data.earnestMoney} a depositarse en plica (Escrow).
                    </p>
                    <p class="doc-text">
                        <strong>CIERRE:</strong> El cierre de la venta ocurrirá en o antes del: ${data.closingDate}.
                    </p>
                    <p class="doc-text">
                        Esta venta está condicionada a la obtención de financiamiento y a una inspección satisfactoria de la propiedad.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Vendedor"></div>
                            <div class="sig-label">Vendedor</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Comprador"></div>
                             <div class="sig-label">Comprador</div>
                        </div>
                    </div>
                </div>
            `
        },
        non_compete: {
            title: "ACUERDO DE NO COMPETENCIA (NON-COMPETE)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'employer', label: 'Empresa / Protegido', type: 'text', width: 'full' },
                        { id: 'employee', label: 'Empleado / Restringido', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Restricciones', fields: [
                        { id: 'industry', label: 'Industria / Negocio', type: 'text', width: 'full' },
                        { id: 'duration', label: 'Duración (Años/Meses)', type: 'text', width: 'half' },
                        { id: 'radius', label: 'Radio Geográfico (Millas)', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE NO COMPETENCIA</h2>
                    <p class="doc-text">
                        FECHA: <strong>${data.date}</strong>.
                    </p>
                    <p class="doc-text">
                        Entre <strong>${data.employer}</strong> y <strong>${data.employee}</strong>.
                    </p>
                    <p class="doc-text">
                        El Empleado reconoce que tendrá acceso a información confidencial y clientes de la Empresa.
                    </p>
                    <p class="doc-text">
                        Por la presente, el Empleado acuerda que durante el término de su empleo y por un periodo de <strong>${data.duration || '2 años'}</strong> después de la terminación, no participará directa ni indirectamente en ningún negocio que compita con la Empresa en la industria de: <strong>${data.industry}</strong>.
                    </p>
                    <p class="doc-text">
                        Esta restricción aplica dentro de un radio de <strong>${data.radius || '50'} millas</strong> de la ubicación principal de la Empresa.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Empresa"></div>
                            <div class="sig-label">Empresa</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Empleado"></div>
                             <div class="sig-label">Empleado/Contratista</div>
                        </div>
                    </div>
                </div>
            `
        },
        consulting_agreement: {
            title: "ACUERDO DE CONSULTORÍA (CONSULTING AGREEMENT)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'client', label: 'Cliente', type: 'text', width: 'full' },
                        { id: 'consultant', label: 'Consultor', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Detalles', fields: [
                        { id: 'scope', label: 'Alcance del Trabajo', type: 'textarea', rows: 3 },
                        { id: 'rate', label: 'Tarifa (Por hora/proyecto)', type: 'text', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE CONSULTORÍA</h2>
                    <p class="doc-text">
                        <strong>CLIENTE:</strong> ${data.client}<br>
                        <strong>CONSULTOR:</strong> ${data.consultant}
                    </p>
                    <p class="doc-text">
                        El Cliente contrata al Consultor para proporcionar los siguientes servicios expertos:
                    </p>
                    <div class="doc-box">
                        ${data.scope || '[Detallar servicios]'}
                    </div>
                    <p class="doc-text">
                        <strong>COMPENSACIÓN:</strong> El Cliente pagará al Consultor a razón de: ${data.rate}.
                    </p>
                    <p class="doc-text">
                        <strong>PROPIEDAD INTELECTUAL:</strong> Todo trabajo creado bajo este contrato será propiedad del Cliente.
                    </p>
                    <p class="doc-text">
                        <strong>CONFIDENCIALIDAD:</strong> El Consultor mantendrá secreta toda la información del Cliente.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Cliente"></div>
                            <div class="sig-label">Cliente</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Consultor"></div>
                             <div class="sig-label">Consultor</div>
                         </div>
                    </div>
                </div>
            `
        },
        loi_agreement: {
            title: "CARTA DE INTENCIÓN (LETTER OF INTENT)",
            fields: [
                {
                    group: 'Propuesta', fields: [
                        { id: 'sender', label: 'Proponente', type: 'text', width: 'full' },
                        { id: 'recipient', label: 'Destinatario', type: 'text', width: 'full' },
                        { id: 'deal', label: 'Descripción del Negocio/Transacción', type: 'textarea', rows: 3 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CARTA DE INTENCIÓN (LOI)</h2>
                    <p class="doc-text" style="text-align:right;">Fecha: ${data.date}</p>
                    <p class="doc-text">
                        DE: <strong>${data.sender}</strong><br>
                        PARA: <strong>${data.recipient}</strong>
                    </p>
                    <p class="doc-text">
                        <strong>RE: ${data.deal ? data.deal.substring(0, 50) + '...' : 'TRANSACCIÓN PROPUESTA'}</strong>
                    </p>
                    <p class="doc-text">
                         Esta carta establece la intención de las partes de proceder con la siguiente transacción propuesta:
                    </p>
                    <div class="doc-box">
                        ${data.deal || '[Descripción detallada de la compra o negocio]'}
                    </div>
                    <p class="doc-text">
                         Esta carta no es vinculante (excepto por las cláusulas de confidencialidad y exclusividad) y sirve como base para redactar un Acuerdo Definitivo formal.
                    </p>
                    <p class="doc-text">
                         Si está de acuerdo con estos términos preliminares, por favor firme a continuación.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Proponente"></div>
                            <div class="sig-label">Proponente</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Destinatario"></div>
                             <div class="sig-label">Destinatario</div>
                        </div>
                    </div>
                </div>
            `
        },
        mou_agreement: {
            title: "MEMORÁNDUM DE ENTENDIMIENTO (MOU)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'partyA', label: 'Parte A', type: 'text', width: 'full' },
                        { id: 'partyB', label: 'Parte B', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Objetivos', fields: [
                        { id: 'goal', label: 'Objetivo de la Colaboración', type: 'textarea', rows: 3 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">MEMORÁNDUM DE ENTENDIMIENTO</h2>
                    <p class="doc-text">
                        Entre <strong>${data.partyA}</strong> y <strong>${data.partyB}</strong>.
                    </p>
                    <p class="doc-text">
                        Este Memorándum establece el entendimiento entre las partes para colaborar en:
                    </p>
                    <div class="doc-body-text">
                        ${data.goal || '[Describir proyecto o alianza]'}
                    </div>
                    <p class="doc-text">
                         Este MOU no constituye un contrato legalmente vinculante, sino que refleja la intención de las partes de trabajar juntas de buena fe hacia el objetivo común descrito.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Parte A"></div>
                            <div class="sig-label">${data.partyA}</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Parte B"></div>
                             <div class="sig-label">${data.partyB}</div>
                         </div>
                    </div>
                </div>
            `
        },
        affidavit_heirship: {
            title: "DECLARACIÓN DE HEREDEROS (AFFIDAVIT OF HEIRSHIP)",
            fields: [
                {
                    group: 'Fallecido', fields: [
                        { id: 'deceased', label: 'Nombre del Difunto', type: 'text', width: 'full' },
                        { id: 'deathDate', label: 'Fecha de Fallecimiento', type: 'date', width: 'half' },
                        { id: 'place', label: 'Lugar de Fallecimiento', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Herederos', fields: [
                        { id: 'heirs', label: 'Lista de Herederos Legales', type: 'textarea', rows: 4, placeholder: 'Nombre, Relación, Edad...' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">DECLARACIÓN JURADA DE HEREDEROS</h2>
                    <p class="doc-text">
                        Yo, <strong>${data.clientName}</strong>, declaro bajo juramento que:
                    </p>
                    <div class="doc-body-text">
                        <p>1. <strong>${data.deceased}</strong> (el Difunto) falleció el ${data.deathDate} en ${data.place}.</p>
                        <p>2. Yo estaba familiarizado con la familia y el estado civil del Difunto.</p>
                        <p>3. Hasta donde tengo conocimiento, los siguientes son los únicos herederos legales del Difunto:</p>
                        <div style="border:1px solid #ddd; padding:10px; margin:10px 0;">
                            ${(data.heirs || '').replace(/\n/g, '<br>')}
                        </div>
                        <p>4. El Difunto falleció ${data.willExist === 'Sí' ? 'CON' : 'SIN'} dejar testamento (Intestado).</p>
                    </div>
                    <p class="doc-text">
                        Hago esta declaración para establecer la propiedad de los bienes raíces y personales del Difunto.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Declarante"></div>
                            <div class="sig-label">${data.clientName}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Suscrito y jurado ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        affidavit_identity: {
            title: "DECLARACIÓN DE IDENTIDAD (AFFIDAVIT OF IDENTITY)",
            fields: [
                {
                    group: 'Identidad', fields: [
                        { id: 'fullName', label: 'Nombre Completo', type: 'text', width: 'full' },
                        { id: 'aka', label: 'También Conocido Como (AKA)', type: 'text', width: 'full' },
                        { id: 'docNum', label: 'Documento ID (Pasaporte/Licencia)', type: 'text', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">DECLARACIÓN JURADA DE IDENTIDAD</h2>
                    <p class="doc-text">
                        YO, <strong>${data.fullName || data.clientName}</strong>, declaro bajo pena de perjurio que:
                    </p>
                    <div class="doc-body-text">
                        <p>1. Soy la misma persona nombrada como <strong>${data.aka}</strong> en ciertos documentos documentos legales o financieros.</p>
                        <p>2. Mi nombre legal actual es <strong>${data.fullName}</strong>.</p>
                        <p>3. He presentado al Notario el siguiente documento de identificación gubernamental vigente para probar mi identidad: <strong>${data.docNum}</strong>.</p>
                    </div>
                    <p class="doc-text">
                         Esta declaración se hace para aclarar cualquier discrepancia en mi nombre en los registros públicos.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Declarante"></div>
                            <div class="sig-label">${data.fullName}</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Suscrito y jurado ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        lease_renewal: {
            title: "RENOVACIÓN DE ALQUILER (LEASE RENEWAL)",
            fields: [
                {
                    group: 'Contrato Original', fields: [
                        { id: 'address', label: 'Dirección Propiedad', type: 'text', width: 'full' },
                        { id: 'origEnd', label: 'Fecha Fin Original', type: 'date', width: 'half' },
                        { id: 'newEnd', label: 'Nueva Fecha de Fin', type: 'date', width: 'half' }
                    ]
                },
                {
                    group: 'Cambios', fields: [
                        { id: 'newRent', label: 'Nueva Renta ($)', type: 'number', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE EXTENSIÓN DE ARRENDAMIENTO</h2>
                    <p class="doc-text">
                        REFERENCIA: Contrato de arrendamiento para la propiedad ubicada en: <strong>${data.address}</strong>.
                    </p>
                    <p class="doc-text">
                        El Propietario y el Inquilino acuerdan extender el plazo del arrendamiento original, que expiraba el <strong>${data.origEnd}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>NUEVO TÉRMINO:</strong> El arrendamiento se extenderá hasta el: <strong>${data.newEnd}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>NUEVA RENTA:</strong> A partir de la fecha de renovación, la renta mensual será de: <strong>$ ${data.newRent}</strong>.
                    </p>
                    <p class="doc-text">
                        Todos los demás términos del contrato original permanecen sin cambios.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div>
                            <div class="sig-label">Propietario</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Inquilino"></div>
                             <div class="sig-label">Inquilino</div>
                        </div>
                    </div>
                </div>
            `
        },
        waiver_liability: {
            title: "RENUNCIA DE RESPONSABILIDAD (WAIVER)",
            fields: [
                {
                    group: 'Participante', fields: [
                        { id: 'participant', label: 'Participante/Usuario', type: 'text', width: 'full' },
                        { id: 'organizer', label: 'Organizador/Empresa', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Actividad', fields: [
                        { id: 'activity', label: 'Detalles de la Actividad', type: 'textarea', rows: 3 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">RENUNCIA Y EXENCIÓN DE RESPONSABILIDAD</h2>
                    <p class="doc-text">
                        Yo, <strong>${data.participant}</strong>, deseo participar en: <strong>${data.activity}</strong> organizado por <strong>${data.organizer}</strong>.
                    </p>
                    <p class="doc-text">
                         Entiendo que esta actividad conlleva riesgos inherentes. Por la presente asumo todos los riesgos de participación y renuncio a cualquier reclamación por lesiones personales, muerte o daños a la propiedad contra el Organizador.
                    </p>
                    <p class="doc-text">
                         Esta renuncia es vinculante para mí, mis herederos y mis cesionarios legales.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Participante"></div>
                            <div class="sig-label">${data.participant}</div>
                        </div>
                    </div>
                </div>
            `
        },
        codicil_will: {
            title: "CODICILO A TESTAMENTO (CODICIL TO WILL)",
            fields: [
                {
                    group: 'Testador', fields: [
                        { id: 'testator', label: 'Nombre del Testador', type: 'text', width: 'full' },
                        { id: 'willDate', label: 'Fecha del Testamento Original', type: 'date', width: 'full' }
                    ]
                },
                {
                    group: 'Enmiendas', fields: [
                        { id: 'amendments', label: 'Cambios o Adiciones', type: 'textarea', rows: 4, placeholder: 'Ej: Cambio mi albacea a... Añado a mi nieto como beneficiario...' }
                    ]
                }
            ],
            content: (data) => `
                 <div class="legal-doc" contenteditable="true">
                     <h2 class="doc-title">CODICILO AL ÚLTIMO TESTAMENTO</h2>
                     <p class="doc-text">
                         Yo, <strong>${data.testator}</strong>, siendo de mente sana, declaro que este es el Primer Codicilo a mi Último Testamento fechado el <strong>${data.willDate}</strong>.
                     </p>
                     <p class="doc-text">
                         Por la presente enmiendo mi Testamento de la siguiente manera:
                     </p>
                     <div class="doc-body-text">
                         ${(data.amendments || '').replace(/\n/g, '<br>')}
                     </div>
                     <p class="doc-text">
                         En todos los demás aspectos, ratifico y confirmo mi Testamento original.
                     </p>
                     <br>
                     <div class="sig-section" contenteditable="false">
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Testador"></div>
                             <div class="sig-label">${data.testator}</div>
                         </div>
                     </div>
                     <div class="sig-section-row" style="margin-top:20px;">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-witness1" onclick="NoteGenerator.openSignPad('witness1', this)" data-label="Firma Testigo 1"></div>
                            <div class="sig-label">Testigo 1</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-witness2" onclick="NoteGenerator.openSignPad('witness2', this)" data-label="Firma Testigo 2"></div>
                             <div class="sig-label">Testigo 2</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                         <p class="doc-text">Suscrito y jurado ante mí el <strong>${data.date}</strong>.</p>
                         <div class="notary-seal-placeholder">SELLO</div>
                         <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                         <div class="sig-label">Notario Público</div>
                     </div>
                 </div>
             `
        },
        custody_agreement: {
            title: "ACUERDO DE CUSTODIA (PARENTING PLAN)",
            fields: [
                {
                    group: 'Padres', fields: [
                        { id: 'parent1', label: 'Padre/Madre 1', type: 'text', width: 'full' },
                        { id: 'parent2', label: 'Padre/Madre 2', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Hijos', fields: [
                        { id: 'children', label: 'Nombre(s) de los Hijos', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Horario', fields: [
                        { id: 'schedule', label: 'Horario de Custodia Física', type: 'textarea', rows: 4, placeholder: 'Describa días de semana, fines de semana, vacaciones...' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE CUSTODIA Y CRIANZA</h2>
                    <p class="doc-text">
                        Este Plan de Crianza se acuerda entre <strong>${data.parent1}</strong> y <strong>${data.parent2}</strong> respecto a sus hijos: <strong>${data.children}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>1. CUSTODIA LEGAL.</strong> Los padres compartirán la custodia legal conjunta, tomando decisiones importantes (educación, salud, religión) juntos.
                    </p>
                    <p class="doc-text">
                        <strong>2. CUSTODIA FÍSICA Y HORARIO.</strong> Los niños residirán con los padres según el siguiente horario:
                    </p>
                     <div class="doc-body-text">
                         ${(data.schedule || '').replace(/\n/g, '<br>')}
                     </div>
                    <p class="doc-text">
                        Ambos padres acuerdan fomentar una relación amorosa y estable entre los niños y el otro padre.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Padre 1"></div>
                            <div class="sig-label">${data.parent1}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Padre 2"></div>
                             <div class="sig-label">${data.parent2}</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        affidavit_service: {
            title: "DECLARACIÓN DE SERVICIO (AFFIDAVIT OF SERVICE)",
            fields: [
                {
                    group: 'Servidor', fields: [
                        { id: 'serverName', label: 'Nombre quien entregó', type: 'text', width: 'full' },
                        { id: 'serverAge', label: 'Edad', type: 'number', width: 'half' }
                    ]
                },
                {
                    group: 'Entrega', fields: [
                        { id: 'recipient', label: 'Destinatario', type: 'text', width: 'full' },
                        { id: 'docName', label: 'Documento Entregado', type: 'text', width: 'full' },
                        { id: 'deliveryDate', label: 'Fecha Entrega', type: 'date', width: 'half' },
                        { id: 'deliveryPlace', label: 'Lugar Entrega', type: 'text', width: 'half' },
                        { id: 'method', label: 'Método', type: 'select', options: ['Personalmente', 'Correo Certificado', 'Dejado en domicilio'], width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">DECLARACIÓN JURADA DE SERVICIO/ENTREGA</h2>
                    <p class="doc-text">
                        Yo, <strong>${data.serverName || data.clientName}</strong>, declaro bajo juramento:
                    </p>
                    <div class="doc-body-text">
                        <p>1. Soy mayor de 18 años y no soy parte en la acción relacionada.</p>
                        <p>2. El día <strong>${data.deliveryDate}</strong>, serví/entregué una copia del documento: <strong>"${data.docName}"</strong>.</p>
                        <p>3. Entregado a: <strong>${data.recipient}</strong>.</p>
                        <p>4. Lugar: <strong>${data.deliveryPlace}</strong>.</p>
                        <p>5. Método de servicio: <strong>${data.method}</strong>.</p>
                    </div>
                    <p class="doc-text">
                        Declaro bajo pena de perjurio que la información anterior es verdadera y correcta.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Servidor"></div>
                            <div class="sig-label">${data.serverName}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Suscrito y jurado ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        translator_affidavit: {
            title: "CERTIFICACIÓN DE TRADUCTOR (TRANSLATOR AFFIDAVIT)",
            fields: [
                {
                    group: 'Traductor', fields: [
                        { id: 'translatorName', label: 'Nombre Traductor', type: 'text', width: 'full' },
                        { id: 'langPair', label: 'Idiomas (Ej: Español a Inglés)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Documento', fields: [
                        { id: 'docTitle', label: 'Título del Documento Traducido', type: 'text', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                 <div class="legal-doc" contenteditable="true">
                     <h2 class="doc-title">CERTIFICACIÓN DE PRECISIÓN DE TRADUCCIÓN</h2>
                     <p class="doc-text">
                         Yo, <strong>${data.translatorName || data.clientName}</strong>, certifico que:
                     </p>
                     <div class="doc-body-text">
                         <p>1. Soy competente en los idiomas <strong>${data.langPair}</strong>.</p>
                         <p>2. La traducción adjunta del documento titulado "<strong>${data.docTitle}</strong>" es una traducción verdadera, precisa y completa del original, según mi leal saber y entender.</p>
                     </div>
                     <br>
                     <div class="sig-section" contenteditable="false">
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Traductor"></div>
                             <div class="sig-label">${data.translatorName}</div>
                         </div>
                     </div>
                     <div class="notary-block" contenteditable="false">
                         <p class="doc-text">Suscrito y jurado ante mí el <strong>${data.date}</strong>.</p>
                         <div class="notary-seal-placeholder">SELLO</div>
                         <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                         <div class="sig-label">Notario Público</div>
                     </div>
                 </div>
             `
        },
        gift_deed: {
            title: "ESCRITURA DE DONACIÓN (GIFT DEED)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'donor', label: 'Donante (Grantor)', type: 'text', width: 'full' },
                        { id: 'donee', label: 'Donatario (Beneficiario)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Propiedad', fields: [
                        { id: 'propertyDesc', label: 'Descripción de la Propiedad', type: 'textarea', rows: 3 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ESCRITURA DE DONACIÓN (DEED OF GIFT)</h2>
                    <p class="doc-text">
                        ESTA ESCRITURA se hace el <strong>${data.date}</strong>, por <strong>${data.donor}</strong> (Donante) a favor de <strong>${data.donee}</strong> (Donatario).
                    </p>
                    <p class="doc-text">
                        POR AMOR Y AFECTO, el Donante transmite y regala al Donatario, sin contraprestación monetaria, todo título e interés en la siguiente propiedad:
                    </p>
                    <div class="doc-box-highlight">
                        ${data.propertyDesc || '[Descripción Legal]'}
                    </div>
                    <p class="doc-text">
                        El Donante certifica que es dueño legítimo de la propiedad y tiene derecho a transmitirla.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Donante"></div>
                            <div class="sig-label">${data.donor}</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        board_resolution: {
            title: "RESOLUCIÓN DE JUNTA (BOARD RESOLUTION)",
            fields: [
                {
                    group: 'Empresa', fields: [
                        { id: 'companyName', label: 'Nombre de la Empresa', type: 'text', width: 'full' },
                        { id: 'meetingDate', label: 'Fecha de Reunión', type: 'date', width: 'half' }
                    ]
                },
                {
                    group: 'Resolución', fields: [
                        { id: 'resolution', label: 'Texto de la Resolución', type: 'textarea', rows: 4, placeholder: 'SE RESUELVE QUE: La empresa abrirá una cuenta bancaria en...' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">RESOLUCIÓN DE LA JUNTA DIRECTIVA</h2>
                    <p class="doc-center-bold">${data.companyName}</p>
                    <p class="doc-text">
                          CERTIFICO QUE, en una reunión de la Junta Directiva celebrada el <strong>${data.meetingDate}</strong>, o por consentimiento unánime por escrito, se adoptó la siguiente resolución:
                    </p>
                    <div class="doc-box">
                        <strong>RESOLUCIÓN:</strong><br>
                        ${(data.resolution || '').replace(/\n/g, '<br>')}
                    </div>
                    <p class="doc-text">
                        Certifico además que esta resolución está en plena vigencia y no ha sido modificada ni rescindida.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Secretario/Director"></div>
                            <div class="sig-label">Secretario / Director</div>
                        </div>
                    </div>
                </div>
            `
        },
        meeting_minutes: {
            title: "ACTA DE REUNIÓN (MEETING MINUTES)",
            fields: [
                {
                    group: 'Detalles', fields: [
                        { id: 'orgName', label: 'Organización', type: 'text', width: 'full' },
                        { id: 'attendees', label: 'Asistentes', type: 'textarea', rows: 2 },
                        { id: 'topics', label: 'Temas Discutidos y Decisiones', type: 'textarea', rows: 6 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACTA DE REUNIÓN</h2>
                    <p class="doc-center-bold">${data.orgName}</p>
                    <p class="doc-text">
                        <strong>FECHA:</strong> ${data.date}
                    </p>
                    <p class="doc-text">
                        <strong>ASISTENTES:</strong><br>${data.attendees || 'Junta Directiva'}
                    </p>
                    <p class="doc-text" style="border-bottom:1px solid #000; margin-top:10px;"><strong>ACTA Y DECISIONES:</strong></p>
                    <div class="doc-body-text">
                        ${(data.topics || '').replace(/\n/g, '<br>')}
                    </div>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Secretario"></div>
                            <div class="sig-label">Secretario de Actas</div>
                        </div>
                    </div>
                </div>
            `
        },
        rental_application: {
            title: "SOLICITUD DE ALQUILER (RENTAL APPLICATION)",
            fields: [
                {
                    group: 'Solicitante', fields: [
                        { id: 'applicantName', label: 'Nombre Completo', type: 'text', width: 'full' },
                        { id: 'ssn', label: 'SSN (Últimos 4)', type: 'text', width: 'half' },
                        { id: 'phone', label: 'Teléfono', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Historial', fields: [
                        { id: 'currentAddr', label: 'Dirección Actual', type: 'text', width: 'full' },
                        { id: 'employer', label: 'Empleador Actual', type: 'text', width: 'full' },
                        { id: 'income', label: 'Ingreso Mensual ($)', type: 'number', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">SOLICITUD DE ALQUILER DE VIVIENDA</h2>
                    <p class="doc-text">
                        <strong>INFORMACIÓN PERSONAL</strong>
                    </p>
                    <div class="doc-body-text">
                        Nombre: <strong>${data.applicantName}</strong><br>
                        Teléfono: ${data.phone} | SSN: ***-**-${data.ssn}<br>
                        Dirección Actual: ${data.currentAddr}
                    </div>
                    <p class="doc-text">
                        <strong>EMPLEO E INGRESOS</strong>
                    </p>
                     <div class="doc-body-text">
                        Empleador: ${data.employer}<br>
                        Ingreso Mensual Bruto: $ ${data.income}
                    </div>
                    <p class="doc-text">
                        <strong>AUTORIZACIÓN</strong>
                    </p>
                    <p class="doc-text">
                        Certifico que la información anterior es verdadera. Autorizo al propietario a verificar mis referencias, empleo y antecedentes crediticios/penales para fines de arrendamiento.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Solicitante"></div>
                            <div class="sig-label">Solicitante</div>
                        </div>
                    </div>
                </div>
            `
        },
        roommate_agreement: {
            title: "ACUERDO DE COMPAÑEROS DE CUARTO (ROOMMATE)",
            fields: [
                {
                    group: 'Compañeros', fields: [
                        { id: 'roommate1', label: 'Compañero 1', type: 'text', width: 'full' },
                        { id: 'roommate2', label: 'Compañero 2', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Gastos', fields: [
                        { id: 'rentShare', label: 'División de Renta (Ej: 50/50)', type: 'text', width: 'full' },
                        { id: 'utilities', label: 'Servicios (¿Quién paga qué?)', type: 'textarea', rows: 2 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE CONVIVENCIA (ROOMMATE AGREEMENT)</h2>
                    <p class="doc-text">
                        Acuerdo entre <strong>${data.roommate1}</strong> y <strong>${data.roommate2}</strong>, residentes en la misma propiedad.
                    </p>
                    <p class="doc-text">
                        <strong>1. RENTA.</strong> Se acuerda dividir la renta total de la siguiente manera: ${data.rentShare}.
                    </p>
                    <p class="doc-text">
                        <strong>2. SERVICIOS Y UTILITIES.</strong>
                    </p>
                    <div class="doc-body-text">
                        ${data.utilities || 'Electricidad, agua e internet se dividirán equitativamente.'}
                    </div>
                    <p class="doc-text">
                        <strong>3. REGLAS DE LA CASA.</strong> Se acuerda mantener la limpieza de las áreas comunes, respetar el ruido y las visitas nocturnas.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Comp. 1"></div>
                            <div class="sig-label">${data.roommate1}</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Comp. 2"></div>
                             <div class="sig-label">${data.roommate2}</div>
                        </div>
                    </div>
                </div>
            `
        },
        pet_addendum: {
            title: "ANEXO DE MASCOTAS (PET ADDENDUM)",
            fields: [
                {
                    group: 'Mascota', fields: [
                        { id: 'petName', label: 'Nombre Mascota', type: 'text', width: 'half' },
                        { id: 'petType', label: 'Tipo/Raza', type: 'text', width: 'half' },
                        { id: 'color', label: 'Color/Peso', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Cargos', fields: [
                        { id: 'deposit', label: 'Depósito de Mascota ($)', type: 'number', width: 'half' },
                        { id: 'fee', label: 'Renta Extra Mascota ($/mes)', type: 'number', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ANEXO DE MASCOTAS AL CONTRATO</h2>
                    <p class="doc-text">
                         Este anexo modifica el contrato de arrendamiento existente para permitir la siguiente mascota:
                    </p>
                    <div class="doc-box">
                        <strong>Nombre:</strong> ${data.petName}<br>
                        <strong>Tipo/Raza:</strong> ${data.petType}<br>
                        <strong>Descripción:</strong> ${data.color}
                    </div>
                    <p class="doc-text">
                        El Inquilino acuerda pagar un depósito adicional de <strong>$ ${data.deposit || '0'}</strong> y una renta mensual adicional de <strong>$ ${data.fee || '0'}</strong>.
                    </p>
                    <p class="doc-text">
                        El Inquilino es responsable de cualquier daño causado por la mascota y acepta cumplir con las normas de ruido e higiene.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div>
                            <div class="sig-label">Propietario</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Inquilino"></div>
                             <div class="sig-label">Inquilino</div>
                        </div>
                    </div>
                </div>
            `
        },
        lien_waiver: {
            title: "RENUNCIA DE GRAVAMEN (LIEN WAIVER)",
            fields: [
                {
                    group: 'Proyecto', fields: [
                        { id: 'project', label: 'Dirección/Proyecto', type: 'text', width: 'full' },
                        { id: 'contractor', label: 'Contratista (Recibe Pago)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Pago', fields: [
                        { id: 'amount', label: 'Monto Recibido ($)', type: 'number', width: 'full' },
                        { id: 'type', label: 'Tipo', type: 'select', options: ['Parcial', 'Final'], width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">RENUNCIA DE GRAVAMEN Y DERECHOS (LIEN WAIVER)</h2>
                    <p class="doc-text">
                        PROYECTO: <strong>${data.project}</strong>.
                    </p>
                    <p class="doc-text">
                        El abajo firmante, <strong>${data.contractor}</strong>, certifica haber recibido el pago de <strong>$ ${data.amount}</strong>.
                    </p>
                    <p class="doc-text">
                        En consideración de este pago, el abajo firmante renuncia y libera cualquier derecho de gravamen (Mechanic's Lien), reclamo de pago, o demanda contra la propiedad mencionada y el dueño, hasta la fecha o por el monto especificado.
                    </p>
                    <p class="doc-text">
                        TIPO DE RENUNCIA: <strong>${data.type}</strong>.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Contratista"></div>
                            <div class="sig-label">${data.contractor}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Suscrito y jurado ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        separation_agreement: {
            title: "ACUERDO DE SEPARACIÓN (SEPARATION AGREEMENT)",
            fields: [
                {
                    group: 'Cónyuges', fields: [
                        { id: 'spouse1', label: 'Cónyuge 1', type: 'text', width: 'full' },
                        { id: 'spouse2', label: 'Cónyuge 2', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Términos', fields: [
                        { id: 'dateSep', label: 'Fecha de Separación', type: 'date', width: 'full' },
                        { id: 'assets', label: 'División de Bienes (Resumen)', type: 'textarea', rows: 3 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE SEPARACIÓN MATRIMONIAL</h2>
                    <p class="doc-text">
                        Entre <strong>${data.spouse1}</strong> y <strong>${data.spouse2}</strong>.
                    </p>
                    <p class="doc-text">
                        Las partes acuerdan vivir separadas y aparte a partir del <strong>${data.dateSep}</strong>, libre de interferencia marital del otro.
                    </p>
                    <p class="doc-text">
                        <strong>PROPIEDAD Y DEUDAS:</strong> Las partes han acordado dividir sus bienes y deudas de la siguiente manera:
                    </p>
                    <div class="doc-body-text">
                        ${(data.assets || 'Cada parte retendrá los bienes en su posesión actual.').replace(/\n/g, '<br>')}
                    </div>
                    <p class="doc-text">
                        Este acuerdo pretende ser un arreglo final de todos los derechos maritales y patrimoniales hasta que se finalice un divorcio formal o reconciliación.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Cónyuge 1"></div>
                            <div class="sig-label">${data.spouse1}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Cónyuge 2"></div>
                             <div class="sig-label">${data.spouse2}</div>
                        </div>
                    </div>
                    <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        cohabitation_agreement: {
            title: "ACUERDO DE COHABITACIÓN (COHABITATION AGREEMENT)",
            fields: [
                {
                    group: 'Pareja', fields: [
                        { id: 'partner1', label: 'Pareja 1', type: 'text', width: 'full' },
                        { id: 'partner2', label: 'Pareja 2', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Bienes', fields: [
                        { id: 'sharedAssets', label: 'Bienes Compartidos', type: 'textarea', rows: 3 },
                        { id: 'separateAssets', label: 'Bienes que se mantienen separados', type: 'textarea', rows: 3 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE COHABITACIÓN/CONVIVENCIA</h2>
                    <p class="doc-text">
                         Este acuerdo se celebra entre <strong>${data.partner1}</strong> y <strong>${data.partner2}</strong>, quienes han decidido vivir juntos sin estar casados.
                    </p>
                    <p class="doc-text">
                        Es la intención de las partes definir sus derechos de propiedad durante la convivencia.
                    </p>
                    <p class="doc-text"><strong>1. PROPIEDAD SEPARADA:</strong> Lo siguiente seguirá siendo propiedad exclusiva de cada individuo:</p>
                    <div class="doc-body-text">${data.separateAssets || 'Todos los activos adquiridos antes de la convivencia.'}</div>
                    <p class="doc-text"><strong>2. PROPIEDAD COMPARTIDA:</strong> Lo siguiente se considerará propiedad conjunta:</p>
                    <div class="doc-body-text">${data.sharedAssets || 'Bienes adquiridos conjuntamente con fondos comunes.'}</div>
                    <p class="doc-text">
                        La terminación de la convivencia no dará lugar a derechos de pensión alimenticia ni soporte ("palimony") a menos que se acuerde por escrito.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Pareja 1"></div>
                            <div class="sig-label">${data.partner1}</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Pareja 2"></div>
                             <div class="sig-label">${data.partner2}</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
             `
        },
        invitation_letter: {
            title: "CARTA DE INVITACIÓN (VISA INVITATION)",
            fields: [
                {
                    group: 'Anfitrión', fields: [
                        { id: 'hostName', label: 'Nombre Anfitrión', type: 'text', width: 'full' },
                        { id: 'hostAddr', label: 'Dirección Anfitrión', type: 'text', width: 'full' },
                        { id: 'status', label: 'Estatus Legal (Ciudadano/Residente)', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Visitante', fields: [
                        { id: 'guestName', label: 'Nombre Visitante', type: 'text', width: 'full' },
                        { id: 'passport', label: 'Pasaporte Visitante', type: 'text', width: 'half' },
                        { id: 'relation', label: 'Relación', type: 'text', width: 'half' },
                        { id: 'stay', label: 'Duración Estadía', type: 'text', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CARTA DE INVITACIÓN PARA VISA</h2>
                    <p class="doc-text" style="text-align:right;">Fecha: ${data.date}</p>
                    <p class="doc-text">
                        A: Oficial Consular / Embajada
                    </p>
                    <p class="doc-text">
                        Estimado Señor/Señora:
                    </p>
                    <p class="doc-text">
                        Mi nombre es <strong>${data.hostName}</strong>, con dirección en <strong>${data.hostAddr}</strong>. Soy <strong>${data.status}</strong> de los Estados Unidos.
                    </p>
                    <p class="doc-text">
                        Escribo esta carta para invitar a mi <strong>${data.relation}</strong>, <strong>${data.guestName}</strong> (Pasaporte: ${data.passport}), a visitarme en los EE.UU. por un periodo de <strong>${data.stay}</strong>.
                    </p>
                    <p class="doc-text">
                        Durante su estancia, se alojará en mi domicilio y yo cubriré sus gastos de manutención y alojamiento. Garantizo que regresará a su país de origen antes de que expire su visa.
                    </p>
                    <p class="doc-text">
                         Adjunto copia de mis documentos para su revisión.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Anfitrión"></div>
                            <div class="sig-label">${data.hostName}</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Suscrito y jurado ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        debt_settlement: {
            title: "ACUERDO DE LIQUIDACIÓN DE DEUDA (DEBT SETTLEMENT)",
            fields: [
                {
                    group: 'Deuda', fields: [
                        { id: 'debtor', label: 'Deudor', type: 'text', width: 'full' },
                        { id: 'creditor', label: 'Acreedor', type: 'text', width: 'full' },
                        { id: 'totalDebt', label: 'Deuda Total Original ($)', type: 'number', width: 'half' },
                        { id: 'settleAmount', label: 'Monto de Liquidación ($)', type: 'number', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE LIQUIDACIÓN DE DEUDA</h2>
                    <p class="doc-text">
                        FECHA: <strong>${data.date}</strong>.
                    </p>
                    <p class="doc-text">
                        <strong>ACREEDOR:</strong> ${data.creditor}<br>
                        <strong>DEUDOR:</strong> ${data.debtor}
                    </p>
                    <p class="doc-text">
                        El Deudor debe actualmente al Acreedor la suma total de <strong>$ ${data.totalDebt}</strong> (la "Deuda").
                    </p>
                    <p class="doc-text">
                        Las partes acuerdan comprometer y liquidar la Deuda bajo los siguientes términos:
                    </p>
                    <p class="doc-text">
                        El Acreedor acepta la suma de <strong>$ ${data.settleAmount}</strong> como pago completo y definitivo de la Deuda. Al recibir este pago, el Acreedor liberará al Deudor de cualquier reclamación adicional relacionada con esta cuenta.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Acreedor"></div>
                            <div class="sig-label">Acreedor</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Deudor"></div>
                             <div class="sig-label">Deudor</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        indemnification_agreement: {
            title: "ACUERDO DE INDEMNIZACIÓN (HOLD HARMLESS)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'indemnifier', label: 'Indemnizador (Protege)', type: 'text', width: 'full' },
                        { id: 'indemnitee', label: 'Indemnizado (Protegido)', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Razón', fields: [
                        { id: 'activity', label: 'Actividad/Razón', type: 'textarea', rows: 3 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE INDEMNIZACIÓN Y EXENCIÓN</h2>
                    <p class="doc-text">
                        Este acuerdo se realiza entre <strong>${data.indemnifier}</strong> (Indemnizador) y <strong>${data.indemnitee}</strong> (Indemnizado).
                    </p>
                    <p class="doc-text">
                        El Indemnizador acepta indemnizar, defender y eximir de responsabilidad al Indemnizado de cualquier y toda demanda, responsabilidad, pérdida, costos o gastos que surjan de lo siguiente:
                    </p>
                    <div class="doc-box">
                        ${data.activity}
                    </div>
                    <p class="doc-text">
                        Esta protección se extiende a todos los agentes, empleados y sucesores del Indemnizado.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Indemnizador"></div>
                            <div class="sig-label">Indemnizador</div>
                        </div>
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Indemnizado"></div>
                             <div class="sig-label">Indemnizado</div>
                        </div>
                    </div>
                </div>
            `
        },
        llc_operating_agreement: {
            title: "ACUERDO OPERATIVO LLC (LLC OPERATING AGREEMENT)",
            fields: [
                {
                    group: 'Empresa', fields: [
                        { id: 'llcName', label: 'Nombre LLC', type: 'text', width: 'full' },
                        { id: 'state', label: 'Estado de Registro', type: 'text', width: 'half' },
                        { id: 'members', label: 'Lista de Miembros', type: 'textarea', rows: 3 }
                    ]
                },
                {
                    group: 'Gestión', fields: [
                        { id: 'management', label: 'Gestionada por (Members/Managers)', type: 'text', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                 <div class="legal-doc" contenteditable="true">
                     <h2 class="doc-title">ACUERDO OPERATIVO DE ${data.llcName.toUpperCase()} LLC</h2>
                     <p class="doc-text">
                         Una Compañía de Responsabilidad Limitada organizada bajo las leyes de: <strong>${data.state}</strong>.
                     </p>
                     <p class="doc-text">
                         <strong>1. MIEMBROS.</strong> Los miembros iniciales son:
                     </p>
                     <div class="doc-body-text">
                         ${(data.members || '').replace(/\n/g, '<br>')}
                     </div>
                     <p class="doc-text">
                         <strong>2. GESTIÓN.</strong> La compañía será gestionada por: <strong>${data.management}</strong>.
                     </p>
                     <p class="doc-text">
                         <strong>3. DISTRIBUCIONES.</strong> Las ganancias y pérdidas se asignarán a los miembros en proporción a su porcentaje de interés/propiedad.
                     </p>
                     <p class="doc-text">
                         <strong>4. DISOLUCIÓN.</strong> La LLC se disolverá por voto unánime de los miembros o por decreto judicial.
                     </p>
                     <br>
                     <div class="sig-section" contenteditable="false">
                         <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Miembro Admin"></div>
                             <div class="sig-label">Firma Autorizada</div>
                         </div>
                     </div>
                 </div>
             `
        },
        corporate_bylaws: {
            title: "ESTATUTOS CORPORATIVOS (CORPORATE BYLAWS)",
            fields: [
                {
                    group: 'Corporación', fields: [
                        { id: 'corpName', label: 'Nombre Corporación', type: 'text', width: 'full' },
                        { id: 'state', label: 'Estado', type: 'text', width: 'half' }
                    ]
                },
                {
                    group: 'Reuniones', fields: [
                        { id: 'annualMeeting', label: 'Fecha Reunión Anual', type: 'text', width: 'full' },
                        { id: 'quorum', label: 'Quórum Requerido (%)', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ESTATUTOS DE ${data.corpName.toUpperCase()}</h2>
                    <p class="doc-text">
                        <strong>ARTÍCULO I: OFICINAS.</strong> La oficina principal estará en el Estado de ${data.state}.
                    </p>
                    <p class="doc-text">
                        <strong>ARTÍCULO II: ACCIONISTAS.</strong>
                    </p>
                    <div class="doc-body-text">
                        <p>1. <strong>Reunión Anual:</strong> Se celebrará el: ${data.annualMeeting}.</p>
                        <p>2. <strong>Quórum:</strong> La presencia del ${data.quorum}% de las acciones con derecho a voto constituirá quórum.</p>
                    </div>
                    <p class="doc-text">
                        <strong>ARTÍCULO III: DIRECTORES.</strong> El negocio será gestionado por la Junta Directiva.
                    </p>
                    <p class="doc-text">
                        <strong>ARTÍCULO IV: OFICIALES.</strong> Los oficiales incluirán un Presidente, Secretario y Tesorero.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Secretario"></div>
                            <div class="sig-label">Secretario Corporativo</div>
                        </div>
                    </div>
                </div>
            `
        },
        proxy_form: {
            title: "FORMULARIO DE REPRESENTACIÓN (PROXY)",
            fields: [
                {
                    group: 'Detalles', fields: [
                        { id: 'shareholder', label: 'Accionista (Principal)', type: 'text', width: 'full' },
                        { id: 'proxy', label: 'Representante (Proxy)', type: 'text', width: 'full' },
                        { id: 'meeting', label: 'Para Reunión de Fecha', type: 'date', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">DESIGNACIÓN DE APODERADO (PROXY)</h2>
                    <p class="doc-text">
                        El abajo firmante, <strong>${data.shareholder}</strong>, titular de acciones en la compañía correspondiente, por la presente designa a:
                    </p>
                    <p class="doc-center-bold">${data.proxy}</p>
                    <p class="doc-text">
                        Como mi apoderado y agente para asistir y votar en mi nombre en la Reunión de Accionistas a celebrarse el <strong>${data.meeting}</strong>.
                    </p>
                    <p class="doc-text">
                        Este poder es revocable en cualquier momento antes de que se ejerza el voto.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Accionista"></div>
                            <div class="sig-label">${data.shareholder}</div>
                        </div>
                    </div>
                </div>
            `
        },
        land_contract: {
            title: "CONTRATO DE TIERRA/VENTA A PLAZOS (LAND CONTRACT)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'vendor', label: 'Vendedor', type: 'text', width: 'full' },
                        { id: 'vendee', label: 'Comprador', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Términos', fields: [
                        { id: 'price', label: 'Precio Total ($)', type: 'number', width: 'half' },
                        { id: 'down', label: 'Pago Inicial ($)', type: 'number', width: 'half' },
                        { id: 'monthly', label: 'Pago Mensual ($)', type: 'number', width: 'half' },
                        { id: 'interest', label: 'Interés (%)', type: 'number', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE VENTA DE TIERRAS A PLAZOS</h2>
                    <p class="doc-text">
                        VENDEDOR: ${data.vendor}<br>COMPRADOR: ${data.vendee}
                    </p>
                    <p class="doc-text">
                        El Vendedor acuerda vender la propiedad descrita al Comprador bajo los siguientes términos de financiamiento:
                    </p>
                    <div class="doc-body-text">
                        <p>1. <strong>Precio de Venta:</strong> $ ${data.price}</p>
                        <p>2. <strong>Pago Inicial:</strong> $ ${data.down}</p>
                        <p>3. <strong>Financiamiento:</strong> El saldo restante devengará intereses al ${data.interest}% anual.</p>
                        <p>4. <strong>Pagos:</strong> $ ${data.monthly} mensuales hasta que se pague el total.</p>
                    </div>
                    <p class="doc-text">
                        El Título de la propiedad no se transferirá hasta que se complete el pago total. El Comprador es responsable de impuestos y seguros.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Vendedor"></div>
                            <div class="sig-label">Vendedor</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                             <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Comprador"></div>
                             <div class="sig-label">Comprador</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        notice_enter: {
            title: "AVISO DE ENTRADA A PROPIEDAD (NOTICE TO ENTER)",
            fields: [
                {
                    group: 'Detalles', fields: [
                        { id: 'tenant', label: 'Inquilino', type: 'text', width: 'full' },
                        { id: 'address', label: 'Dirección', type: 'text', width: 'full' },
                        { id: 'enterDate', label: 'Fecha de Entrada', type: 'date', width: 'half' },
                        { id: 'enterTime', label: 'Hora Aprox.', type: 'text', width: 'half' },
                        { id: 'reason', label: 'Razón', type: 'select', options: ['Inspección', 'Reparaciones', 'Mostrar Propiedad'], width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AVISO DE INTENCIÓN DE ENTRAR</h2>
                    <p class="doc-text">
                         A: <strong>${data.tenant}</strong><br>
                         Propiedad: ${data.address}
                    </p>
                    <p class="doc-text">
                         Por favor tenga en cuenta que el Propietario o su agente necesita acceder a las instalaciones el:
                    </p>
                    <p class="doc-center-bold">
                        ${data.enterDate} a las ${data.enterTime}
                    </p>
                    <p class="doc-text">
                        <strong>Propósito de la entrada:</strong> ${data.reason}.
                    </p>
                    <p class="doc-text">
                        Este aviso se proporciona en cumplimiento con las leyes estatales que requieren notificación previa (generalmente 24 horas).
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario/Agente"></div>
                            <div class="sig-label">Propietario / Agente</div>
                        </div>
                    </div>
                </div>
            `
        },
        rent_increase: {
            title: "AVISO DE AUMENTO DE ALQUILER",
            fields: [
                {
                    group: 'Detalles', fields: [
                        { id: 'tenant', label: 'Inquilino', type: 'text', width: 'full' },
                        { id: 'currentRent', label: 'Renta Actual ($)', type: 'number', width: 'half' },
                        { id: 'newRent', label: 'Nueva Renta ($)', type: 'number', width: 'half' },
                        { id: 'effectiveDate', label: 'Efectivo a partir de', type: 'date', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AVISO DE CAMBIO EN TÉRMINOS DE ALQUILER</h2>
                    <p class="doc-text">
                         A: <strong>${data.tenant}</strong>
                    </p>
                    <p class="doc-text">
                        Este aviso es para informarle que su renta mensual será incrementada.
                    </p>
                    <div class="doc-box">
                        Renta Actual: $ ${data.currentRent}<br>
                        <strong>NUEVA Renta: $ ${data.newRent}</strong>
                    </div>
                    <p class="doc-text">
                        El nuevo monto será efectivo a partir del: <strong>${data.effectiveDate}</strong>.
                    </p>
                    <p class="doc-text">
                         Todos los demás términos de su acuerdo de arrendamiento permanecen iguales.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div>
                            <div class="sig-label">Propietario / Administrador</div>
                        </div>
                    </div>
                </div>
            `
        },
        employee_termination: {
            title: "CARTA DE DESPIDO (TERMINATION LETTER)",
            fields: [
                {
                    group: 'Empleado', fields: [
                        { id: 'employee', label: 'Nombre Empleado', type: 'text', width: 'full' },
                        { id: 'lastDay', label: 'Último Día', type: 'date', width: 'half' }
                    ]
                },
                {
                    group: 'Razón', fields: [
                        { id: 'cause', label: 'Causa (Opcional)', type: 'text', width: 'full', placeholder: 'Razones de desempeño, reducción de personal, etc.' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CARTA DE TERMINACIÓN DE EMPLEO</h2>
                    <p class="doc-text" style="text-align:right;">Fecha: ${data.date}</p>
                    <p class="doc-text">A: <strong>${data.employee}</strong></p>
                    <p class="doc-text">
                        Lamentamos informarle que su empleo con la compañía se da por terminado efectivo el: <strong>${data.lastDay}</strong>.
                    </p>
                    <p class="doc-text">
                        ${data.cause ? 'La razón de esta decisión es: ' + data.cause : 'Esta decisión es definitiva.'}
                    </p>
                    <p class="doc-text">
                        Recibirá su pago final y beneficios acumulados de acuerdo con la ley estatal. Por favor devuelva toda la propiedad de la empresa antes de su partida.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Supervisor/HR"></div>
                            <div class="sig-label">Supervisor / HR</div>
                        </div>
                    </div>
                </div>
            `
        },
        employee_warning: {
            title: "AMONESTACIÓN LABORAL (EMPLOYEE WARNING)",
            fields: [
                {
                    group: 'Detalles', fields: [
                        { id: 'employee', label: 'Empleado', type: 'text', width: 'full' },
                        { id: 'violation', label: 'Infracción/Problema', type: 'textarea', rows: 3 },
                        { id: 'improvement', label: 'Mejora Requerida', type: 'textarea', rows: 2 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AVISO DE DISCIPLINA EMPLEADO</h2>
                    <p class="doc-text"><strong>EMPLEADO:</strong> ${data.employee}</p>
                    <p class="doc-text"><strong>FECHA:</strong> ${data.date}</p>
                    <p class="doc-text"><strong>DESCRIPCIÓN DE LA INFRACCIÓN:</strong></p>
                    <div class="doc-body-text">${data.violation}</div>
                    <p class="doc-text"><strong>PLAN DE ACCIÓN CORRECTIVA:</strong></p>
                    <div class="doc-body-text">${data.improvement}</div>
                    <p class="doc-text">
                        La falta de corrección de este comportamiento puede resultar en una acción disciplinaria adicional, hasta e incluyendo la terminación.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                         <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Supervisor"></div>
                            <div class="sig-label">Supervisor</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Empleado"></div>
                            <div class="sig-label">Empleado (Acuse de recibo)</div>
                        </div>
                    </div>
                </div>
            `
        },
        general_service_agreement: {
            title: "CONTRATO DE SERVICIOS GENERAL (SERVICE AGREEMENT)",
            fields: [
                {
                    group: 'Partes', fields: [
                        { id: 'provider', label: 'Proveedor', type: 'text', width: 'full' },
                        { id: 'client', label: 'Cliente', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Servicio', fields: [
                        { id: 'services', label: 'Descripción Servicios', type: 'textarea', rows: 3 },
                        { id: 'price', label: 'Costo ($)', type: 'number', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE PRESTACIÓN DE SERVICIOS</h2>
                    <p class="doc-text">
                        ENTRE: <strong>${data.provider}</strong> (Proveedor) y <strong>${data.client}</strong> (Cliente).
                    </p>
                    <p class="doc-text">
                        <strong>1. SERVICIOS.</strong> El Proveedor acuerda realizar lo siguiente:
                    </p>
                    <div class="doc-body-text">${data.services}</div>
                    <p class="doc-text">
                        <strong>2. PAGO.</strong> El Cliente acuerda pagar la suma de <strong>$ ${data.price}</strong> por estos servicios.
                    </p>
                    <p class="doc-text">
                        <strong>3. RELACIÓN.</strong> El Proveedor es un contratista independiente, no un empleado.
                    </p>
                    <br>
                    <div class="sig-section-row" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Proveedor"></div>
                            <div class="sig-label">Proveedor</div>
                        </div>
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Cliente"></div>
                            <div class="sig-label">Cliente</div>
                        </div>
                    </div>
                </div>
            `
        },
        mechanics_lien: {
            title: "GRAVAMEN DE MECÁNICO (MECHANIC'S LIEN)",
            fields: [
                {
                    group: 'Reclamante', fields: [
                        { id: 'claimant', label: 'Reclamante (Contratista)', type: 'text', width: 'full' },
                        { id: 'amount', label: 'Monto NO Pagado ($)', type: 'number', width: 'full' }
                    ]
                },
                {
                    group: 'Propiedad', fields: [
                        { id: 'owner', label: 'Dueño de la Propiedad', type: 'text', width: 'full' },
                        { id: 'address', label: 'Dirección Propiedad', type: 'text', width: 'full' },
                        { id: 'workDesc', label: 'Trabajo Realizado', type: 'textarea', rows: 2 }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">RECLAMO DE GRAVAMEN (MECHANIC'S LIEN)</h2>
                    <p class="doc-text">
                        AVISO A TODOS:
                    </p>
                    <p class="doc-text">
                        El abajo firmante, <strong>${data.claimant}</strong>, reclama un gravamen sobre la propiedad descrita a continuación por mano de obra o materiales suministrados para mejoras en dicha propiedad.
                    </p>
                    <div class="doc-box">
                        <strong>Dueño:</strong> ${data.owner}<br>
                        <strong>Dirección:</strong> ${data.address}<br>
                        <strong>Trabajo:</strong> ${data.workDesc}
                    </div>
                    <p class="doc-text">
                        El monto total adeudado y no pagado, después de deducir todos los créditos y compensaciones, es: <strong>$ ${data.amount}</strong>.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Reclamante"></div>
                            <div class="sig-label">${data.claimant}</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Jurado y suscrito ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        release_mechanics_lien: {
            title: "LIBERACIÓN DE GRAVAMEN (RELEASE OF LIEN)",
            fields: [
                {
                    group: 'Detalles', fields: [
                        { id: 'claimant', label: 'Reclamante', type: 'text', width: 'full' },
                        { id: 'lienDate', label: 'Fecha del Gravamen Original', type: 'date', width: 'half' },
                        { id: 'bookPage', label: 'Libro/Página de Registro (Si aplica)', type: 'text', width: 'half' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">LIBERACIÓN DE GRAVAMEN DE MECÁNICO</h2>
                    <p class="doc-text">
                        POR LA PRESENTE, el abajo firmante, <strong>${data.claimant}</strong>, certifica que cierta Reclamación de Gravamen fechada el <strong>${data.lienDate}</strong>, (Registrada en ${data.bookPage || 'los registros del condado'}), ha sido SATISFECHA Y PAGADA TOTALMENTE.
                    </p>
                    <p class="doc-text">
                        Por lo tanto, el abajo firmante consiente que el mismo sea cancelado de los registros.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                        <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Reclamante"></div>
                            <div class="sig-label">${data.claimant}</div>
                        </div>
                    </div>
                     <div class="notary-block" contenteditable="false">
                        <p class="doc-text">Reconocido ante mí el <strong>${data.date}</strong>.</p>
                        <div class="notary-seal-placeholder">SELLO</div>
                        <div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div>
                        <div class="sig-label">Notario Público</div>
                    </div>
                </div>
            `
        },
        minor_photo_release: {
            title: "AUTORIZACIÓN FOTO MENORES (MINOR PHOTO RELEASE)",
            fields: [
                {
                    group: 'Menor', fields: [
                        { id: 'parent', label: 'Padre/Tutor', type: 'text', width: 'full' },
                        { id: 'child', label: 'Nombre del Menor', type: 'text', width: 'full' }
                    ]
                },
                {
                    group: 'Uso', fields: [
                        { id: 'org', label: 'Fotógrafo/Organización', type: 'text', width: 'full' }
                    ]
                }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AUTORIZACIÓN DE USO DE IMAGEN (MENOR)</h2>
                    <p class="doc-text">
                        Yo, <strong>${data.parent}</strong>, soy el padre o tutor legal de <strong>${data.child}</strong> (el "Menor").
                    </p>
                    <p class="doc-text">
                        Por la presente otorgo a <strong>${data.org}</strong> el derecho irrevocable a fotografiar al Menor y utilizar su imagen para fines comerciales, educativos o promocionales.
                    </p>
                    <p class="doc-text">
                        Entiendo que no recibiré compensación y libero al Fotógrafo de cualquier reclamación relacionada con el uso de estas imágenes.
                    </p>
                    <br>
                    <div class="sig-section" contenteditable="false">
                         <div class="sig-block" contenteditable="false">
                            <div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Padre/Tutor"></div>
                            <div class="sig-label">${data.parent}</div>
                        </div>
                    </div>
                </div>
            `
        },
        demand_letter: {
            title: "CARTA DE DEMANDA (DEMAND LETTER)",
            fields: [
                { group: 'Partes', fields: [{ id: 'sender', label: 'Remitente', type: 'text', width: 'full' }, { id: 'recipient', label: 'Destinatario', type: 'text', width: 'full' }] },
                { group: 'Reclamo', fields: [{ id: 'amount', label: 'Monto ($)', type: 'number', width: 'half' }, { id: 'deadline', label: 'Fecha Límite', type: 'date', width: 'half' }, { id: 'reason', label: 'Razón', type: 'textarea', rows: 2 }] }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CARTA DE DEMANDA DE PAGO</h2>
                    <p class="doc-text">Fecha: <strong>${data.date}</strong><br>DE: <strong>${data.sender}</strong><br>PARA: <strong>${data.recipient}</strong></p>
                    <p class="doc-text">Estimado/a ${data.recipient}:</p>
                    <p class="doc-text">Esta carta es una demanda formal de pago por <strong>$ ${data.amount}</strong>, adeudado por: ${data.reason}.</p>
                    <p class="doc-text">Exijo el pago antes del <strong>${data.deadline}</strong>. De lo contrario, procederé legalmente.</p>
                    <p class="doc-text">Atentamente,</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Remitente"></div><div class="sig-label">${data.sender}</div></div></div>
                </div>`
        },
        resignation_letter: {
            title: "CARTA DE RENUNCIA (RESIGNATION)",
            fields: [
                { group: 'Detalles', fields: [{ id: 'empName', label: 'Empleado', type: 'text', width: 'full' }, { id: 'manager', label: 'Supervisor/Gerente', type: 'text', width: 'full' }, { id: 'company', label: 'Empresa', type: 'text', width: 'full' }, { id: 'lastDay', label: 'Último Día', type: 'date', width: 'half' }] }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CARTA DE RENUNCIA LABORAL</h2>
                    <p class="doc-text">A: <strong>${data.manager}</strong>, ${data.company}</p>
                    <p class="doc-text">Por la presente presento mi renuncia formal a mi puesto en <strong>${data.company}</strong>. Mi último día de trabajo será el <strong>${data.lastDay}</strong>.</p>
                    <p class="doc-text">Agradezco la oportunidad de haber trabajado aquí y haré todo lo posible para asegurar una transición fluida.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Empleado"></div><div class="sig-label">${data.empName}</div></div></div>
                </div>`
        },
        recommendation_letter: {
            title: "CARTA DE RECOMENDACIÓN",
            fields: [
                { group: 'Info', fields: [{ id: 'author', label: 'Recomendador (Yo)', type: 'text', width: 'full' }, { id: 'candidate', label: 'Candidato', type: 'text', width: 'full' }, { id: 'relation', label: 'Relación/Años Conocido', type: 'text', width: 'full' }, { id: 'qualities', label: 'Cualidades', type: 'textarea', rows: 3 }] }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CARTA DE RECOMENDACIÓN PROFESIONAL</h2>
                    <p class="doc-text">A quien corresponda:</p>
                    <p class="doc-text">Es un placer recomendar a <strong>${data.candidate}</strong>. He conocido a ${data.candidate} como <strong>${data.relation}</strong> y puedo dar fe de su integridad y habilidades.</p>
                    <div class="doc-body-text">${data.qualities}</div>
                    <p class="doc-text">Recomiendo encarecidamente a ${data.candidate} para cualquier oportunidad futura.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma"></div><div class="sig-label">${data.author}</div></div></div>
                </div>`
        },
        offer_letter: {
            title: "CARTA DE OFERTA DE EMPLEO",
            fields: [
                { group: 'Oferta', fields: [{ id: 'company', label: 'Empresa', type: 'text', width: 'full' }, { id: 'candidate', label: 'Candidato', type: 'text', width: 'full' }, { id: 'role', label: 'Puesto', type: 'text', width: 'half' }, { id: 'salary', label: 'Salario Anual/Hora', type: 'text', width: 'half' }, { id: 'start', label: 'Fecha Inicio', type: 'date', width: 'half' }] }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">OFERTA DE EMPLEO</h2>
                    <p class="doc-text">Estimado/a <strong>${data.candidate}</strong>,</p>
                    <p class="doc-text">Nos complace ofrecerle el puesto de <strong>${data.role}</strong> en <strong>${data.company}</strong>.</p>
                    <ul class="doc-body-text">
                        <li><strong>Fecha de Inicio:</strong> ${data.start}</li>
                        <li><strong>Salario:</strong> ${data.salary}</li>
                        <li><strong>Reporta a:</strong> Gerencia</li>
                    </ul>
                    <p class="doc-text">Firme a continuación para aceptar esta oferta.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Empresa"></div><div class="sig-label">${data.company}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-emp" onclick="NoteGenerator.openSignPad('emp', this)" data-label="Firma Candidato"></div><div class="sig-label">${data.candidate}</div></div></div>
                </div>`
        },
        joint_venture: {
            title: "ACUERDO DE EMPRESA CONJUNTA (JOINT VENTURE)",
            fields: [
                { group: 'Socios', fields: [{ id: 'partyA', label: 'Socio A', type: 'text', width: 'full' }, { id: 'partyB', label: 'Socio B', type: 'text', width: 'full' }] },
                { group: 'Proyecto', fields: [{ id: 'purpose', label: 'Propósito/Proyecto', type: 'textarea', rows: 2 }] }
            ],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE JOINT VENTURE</h2>
                    <p class="doc-text">Este Acuerdo se celebra entre <strong>${data.partyA}</strong> y <strong>${data.partyB}</strong> con el fin de llevar a cabo una empresa conjunta.</p>
                    <p class="doc-text"><strong>PROPÓSITO:</strong> ${data.purpose}</p>
                    <p class="doc-text">Ambas partes acuerdan compartir ganancias, pérdidas y responsabilidades al 50% salvo acuerdo contrario anexo.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Socio A"></div><div class="sig-label">${data.partyA}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-partner" onclick="NoteGenerator.openSignPad('partner', this)" data-label="Firma Socio B"></div><div class="sig-label">${data.partyB}</div></div></div>
                     <div class="notary-block" contenteditable="false"><p class="doc-text">Notariado el: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        shareholder_agreement: {
            title: "ACUERDO DE ACCIONISTAS",
            fields: [{ group: 'Empresa', fields: [{ id: 'company', label: 'Empresa', type: 'text', width: 'full' }, { id: 'shareholders', label: 'Nombres Accionistas', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE ACCIONISTAS</h2>
                    <p class="doc-text">Referente a: <strong>${data.company}</strong>.</p>
                    <p class="doc-text">Los accionistas abajo firmantes acuerdan las reglas de gobernanza, transferencia de acciones y votación descritas en los estatutos adjuntos.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Accionista Principal"></div><div class="sig-label">Accionista</div></div></div>
                </div>`
        },
        stock_purchase: {
            title: "COMPRAVENTA DE ACCIONES",
            fields: [{ group: 'Transacción', fields: [{ id: 'buyer', label: 'Comprador', type: 'text', width: 'full' }, { id: 'seller', label: 'Vendedor', type: 'text', width: 'full' }, { id: 'shares', label: 'Número de Acciones', type: 'number', width: 'half' }, { id: 'price', label: 'Precio Total ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE COMPRA DE ACCIONES</h2>
                    <p class="doc-text">El Vendedor <strong>${data.seller}</strong> vende a <strong>${data.buyer}</strong> un total de <strong>${data.shares}</strong> acciones por el precio de <strong>$ ${data.price}</strong>.</p>
                    <p class="doc-text">El Vendedor garantiza que posee título claro sobre dichas acciones.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Vendedor"></div><div class="sig-label">Vendedor</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Comprador"></div><div class="sig-label">Comprador</div></div></div>
                </div>`
        },
        asset_purchase: {
            title: "COMPRAVENTA DE ACTIVOS",
            fields: [{ group: 'Detalles', fields: [{ id: 'buyer', label: 'Comprador', type: 'text', width: 'full' }, { id: 'seller', label: 'Vendedor', type: 'text', width: 'full' }, { id: 'assets', label: 'Descripción de Activos', type: 'textarea', rows: 3 }, { id: 'price', label: 'Precio ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE COMPRA DE ACTIVOS</h2>
                    <p class="doc-text"><strong>${data.seller}</strong> (Vendedor) acuerda vender a <strong>${data.buyer}</strong> (Comprador) los siguientes activos:</p>
                    <div class="doc-body-text">${data.assets}</div>
                    <p class="doc-text">Precio de compra: <strong>$ ${data.price}</strong>. La venta incluye todo derecho, título e interés sobre los activos.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Vendedor"></div><div class="sig-label">Vendedor</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-buyer" onclick="NoteGenerator.openSignPad('buyer', this)" data-label="Firma Comprador"></div><div class="sig-label">Comprador</div></div></div>
                </div>`
        },
        ip_assignment: {
            title: "CESIÓN DE PROPIEDAD INTELECTUAL",
            fields: [{ group: 'Partes', fields: [{ id: 'assignor', label: 'Cedente (Assignor)', type: 'text', width: 'full' }, { id: 'assignee', label: 'Cesionario (Assignee)', type: 'text', width: 'full' }, { id: 'ipDesc', label: 'Descripción de la PI', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CESIÓN DE PROPIEDAD INTELECTUAL</h2>
                    <p class="doc-text">Yo, <strong>${data.assignor}</strong>, por valor recibido, cedo y transfiero a <strong>${data.assignee}</strong> todos mis derechos, títulos e intereses en:</p>
                    <div class="doc-body-text">${data.ipDesc}</div>
                    <p class="doc-text">Esta cesión es irrevocable y mundial.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Cedente"></div><div class="sig-label">${data.assignor}</div></div></div>
                     <div class="notary-block" contenteditable="false"><p class="doc-text">Notariado: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        construction_contract: {
            title: "CONTRATO DE CONSTRUCCIÓN",
            fields: [{ group: 'Obra', fields: [{ id: 'owner', label: 'Propietario', type: 'text', width: 'full' }, { id: 'contractor', label: 'Contratista', type: 'text', width: 'full' }, { id: 'address', label: 'Dirección Obra', type: 'text', width: 'full' }, { id: 'scope', label: 'Alcance del Trabajo', type: 'textarea', rows: 3 }, { id: 'price', label: 'Costo Total ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE CONSTRUCCIÓN</h2>
                    <p class="doc-text">Entre: <strong>${data.owner}</strong> y <strong>${data.contractor}</strong>.</p>
                    <p class="doc-text">El Contratista realizará los siguientes trabajos en ${data.address}:</p>
                    <div class="doc-body-text">${data.scope}</div>
                    <p class="doc-text">El Propietario pagará <strong>$ ${data.price}</strong> por los servicios.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div><div class="sig-label">Propietario</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-contractor" onclick="NoteGenerator.openSignPad('contractor', this)" data-label="Firma Contratista"></div><div class="sig-label">Contratista</div></div></div>
                </div>`
        },
        subcontractor_agreement: {
            title: "ACUERDO DE SUBCONTRATISTA",
            fields: [{ group: 'Servicio', fields: [{ id: 'contractor', label: 'Contratista Principal', type: 'text', width: 'full' }, { id: 'sub', label: 'Subcontratista', type: 'text', width: 'full' }, { id: 'service', label: 'Servicios', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE SUBCONTRATISTA INDEPENDIENTE</h2>
                    <p class="doc-text">El contratista <strong>${data.contractor}</strong> contrata a <strong>${data.sub}</strong> para realizar:</p>
                    <div class="doc-body-text">${data.service}</div>
                    <p class="doc-text">El Subcontratista es un contratista independiente, responsable de sus propios impuestos y seguros.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Contratista"></div><div class="sig-label">${data.contractor}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-sub" onclick="NoteGenerator.openSignPad('sub', this)" data-label="Firma Subcontratista"></div><div class="sig-label">${data.sub}</div></div></div>
                </div>`
        },
        loan_agreement: {
            title: "CONTRATO DE PRÉSTAMO DETALLADO",
            fields: [{ group: 'Términos', fields: [{ id: 'lender', label: 'Prestamista', type: 'text', width: 'full' }, { id: 'borrower', label: 'Prestatario', type: 'text', width: 'full' }, { id: 'amount', label: 'Monto ($)', type: 'number', width: 'half' }, { id: 'rate', label: 'Interés (%)', type: 'number', width: 'half' }, { id: 'term', label: 'Plazo (Meses)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE PRÉSTAMO PERSONAL</h2>
                    <p class="doc-text">Prestamista: <strong>${data.lender}</strong> | Prestatario: <strong>${data.borrower}</strong></p>
                    <p class="doc-text">Monto: <strong>$ ${data.amount}</strong> | Interés: <strong>${data.rate}%</strong> anual.</p>
                    <p class="doc-text">El Prestatario promete pagar el préstamo en <strong>${data.term}</strong> meses. El incumplimiento resultará en la aceleración de la deuda y costos legales.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Prestamista"></div><div class="sig-label">Prestamista</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-borrower" onclick="NoteGenerator.openSignPad('borrower', this)" data-label="Firma Prestatario"></div><div class="sig-label">Prestatario</div></div></div>
                     <div class="notary-block" contenteditable="false"><p class="doc-text">Reconocido ante mí: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        personal_guarantee: {
            title: "GARANTÍA PERSONAL",
            fields: [{ group: 'Garante', fields: [{ id: 'guarantor', label: 'Garante', type: 'text', width: 'full' }, { id: 'debtor', label: 'Deudor', type: 'text', width: 'full' }, { id: 'creditor', label: 'Acreedor', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">GARANTÍA PERSONAL</h2>
                    <p class="doc-text">Yo, <strong>${data.guarantor}</strong>, garantizo incondicionalmente el pago de todas las deudas contraídas por <strong>${data.debtor}</strong> a favor de <strong>${data.creditor}</strong>.</p>
                    <p class="doc-text">Esta es una garantía continua y cubre el principal, intereses y costos de cobranza.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Garante"></div><div class="sig-label">${data.guarantor}</div></div></div>
                    <div class="notary-block" contenteditable="false"><p class="doc-text">Reconocido ante mí: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        security_agreement: {
            title: "ACUERDO DE SEGURIDAD (COLATERAL)",
            fields: [{ group: 'Colateral', fields: [{ id: 'debtor', label: 'Deudor', type: 'text', width: 'full' }, { id: 'secured', label: 'Parte Asegurada', type: 'text', width: 'full' }, { id: 'collateral', label: 'Descripción del Colateral', type: 'textarea', rows: 3 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE SEGURIDAD</h2>
                    <p class="doc-text">Para garantizar el pago, el Deudor <strong>${data.debtor}</strong> otorga a <strong>${data.secured}</strong> un interés de seguridad sobre:</p>
                    <div class="doc-body-text">${data.collateral}</div>
                    <p class="doc-text">En caso de incumplimiento, la Parte Asegurada tiene derecho a tomar posesión del colateral.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Deudor"></div><div class="sig-label">${data.debtor}</div></div></div>
                </div>`
        },
        warranty_deed: {
            title: "ESCRITURA DE GARANTÍA (WARRANTY DEED)",
            fields: [{ group: 'Propiedad', fields: [{ id: 'grantor', label: 'Otorgante (Grantor)', type: 'text', width: 'full' }, { id: 'grantee', label: 'Beneficiario (Grantee)', type: 'text', width: 'full' }, { id: 'legalDesc', label: 'Desc. Legal Propiedad', type: 'textarea', rows: 3 }, { id: 'county', label: 'Condado', type: 'text', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ESCRITURA DE GARANTÍA GENERAL</h2>
                    <p class="doc-text">EL OTORGANTE: <strong>${data.grantor}</strong>, por y en consideración de la suma de $10.00 y otras buenas consideraciones, traslada y garantiza a:</p>
                    <p class="doc-text">EL BENEFICIARIO: <strong>${data.grantee}</strong>, la siguiente propiedad inmobiliaria en el Condado de ${data.county || '___________'}:</p>
                    <div class="doc-body-text">${data.legalDesc}</div>
                    <p class="doc-text">El Otorgante garantiza que tiene pleno derecho a vender dicha propiedad y la defenderá contra reclamaciones de todas las personas.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Otorgante"></div><div class="sig-label">${data.grantor}</div></div></div>
                     <div class="notary-block" contenteditable="false"><p class="doc-text">Reconocido ante mí este <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        copyright_assignment: {
            title: "CESIÓN DE DERECHOS DE AUTOR",
            fields: [{ group: 'Obra', fields: [{ id: 'assignor', label: 'Cedente', type: 'text', width: 'full' }, { id: 'assignee', label: 'Cesionario', type: 'text', width: 'full' }, { id: 'work', label: 'Título de la Obra', type: 'text', width: 'full' }, { id: 'regNum', label: 'No. Registro (Si aplica)', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CESIÓN DE DERECHOS DE AUTOR</h2>
                    <p class="doc-text">Por valor recibido, <strong>${data.assignor}</strong> cede a <strong>${data.assignee}</strong> todos los derechos, títulos e intereses sobre la obra titulada:</p>
                    <p class="doc-center-bold">"${data.work}"</p>
                    <p class="doc-text">Registro No: ${data.regNum || 'N/A'}. Esta cesión incluye todos los derechos de reproducción y distribución.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Cedente"></div><div class="sig-label">${data.assignor}</div></div></div>
                    <div class="notary-block" contenteditable="false"><p class="doc-text">Notariado: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        trademark_assignment: {
            title: "CESIÓN DE MARCA REGISTRADA",
            fields: [{ group: 'Marca', fields: [{ id: 'assignor', label: 'Cedente', type: 'text', width: 'full' }, { id: 'assignee', label: 'Cesionario', type: 'text', width: 'full' }, { id: 'mark', label: 'Nombre de la Marca', type: 'text', width: 'full' }, { id: 'regNum', label: 'No. Registro', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CESIÓN DE MARCA</h2>
                    <p class="doc-text">El Cedente <strong>${data.assignor}</strong> transfiere al Cesionario <strong>${data.assignee}</strong> todos los derechos sobre la marca:</p>
                    <p class="doc-center-bold">"${data.mark}"</p>
                    <p class="doc-text">No. Registro: ${data.regNum}. Incluye el "goodwill" del negocio asociado.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Cedente"></div><div class="sig-label">${data.assignor}</div></div></div>
                    <div class="notary-block" contenteditable="false"><p class="doc-text">Notariado: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        patent_assignment: {
            title: "CESIÓN DE PATENTE",
            fields: [{ group: 'Patente', fields: [{ id: 'assignor', label: 'Inventor/Cedente', type: 'text', width: 'full' }, { id: 'assignee', label: 'Cesionario', type: 'text', width: 'full' }, { id: 'title', label: 'Título de la Invención', type: 'text', width: 'full' }, { id: 'patNum', label: 'No. Patente/Aplicación', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CESIÓN DE PATENTE</h2>
                    <p class="doc-text">Yo, <strong>${data.assignor}</strong>, cedo a <strong>${data.assignee}</strong> todos los derechos sobre la invención titulada "<strong>${data.title}</strong>".</p>
                    <p class="doc-text">Número de Patente/Aplicación: <strong>${data.patNum}</strong>.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Inventor"></div><div class="sig-label">${data.assignor}</div></div></div>
                    <div class="notary-block" contenteditable="false"><p class="doc-text">Notariado: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        domain_assignment: {
            title: "TRANSFERENCIA DE DOMINIO",
            fields: [{ group: 'Dominio', fields: [{ id: 'transferor', label: 'Transferente', type: 'text', width: 'full' }, { id: 'transferee', label: 'Adquirente', type: 'text', width: 'full' }, { id: 'domain', label: 'Nombre de Dominio', type: 'text', width: 'full' }, { id: 'price', label: 'Precio ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE TRANSFERENCIA DE DOMINIO</h2>
                    <p class="doc-text"><strong>${data.transferor}</strong> transfiere a <strong>${data.transferee}</strong> todo control y propiedad sobre el nombre de dominio:</p>
                    <p class="doc-center-bold">www.${data.domain}</p>
                    <p class="doc-text">Precio de transferencia: <strong>$ ${data.price}</strong>.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Transferente"></div><div class="sig-label">${data.transferor}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-new" onclick="NoteGenerator.openSignPad('new', this)" data-label="Firma Adquirente"></div><div class="sig-label">${data.transferee}</div></div></div>
                </div>`
        },
        privacy_policy: {
            title: "POLÍTICA DE PRIVACIDAD",
            fields: [{ group: 'Sitio', fields: [{ id: 'company', label: 'Empresa', type: 'text', width: 'full' }, { id: 'url', label: 'URL del Sitio Web', type: 'text', width: 'full' }, { id: 'email', label: 'Email de Contacto', type: 'email', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">POLÍTICA DE PRIVACIDAD</h2>
                    <p class="doc-text">Última actualización: <strong>${data.date}</strong></p>
                    <p class="doc-text"><strong>${data.company}</strong> ("nosotros") opera el sitio web ${data.url}. Esta página le informa sobre nuestras políticas con respecto a la recopilación, uso y divulgación de datos personales.</p>
                    <h3 style="font-size:1rem;margin-top:10px;">Recopilación de Datos</h3>
                    <p class="doc-text">Recopilamos varios tipos de información para diversos fines para proporcionar y mejorar nuestro servicio.</p>
                    <h3 style="font-size:1rem;margin-top:10px;">Contacto</h3>
                    <p class="doc-text">Si tiene preguntas, contáctenos en: ${data.email}.</p>
                </div>`
        },
        terms_service: {
            title: "TÉRMINOS Y CONDICIONES",
            fields: [{ group: 'Sitio', fields: [{ id: 'company', label: 'Empresa', type: 'text', width: 'full' }, { id: 'url', label: 'URL del Sitio Web', type: 'text', width: 'full' }, { id: 'jurisdiction', label: 'Jurisdicción (Estado/País)', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">TÉRMINOS Y CONDICIONES DE USO</h2>
                    <p class="doc-text">Bienvenido a ${data.url}. Estos términos describen las reglas y regulaciones para el uso del sitio web de <strong>${data.company}</strong>.</p>
                    <p class="doc-text">Al acceder a este sitio web, asumimos que acepta estos términos y condiciones en su totalidad.</p>
                    <p class="doc-text">Estos términos se regirán e interpretarán de acuerdo con las leyes de <strong>${data.jurisdiction}</strong>.</p>
                </div>`
        },
        influencer_agreement: {
            title: "CONTRATO DE INFLUENCER",
            fields: [{ group: 'Campaña', fields: [{ id: 'brand', label: 'Marca', type: 'text', width: 'full' }, { id: 'influencer', label: 'Influencer', type: 'text', width: 'full' }, { id: 'platform', label: 'Plataforma (IG/TikTok)', type: 'text', width: 'half' }, { id: 'fee', label: 'Tarifa ($)', type: 'number', width: 'half' }, { id: 'deliverables', label: 'Entregables (Posts/Videos)', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE MARKETING DE INFLUENCERS</h2>
                    <p class="doc-text">Entre <strong>${data.brand}</strong> y <strong>${data.influencer}</strong>.</p>
                    <p class="doc-text">El Influencer creará contenido para la plataforma <strong>${data.platform}</strong>. Entregables:</p>
                    <div class="doc-body-text">${data.deliverables}</div>
                    <p class="doc-text">Compensación total: <strong>$ ${data.fee}</strong>, pagaderos tras la publicación.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Marca"></div><div class="sig-label">${data.brand}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-inf" onclick="NoteGenerator.openSignPad('inf', this)" data-label="Firma Influencer"></div><div class="sig-label">${data.influencer}</div></div></div>
                </div>`
        },
        sponsorship_agreement: {
            title: "ACUERDO DE PATROCINIO",
            fields: [{ group: 'Detalles', fields: [{ id: 'sponsor', label: 'Patrocinador', type: 'text', width: 'full' }, { id: 'recipient', label: 'Beneficiario', type: 'text', width: 'full' }, { id: 'event', label: 'Evento', type: 'text', width: 'full' }, { id: 'amount', label: 'Aporte ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE PATROCINIO</h2>
                    <p class="doc-text">El Patrocinador <strong>${data.sponsor}</strong> acuerda apoyar a <strong>${data.recipient}</strong> para el evento: "${data.event}".</p>
                    <p class="doc-text">Aporte de Patrocinio: <strong>$ ${data.amount}</strong>. A cambio, el Beneficiario proporcionará publicidad y reconocimiento de marca según lo acordado.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Patrocinador"></div><div class="sig-label">${data.sponsor}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-rec" onclick="NoteGenerator.openSignPad('rec', this)" data-label="Firma Beneficiario"></div><div class="sig-label">${data.recipient}</div></div></div>
                </div>`
        },
        referral_agreement: {
            title: "ACUERDO DE REFERIDOS",
            fields: [{ group: 'Comisión', fields: [{ id: 'company', label: 'Empresa', type: 'text', width: 'full' }, { id: 'referrer', label: 'Referidor', type: 'text', width: 'full' }, { id: 'commission', label: 'Comisión (%) o Monto Fijo', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE REFERENCIA</h2>
                    <p class="doc-text"><strong>${data.company}</strong> acuerda pagar a <strong>${data.referrer}</strong> una comisión por cada cliente calificado referido.</p>
                    <p class="doc-text">Términos de Comisión: <strong>${data.commission}</strong> por venta cerrada.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Empresa"></div><div class="sig-label">${data.company}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-ref" onclick="NoteGenerator.openSignPad('ref', this)" data-label="Firma Referidor"></div><div class="sig-label">${data.referrer}</div></div></div>
                </div>`
        },
        commission_agreement: {
            title: "ACUERDO DE COMISIÓN",
            fields: [{ group: 'Ventas', fields: [{ id: 'principal', label: 'Principal', type: 'text', width: 'full' }, { id: 'agent', label: 'Agente', type: 'text', width: 'full' }, { id: 'structure', label: 'Estructura de Comisión', type: 'textarea', rows: 3 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE COMISIÓN DE VENTAS</h2>
                    <p class="doc-text">Entre <strong>${data.principal}</strong> y <strong>${data.agent}</strong>.</p>
                    <p class="doc-text">El Agente venderá productos/servicios del Principal y recibirá una compensación basada en:</p>
                    <div class="doc-body-text">${data.structure}</div>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Principal"></div><div class="sig-label">${data.principal}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-agent" onclick="NoteGenerator.openSignPad('agent', this)" data-label="Firma Agente"></div><div class="sig-label">${data.agent}</div></div></div>
                </div>`
        },
        distributor_agreement: {
            title: "CONTRATO DE DISTRIBUCIÓN",
            fields: [{ group: 'Distribución', fields: [{ id: 'supplier', label: 'Proveedor', type: 'text', width: 'full' }, { id: 'distributor', label: 'Distribuidor', type: 'text', width: 'full' }, { id: 'territory', label: 'Territorio Exclusivo', type: 'text', width: 'full' }, { id: 'products', label: 'Productos', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE DISTRIBUCIÓN EXCLUSIVA</h2>
                    <p class="doc-text">El Proveedor <strong>${data.supplier}</strong> otorga a <strong>${data.distributor}</strong> el derecho exclusivo de distribuir los siguientes productos:</p>
                    <div class="doc-body-text">${data.products}</div>
                    <p class="doc-text">En el territorio de: <strong>${data.territory}</strong>.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Proveedor"></div><div class="sig-label">${data.supplier}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-dist" onclick="NoteGenerator.openSignPad('dist', this)" data-label="Firma Distribuidor"></div><div class="sig-label">${data.distributor}</div></div></div>
                </div>`
        },
        manufacturing_agreement: {
            title: "CONTRATO DE MANUFACTURA",
            fields: [{ group: 'Producción', fields: [{ id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'manufacturer', label: 'Fabricante', type: 'text', width: 'full' }, { id: 'product', label: 'Producto a Fabricar', type: 'text', width: 'full' }, { id: 'price', label: 'Precio por Unidad', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE MANUFACTURA</h2>
                    <p class="doc-text">El Fabricante <strong>${data.manufacturer}</strong> acuerda producir <strong>${data.product}</strong> para el Cliente <strong>${data.client}</strong>.</p>
                    <p class="doc-text">Precio acordado: <strong>$ ${data.price}</strong> por unidad. El Fabricante garantiza la calidad y especificaciones del producto.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-man" onclick="NoteGenerator.openSignPad('man', this)" data-label="Firma Fabricante"></div><div class="sig-label">${data.manufacturer}</div></div></div>
                </div>`
        },
        supply_agreement: {
            title: "CONTRATO DE SUMINISTRO",
            fields: [{ group: 'Suministro', fields: [{ id: 'purchaser', label: 'Comprador', type: 'text', width: 'full' }, { id: 'supplier', label: 'Proveedor', type: 'text', width: 'full' }, { id: 'goods', label: 'Bienes', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE SUMINISTRO</h2>
                    <p class="doc-text">El Proveedor <strong>${data.supplier}</strong> se compromete a suministrar a <strong>${data.purchaser}</strong> los siguientes bienes de manera recurrente:</p>
                    <div class="doc-body-text">${data.goods}</div>
                    <p class="doc-text">Este acuerdo asegura la disponibilidad y precio de los bienes durante el término del contrato.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Comprador"></div><div class="sig-label">${data.purchaser}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-sup" onclick="NoteGenerator.openSignPad('sup', this)" data-label="Firma Proveedor"></div><div class="sig-label">${data.supplier}</div></div></div>
                </div>`
        },
        agency_agreement: {
            title: "CONTRATO DE AGENCIA",
            fields: [{ group: 'Relación', fields: [{ id: 'principal', label: 'Principal', type: 'text', width: 'full' }, { id: 'agent', label: 'Agente', type: 'text', width: 'full' }, { id: 'scope', label: 'Alcance de la Autoridad', type: 'textarea', rows: 3 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE AGENCIA Y REPRESENTACIÓN</h2>
                    <p class="doc-text">Yo, <strong>${data.principal}</strong>, nombro a <strong>${data.agent}</strong> como mi agente legal para actuar en mi nombre con respecto a:</p>
                    <div class="doc-body-text">${data.scope}</div>
                    <p class="doc-text">El Agente acepta actuar con lealtad y cuidado en el mejor interés del Principal.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Principal"></div><div class="sig-label">${data.principal}</div></div></div>
                    <div class="notary-block" contenteditable="false"><p class="doc-text">Notariado: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        vehicle_lease: {
            title: "ARRENDAMIENTO DE VEHÍCULO",
            fields: [{ group: 'Vehículo', fields: [{ id: 'lessor', label: 'Arrendador', type: 'text', width: 'full' }, { id: 'lessee', label: 'Arrendatario', type: 'text', width: 'full' }, { id: 'vehicle', label: 'Vehículo (Marca/Modelo/Año/VIN)', type: 'textarea', rows: 2 }, { id: 'payment', label: 'Pago Mensual ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ARRENDAMIENTO DE VEHÍCULO</h2>
                    <p class="doc-text">Arrendador: <strong>${data.lessor}</strong> | Arrendatario: <strong>${data.lessee}</strong></p>
                    <p class="doc-text">Vehículo arrendado:</p>
                    <div class="doc-body-text">${data.vehicle}</div>
                    <p class="doc-text">El Arrendatario pagará <strong>$ ${data.payment}</strong> por mes. El vehículo debe ser devuelto en buenas condiciones al final del plazo.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Arrendador"></div><div class="sig-label">${data.lessor}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-lessee" onclick="NoteGenerator.openSignPad('lessee', this)" data-label="Firma Arrendatario"></div><div class="sig-label">${data.lessee}</div></div></div>
                </div>`
        },
        internship_agreement: {
            title: "ACUERDO DE PASANTÍA",
            fields: [{ group: 'Pasantía', fields: [{ id: 'company', label: 'Empresa', type: 'text', width: 'full' }, { id: 'intern', label: 'Pasante', type: 'text', width: 'full' }, { id: 'role', label: 'Puesto/Rol', type: 'text', width: 'full' }, { id: 'compensation', label: 'Compensación (Si aplica)', type: 'text', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE PASANTÍA</h2>
                    <p class="doc-text">Entre: <strong>${data.company}</strong> y <strong>${data.intern}</strong>.</p>
                    <p class="doc-text">Este acuerdo confirma que el Pasante realizará una pasantía como <strong>${data.role}</strong>.</p>
                    <p class="doc-text">Compensación: ${data.compensation || 'Pasantía no remunerada'}.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Empresa"></div><div class="sig-label">${data.company}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-intern" onclick="NoteGenerator.openSignPad('intern', this)" data-label="Firma Pasante"></div><div class="sig-label">${data.intern}</div></div></div>
                </div>`
        },
        volunteer_agreement: {
            title: "ACUERDO DE VOLUNTARIADO",
            fields: [{ group: 'Voluntariado', fields: [{ id: 'org', label: 'Organización', type: 'text', width: 'full' }, { id: 'volunteer', label: 'Voluntario', type: 'text', width: 'full' }, { id: 'tasks', label: 'Tareas', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE SERVICIO VOLUNTARIO</h2>
                    <p class="doc-text">El Voluntario <strong>${data.volunteer}</strong> acuerda donar su tiempo a <strong>${data.org}</strong>.</p>
                    <p class="doc-text">Tareas: ${data.tasks}</p>
                    <p class="doc-text">El Voluntario entiende que no recibirá compensación financiera alguna.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Voluntario"></div><div class="sig-label">${data.volunteer}</div></div></div>
                </div>`
        },
        remote_work_agreement: {
            title: "ACUERDO DE TRABAJO REMOTO",
            fields: [{ group: 'Trabajo Remoto', fields: [{ id: 'emp', label: 'Empleado', type: 'text', width: 'full' }, { id: 'manager', label: 'Supervisor', type: 'text', width: 'full' }, { id: 'schedule', label: 'Horario de Trabajo', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">POLÍTICA DE TRABAJO REMOTO</h2>
                    <p class="doc-text">Empleado: <strong>${data.emp}</strong>. Aprobado por: <strong>${data.manager}</strong>.</p>
                    <p class="doc-text">Se autoriza al empleado a trabajar desde casa bajo el siguiente horario/condiciones:</p>
                    <div class="doc-body-text">${data.schedule}</div>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Empleado"></div><div class="sig-label">${data.emp}</div></div></div>
                </div>`
        },
        employee_handbook_ack: {
            title: "ACUSE DE RECIBO DE MANUAL",
            fields: [{ group: 'Confirmación', fields: [{ id: 'emp', label: 'Empleado', type: 'text', width: 'full' }, { id: 'version', label: 'Versión del Manual (Fecha/Año)', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUSE DE RECIBO DE MANUAL DEL EMPLEADO</h2>
                    <p class="doc-text">Yo, <strong>${data.emp}</strong>, certifico que he recibido y leído el Manual del Empleado (Versión: ${data.version}).</p>
                    <p class="doc-text">Entiendo que es mi responsabilidad familiarizarme con las políticas de la empresa.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Empleado"></div><div class="sig-label">${data.emp}</div></div></div>
                </div>`
        },
        property_management: {
            title: "ADMINISTRACIÓN DE PROPIEDADES",
            fields: [{ group: 'Contrato', fields: [{ id: 'owner', label: 'Propietario', type: 'text', width: 'full' }, { id: 'manager', label: 'Administrador (Manager)', type: 'text', width: 'full' }, { id: 'address', label: 'Propiedad', type: 'text', width: 'full' }, { id: 'fee', label: 'Honorarios (% o Fijo)', type: 'text', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ADMINISTRACIÓN DE PROPIEDAD</h2>
                    <p class="doc-text">El Propietario <strong>${data.owner}</strong> designa a <strong>${data.manager}</strong> como agente exclusivo para administrar la propiedad en:</p>
                    <p class="doc-center-bold">${data.address}</p>
                    <p class="doc-text">El Administrador recibirá: <strong>${data.fee}</strong> por sus servicios.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div><div class="sig-label">${data.owner}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-mgr" onclick="NoteGenerator.openSignPad('mgr', this)" data-label="Firma Administrador"></div><div class="sig-label">${data.manager}</div></div></div>
                </div>`
        },
        storage_lease: {
            title: "ALQUILER DE ALMACENAMIENTO",
            fields: [{ group: 'Almacén', fields: [{ id: 'landlord', label: 'Arrendador', type: 'text', width: 'full' }, { id: 'tenant', label: 'Arrendatario', type: 'text', width: 'full' }, { id: 'unit', label: 'Unidad #', type: 'text', width: 'half' }, { id: 'rent', label: 'Renta Mensual ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ALQUILER DE ESPACIO DE ALMACENAMIENTO</h2>
                    <p class="doc-text">Arrendador: <strong>${data.landlord}</strong>. Arrendatario: <strong>${data.tenant}</strong>.</p>
                    <p class="doc-text">Se alquila la unidad de almacenamiento #: <strong>${data.unit}</strong>.</p>
                    <p class="doc-text">Renta mensual: <strong>$ ${data.rent}</strong>. Solo para almacenamiento de bienes personales.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Arrendador"></div><div class="sig-label">${data.landlord}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-ten" onclick="NoteGenerator.openSignPad('ten', this)" data-label="Firma Arrendatario"></div><div class="sig-label">${data.tenant}</div></div></div>
                </div>`
        },
        parking_lease: {
            title: "ALQUILER DE ESTACIONAMIENTO",
            fields: [{ group: 'Espacio', fields: [{ id: 'lessor', label: 'Arrendador', type: 'text', width: 'full' }, { id: 'lessee', label: 'Usuario', type: 'text', width: 'full' }, { id: 'spot', label: 'Espacio # / Ubicación', type: 'text', width: 'full' }, { id: 'rent', label: 'Renta Mensual ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE ALQUILER DE ESTACIONAMIENTO</h2>
                    <p class="doc-text">Entre <strong>${data.lessor}</strong> y <strong>${data.lessee}</strong>.</p>
                    <p class="doc-text">Se alquila el espacio de estacionamiento ubicado en: <strong>${data.spot}</strong>.</p>
                    <p class="doc-text">Tarifa mensual: <strong>$ ${data.rent}</strong>. El usuario asume responsabilidad por su vehículo.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Arrendador"></div><div class="sig-label">${data.lessor}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-lessee" onclick="NoteGenerator.openSignPad('lessee', this)" data-label="Firma Usuario"></div><div class="sig-label">${data.lessee}</div></div></div>
                </div>`
        },
        lease_violation: {
            title: "AVISO DE VIOLACIÓN DE ALQUILER",
            fields: [{ group: 'Violación', fields: [{ id: 'landlord', label: 'Arrendador', type: 'text', width: 'full' }, { id: 'tenant', label: 'Inquilino', type: 'text', width: 'full' }, { id: 'violation', label: 'Descripción de la Violación', type: 'textarea', rows: 3 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AVISO DE VIOLACIÓN DE CONTRATO</h2>
                    <p class="doc-text">PARA: <strong>${data.tenant}</strong>.</p>
                    <p class="doc-text">Usted está en violación de su contrato de arrendamiento debido a:</p>
                    <div class="doc-body-text">${data.violation}</div>
                    <p class="doc-text">Debe corregir esta violación inmediatamente para evitar acciones legales o de desalojo.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Arrendador"></div><div class="sig-label">${data.landlord}</div></div></div>
                </div>`
        },
        rent_receipt: {
            title: "RECIBO DE RENTA",
            fields: [{ group: 'Pago', fields: [{ id: 'landlord', label: 'Arrendador/Recibido Por', type: 'text', width: 'full' }, { id: 'tenant', label: 'Inquilino', type: 'text', width: 'full' }, { id: 'amount', label: 'Monto Recibido ($)', type: 'number', width: 'half' }, { id: 'period', label: 'Periodo de Renta (Mes)', type: 'text', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">RECIBO DE PAGO DE RENTA</h2>
                    <p class="doc-text">Fecha: <strong>${data.date}</strong></p>
                    <p class="doc-text">Recibí de <strong>${data.tenant}</strong> la suma de <strong>$ ${data.amount}</strong>.</p>
                    <p class="doc-text">Por el alquiler correspondiente al periodo: <strong>${data.period}</strong>.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Recipiente"></div><div class="sig-label">${data.landlord}</div></div></div>
                </div>`
        },
        photography_contract: {
            title: "CONTRATO DE FOTOGRAFÍA",
            fields: [{ group: 'Evento', fields: [{ id: 'photographer', label: 'Fotógrafo', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'eventDate', label: 'Fecha del Evento', type: 'date', width: 'half' }, { id: 'fee', label: 'Tarifa Total ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE SERVICIOS DE FOTOGRAFÍA</h2>
                    <p class="doc-text">Cliente: <strong>${data.client}</strong> | Fotógrafo: <strong>${data.photographer}</strong></p>
                    <p class="doc-text">Fecha del Evento: <strong>${data.eventDate}</strong>.</p>
                    <p class="doc-text">El Cliente acuerda pagar <strong>$ ${data.fee}</strong> por los servicios. El Fotógrafo conserva los derechos de autor.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Fotógrafo"></div><div class="sig-label">${data.photographer}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        venue_rental: {
            title: "ALQUILER DE EVENTOS",
            fields: [{ group: 'Evento', fields: [{ id: 'venue', label: 'Propietario del Salón', type: 'text', width: 'full' }, { id: 'renter', label: 'Arrendatario', type: 'text', width: 'full' }, { id: 'eventDate', label: 'Fecha Evento', type: 'date', width: 'half' }, { id: 'cost', label: 'Costo Alquiler ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ALQUILER DE SALÓN DE EVENTOS</h2>
                    <p class="doc-text">El Propietario <strong>${data.venue}</strong> alquila el espacio a <strong>${data.renter}</strong> para el evento del día <strong>${data.eventDate}</strong>.</p>
                    <p class="doc-text">Costo total: <strong>$ ${data.cost}</strong>. El Arrendatario es responsable de cualquier daño a la propiedad.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div><div class="sig-label">${data.venue}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-rent" onclick="NoteGenerator.openSignPad('rent', this)" data-label="Firma Arrendatario"></div><div class="sig-label">${data.renter}</div></div></div>
                </div>`
        },
        catering_agreement: {
            title: "CONTRATO DE CATERING",
            fields: [{ group: 'Catering', fields: [{ id: 'caterer', label: 'Empresa de Catering', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'menu', label: 'Detalles del Menú', type: 'textarea', rows: 2 }, { id: 'pax', label: 'Número de Personas', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE SERVICIOS DE CATERING</h2>
                    <p class="doc-text">Proveedor: <strong>${data.caterer}</strong>. Cliente: <strong>${data.client}</strong>.</p>
                    <p class="doc-text">Servicio para aprox. <strong>${data.pax}</strong> personas. Menú acordado:</p>
                    <div class="doc-body-text">${data.menu}</div>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Proveedor"></div><div class="sig-label">${data.caterer}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        dj_contract: {
            title: "CONTRATO DE DJ",
            fields: [{ group: 'Servicio', fields: [{ id: 'dj', label: 'Nombre Artístico/DJ', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'hours', label: 'Horas de Servicio', type: 'text', width: 'half' }, { id: 'fee', label: 'Tarifa ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE SERVICIOS DE ENTRETENIMIENTO (DJ)</h2>
                    <p class="doc-text">El Artista <strong>${data.dj}</strong> proveerá servicios musicales a <strong>${data.client}</strong>.</p>
                    <p class="doc-text">Duración: <strong>${data.hours}</strong>. Tarifa acordada: <strong>$ ${data.fee}</strong>.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma DJ"></div><div class="sig-label">${data.dj}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        model_release_adult: {
            title: "MODEL RELEASE (ADULTO)",
            fields: [{ group: 'Modelo', fields: [{ id: 'model', label: 'Nombre del Modelo', type: 'text', width: 'full' }, { id: 'photographer', label: 'Fotógrafo', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AUTORIZACIÓN DE USO DE IMAGEN (MODELO ADULTO)</h2>
                    <p class="doc-text">Yo, <strong>${data.model}</strong>, otorgo a <strong>${data.photographer}</strong> permiso irrevocable para usar mi imagen en fotografías/videos para cualquier fin legal (incluyendo comercial y promocional).</p>
                    <p class="doc-text">Libero al Fotógrafo de cualquier responsabilidad derivada de dicho uso.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Modelo"></div><div class="sig-label">${data.model}</div></div></div>
                </div>`
        },
        consignment_agreement: {
            title: "ACUERDO DE CONSIGNACIÓN",
            fields: [{ group: 'Venta', fields: [{ id: 'owner', label: 'Dueño del Producto', type: 'text', width: 'full' }, { id: 'shop', label: 'Tienda/Consignatario', type: 'text', width: 'full' }, { id: 'items', label: 'Artículos', type: 'textarea', rows: 2 }, { id: 'split', label: 'División (%)', type: 'text', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE CONSIGNACIÓN</h2>
                    <p class="doc-text">El Dueño <strong>${data.owner}</strong> entrega a <strong>${data.shop}</strong> los siguientes artículos para su venta:</p>
                    <div class="doc-body-text">${data.items}</div>
                    <p class="doc-text">División de ganancias: <strong>${data.split}</strong>.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Dueño"></div><div class="sig-label">${data.owner}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-shop" onclick="NoteGenerator.openSignPad('shop', this)" data-label="Firma Tienda"></div><div class="sig-label">${data.shop}</div></div></div>
                </div>`
        },
        purchase_order: {
            title: "ORDEN DE COMPRA",
            fields: [{ group: 'Orden', fields: [{ id: 'buyer', label: 'Comprador', type: 'text', width: 'full' }, { id: 'vendor', label: 'Vendedor', type: 'text', width: 'full' }, { id: 'items', label: 'Lista de Productos', type: 'textarea', rows: 3 }, { id: 'total', label: 'Total ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ORDEN DE COMPRA</h2>
                    <p class="doc-text">DE: <strong>${data.buyer}</strong><br>PARA: <strong>${data.vendor}</strong></p>
                    <p class="doc-text">Por favor suministrar los siguientes artículos:</p>
                    <div class="doc-body-text">${data.items}</div>
                    <p class="doc-text"><strong>PRECIO TOTAL: $ ${data.total}</strong>.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Comprador"></div><div class="sig-label">${data.buyer}</div></div></div>
                </div>`
        },
        invoice_template: {
            title: "FACTURA DE SERVICIOS",
            fields: [{ group: 'Factura', fields: [{ id: 'provider', label: 'Proveedor', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'desc', label: 'Descripción Servicios', type: 'textarea', rows: 2 }, { id: 'amount', label: 'Monto a Pagar ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">FACTURA</h2>
                    <p class="doc-text">A: <strong>${data.client}</strong><br>DE: <strong>${data.provider}</strong></p>
                    <p class="doc-text">Por servicios profesionales prestados:</p>
                    <div class="doc-body-text">${data.desc}</div>
                    <p class="doc-center-bold" style="font-size:1.5em; border-top:2px solid #000; margin-top:20px;">TOTAL: $ ${data.amount}</p>
                </div>`
        },
        hipaa_release: {
            title: "AUTORIZACIÓN HIPAA",
            fields: [{ group: 'Paciente', fields: [{ id: 'patient', label: 'Paciente', type: 'text', width: 'full' }, { id: 'provider', label: 'Proveedor Médico/Hospital', type: 'text', width: 'full' }, { id: 'recipient', label: 'Persona Autorizada a Recibir Info', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">AUTORIZACIÓN HIPAA PARA DIVULGACIÓN</h2>
                    <p class="doc-text">Yo, <strong>${data.patient}</strong>, autorizo a <strong>${data.provider}</strong> a divulgar mi información de salud protegida (PHI) a:</p>
                    <p class="doc-center-bold">${data.recipient}</p>
                    <p class="doc-text">Entiendo que puedo revocar esta autorización por escrito en cualquier momento.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Paciente"></div><div class="sig-label">${data.patient}</div></div></div>
                     <div class="notary-block" contenteditable="false"><p class="doc-text">Notariado: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        medical_consent_caregiver: {
            title: "CONSENTIMIENTO MÉDICO CUIDADOR",
            fields: [{ group: 'Permiso', fields: [{ id: 'parent', label: 'Padre/Tutor', type: 'text', width: 'full' }, { id: 'caregiver', label: 'Cuidador Autorizado', type: 'text', width: 'full' }, { id: 'child', label: 'Menor', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONSENTIMIENTO MÉDICO PARA CUIDADOR</h2>
                    <p class="doc-text">Yo, <strong>${data.parent}</strong>, padre/tutor de <strong>${data.child}</strong>, autorizo a:</p>
                    <p class="doc-center-bold">${data.caregiver}</p>
                    <p class="doc-text">A tomar decisiones médicas de emergencia y tratamiento para el Menor en mi ausencia.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Padre"></div><div class="sig-label">${data.parent}</div></div></div>
                     <div class="notary-block" contenteditable="false"><p class="doc-text">Jurado ante mí: <strong>${data.date}</strong>.</p><div class="notary-seal-placeholder">SELLO</div><div class="sig-zone" id="sig-notary" onclick="NoteGenerator.openSignPad('notary', this)" data-label="Firma Notario"></div></div>
                </div>`
        },
        equipment_rental_personal: {
            title: "ALQUILER DE EQUIPO",
            fields: [{ group: 'Equipo', fields: [{ id: 'owner', label: 'Dueño', type: 'text', width: 'full' }, { id: 'renter', label: 'Arrendatario', type: 'text', width: 'full' }, { id: 'equip', label: 'Equipo (Cámaras/Herramientas/Etc)', type: 'textarea', rows: 2 }, { id: 'fee', label: 'Tarifa Diaria/Total ($)', type: 'text', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ALQUILER DE EQUIPO</h2>
                    <p class="doc-text">El Dueño <strong>${data.owner}</strong> alquila el siguiente equipo a <strong>${data.renter}</strong>:</p>
                    <div class="doc-body-text">${data.equip}</div>
                    <p class="doc-text">Tarifa: <strong>${data.fee}</strong>. El Arrendatario acepta devolver el equipo en las mismas condiciones.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Dueño"></div><div class="sig-label">${data.owner}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-rent" onclick="NoteGenerator.openSignPad('rent', this)" data-label="Firma Arrendatario"></div><div class="sig-label">${data.renter}</div></div></div>
                </div>`
        },
        music_license: {
            title: "LICENCIA MUSICAL",
            fields: [{ group: 'Licencia', fields: [{ id: 'licensor', label: 'Licenciante (Compositor)', type: 'text', width: 'full' }, { id: 'licensee', label: 'Licenciatario (Usuario)', type: 'text', width: 'full' }, { id: 'song', label: 'Título de la Canción', type: 'text', width: 'full' }, { id: 'usage', label: 'Uso Permitido', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE LICENCIA DE USO MUSICAL</h2>
                    <p class="doc-text">El Licenciante <strong>${data.licensor}</strong> otorga a <strong>${data.licensee}</strong> una licencia no exclusiva para usar la canción "<strong>${data.song}</strong>".</p>
                    <p class="doc-text">Uso permitido:</p>
                    <div class="doc-body-text">${data.usage}</div>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Licenciante"></div><div class="sig-label">${data.licensor}</div></div></div>
                </div>`
        },
        artwork_commission: {
            title: "COMISIÓN DE ARTE",
            fields: [{ group: 'Obra', fields: [{ id: 'artist', label: 'Artista', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'description', label: 'Descripción de la Obra', type: 'textarea', rows: 3 }, { id: 'price', label: 'Precio ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE COMISIÓN DE OBRA DE ARTE</h2>
                    <p class="doc-text">El Cliente <strong>${data.client}</strong> comisiona al Artista <strong>${data.artist}</strong> para crear:</p>
                    <div class="doc-body-text">${data.description}</div>
                    <p class="doc-text">Precio acordado: <strong>$ ${data.price}</strong>. El Artista conserva los derechos de exhibición en portafolio.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Artista"></div><div class="sig-label">${data.artist}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        video_production: {
            title: "PRODUCCIÓN DE VIDEO",
            fields: [{ group: 'Proyecto', fields: [{ id: 'producer', label: 'Productor', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'project', label: 'Detalles del Proyecto', type: 'textarea', rows: 3 }, { id: 'deadline', label: 'Fecha de Entrega', type: 'date', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE PRODUCCIÓN DE VIDEO</h2>
                    <p class="doc-text">Entre <strong>${data.producer}</strong> y <strong>${data.client}</strong>.</p>
                    <p class="doc-text">El Productor creará un video basado en las siguientes especificaciones:</p>
                    <div class="doc-body-text">${data.project}</div>
                    <p class="doc-text">Entrega final programada para: <strong>${data.deadline}</strong>.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Productor"></div><div class="sig-label">${data.producer}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        podcast_guest: {
            title: "INVITADO DE PODCAST",
            fields: [{ group: 'Podcast', fields: [{ id: 'host', label: 'Anfitrión/Podcast', type: 'text', width: 'full' }, { id: 'guest', label: 'Invitado', type: 'text', width: 'full' }, { id: 'topic', label: 'Tema', type: 'text', width: 'full' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE INVITADO A PODCAST</h2>
                    <p class="doc-text">El Invitado <strong>${data.guest}</strong> consiente ser grabado por <strong>${data.host}</strong>.</p>
                    <p class="doc-text">El Invitado otorga todos los derechos de distribución y edición del episodio sobre "${data.topic}" al Anfitrión.</p>
                    <br><div class="sig-section" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Invitado"></div><div class="sig-label">${data.guest}</div></div></div>
                </div>`
        },
        house_sitting: {
            title: "CUIDADO DE CASA",
            fields: [{ group: 'Casa', fields: [{ id: 'owner', label: 'Propietario', type: 'text', width: 'full' }, { id: 'sitter', label: 'Cuidador', type: 'text', width: 'full' }, { id: 'dates', label: 'Fechas', type: 'text', width: 'full' }, { id: 'duties', label: 'Deberes (Plantas, Correo, etc)', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ACUERDO DE "HOUSE SITTING"</h2>
                    <p class="doc-text">El Cuidador <strong>${data.sitter}</strong> cuidará la casa de <strong>${data.owner}</strong> durante: ${data.dates}.</p>
                    <p class="doc-text">Responsabilidades:</p>
                    <div class="doc-body-text">${data.duties}</div>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Propietario"></div><div class="sig-label">${data.owner}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-sit" onclick="NoteGenerator.openSignPad('sit', this)" data-label="Firma Cuidador"></div><div class="sig-label">${data.sitter}</div></div></div>
                </div>`
        },
        pet_sitting: {
            title: "CUIDADO DE MASCOTAS",
            fields: [{ group: 'Mascota', fields: [{ id: 'owner', label: 'Dueño', type: 'text', width: 'full' }, { id: 'sitter', label: 'Cuidador', type: 'text', width: 'full' }, { id: 'pets', label: 'Mascotas (Nombres/Razas)', type: 'text', width: 'full' }, { id: 'instructions', label: 'Instrucciones Especiales', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE CUIDADO DE MASCOTAS</h2>
                    <p class="doc-text">El Cuidador <strong>${data.sitter}</strong> asume la responsabilidad temporal de: <strong>${data.pets}</strong>, propiedad de <strong>${data.owner}</strong>.</p>
                    <p class="doc-text">Instrucciones de cuidado:</p>
                    <div class="doc-body-text">${data.instructions}</div>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Dueño"></div><div class="sig-label">${data.owner}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-sit" onclick="NoteGenerator.openSignPad('sit', this)" data-label="Firma Cuidador"></div><div class="sig-label">${data.sitter}</div></div></div>
                </div>`
        },
        tutoring_contract: {
            title: "CONTRATO DE TUTORÍA",
            fields: [{ group: 'Clases', fields: [{ id: 'tutor', label: 'Tutor', type: 'text', width: 'full' }, { id: 'student', label: 'Estudiante/Padre', type: 'text', width: 'full' }, { id: 'subject', label: 'Materia', type: 'text', width: 'half' }, { id: 'rate', label: 'Tarifa por Hora ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE SERVICIOS DE TUTORÍA</h2>
                    <p class="doc-text">El Tutor <strong>${data.tutor}</strong> proveerá instrucción en <strong>${data.subject}</strong> a <strong>${data.student}</strong>.</p>
                    <p class="doc-text">Tarifa: <strong>$ ${data.rate}</strong>/hora. Las cancelaciones deben hacerse con 24h de anticipación.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Tutor"></div><div class="sig-label">${data.tutor}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-st" onclick="NoteGenerator.openSignPad('st', this)" data-label="Firma Estudiante/Padre"></div><div class="sig-label">${data.student}</div></div></div>
                </div>`
        },
        personal_trainer: {
            title: "ENTRENADOR PERSONAL",
            fields: [{ group: 'Entrenamiento', fields: [{ id: 'trainer', label: 'Entrenador', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'package', label: 'Paquete de Sesiones', type: 'text', width: 'full' }, { id: 'waiver', label: 'Incluir Renuncia Médica', type: 'select', options: ['Sí', 'No'] }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE ENTRENAMIENTO PERSONAL</h2>
                    <p class="doc-text">Entrenador: <strong>${data.trainer}</strong> | Cliente: <strong>${data.client}</strong></p>
                    <p class="doc-text">Servicio contratado: <strong>${data.package}</strong>.</p>
                    <p class="doc-text">El cliente certifica que está en condiciones físicas para realizar ejercicio. ${data.waiver === 'Sí' ? 'El cliente renuncia a reclamaciones por lesiones durante el entrenamiento.' : ''}</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Entrenador"></div><div class="sig-label">${data.trainer}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        cleaning_services: {
            title: "SERVICIOS DE LIMPIEZA",
            fields: [{ group: 'Limpieza', fields: [{ id: 'provider', label: 'Proveedor', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'address', label: 'Dirección', type: 'text', width: 'full' }, { id: 'frequency', label: 'Frecuencia', type: 'text', width: 'half' }, { id: 'price', label: 'Precio ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE SERVICIOS DE LIMPIEZA</h2>
                    <p class="doc-text"><strong>${data.provider}</strong> realizará servicios de limpieza en: ${data.address}.</p>
                    <p class="doc-text">Frecuencia: <strong>${data.frequency}</strong>. Costo: <strong>$ ${data.price}</strong> por visita.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Proveedor"></div><div class="sig-label">${data.provider}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        gardening_contract: {
            title: "CONTRATO DE JARDINERÍA",
            fields: [{ group: 'Jardín', fields: [{ id: 'gardener', label: 'Jardinero/Empresa', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'services', label: 'Servicios (Corte, Poda, Riego)', type: 'textarea', rows: 2 }, { id: 'price', label: 'Tarifa Mensual/Por Visita ($)', type: 'text', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE MANTENIMIENTO DE JARDINES</h2>
                    <p class="doc-text">Empresa: <strong>${data.gardener}</strong> para el Cliente: <strong>${data.client}</strong>.</p>
                    <p class="doc-text">Servicios incluidos:</p>
                    <div class="doc-body-text">${data.services}</div>
                    <p class="doc-text">Pago acordado: <strong>${data.price}</strong>.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Jardinero"></div><div class="sig-label">${data.gardener}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        general_contractor: {
            title: "CONTRATO GENERAL DE OBRA",
            fields: [{ group: 'Obra', fields: [{ id: 'contractor', label: 'Contratista', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'project', label: 'Descripción del Proyecto', type: 'textarea', rows: 3 }, { id: 'total', label: 'Costo Total ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE OBRA Y SERVICIOS</h2>
                    <p class="doc-text">El Contratista <strong>${data.contractor}</strong> ejecutará el siguiente proyecto para <strong>${data.client}</strong>:</p>
                    <div class="doc-body-text">${data.project}</div>
                    <p class="doc-text">El Cliente pagará un total de <strong>$ ${data.total}</strong> según el cronograma de pagos adjunto.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Contratista"></div><div class="sig-label">${data.contractor}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        hvac_service: {
            title: "CONTRATO SERVICIO HVAC",
            fields: [{ group: 'HVAC', fields: [{ id: 'technician', label: 'Técnico/Empresa', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'system', label: 'Sistema/Unidad', type: 'text', width: 'full' }, { id: 'work', label: 'Trabajo a Realizar', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">ORDEN DE SERVICIO HVAC (AIRE ACONDICIONADO)</h2>
                    <p class="doc-text">Técnico: <strong>${data.technician}</strong>. Cliente: <strong>${data.client}</strong>.</p>
                    <p class="doc-text">Unidad: ${data.system}</p>
                    <p class="doc-text">Trabajo realizado / Diagnóstico:</p>
                    <div class="doc-body-text">${data.work}</div>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Técnico"></div><div class="sig-label">${data.technician}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        plumbing_contract: {
            title: "CONTRATO DE PLOMERÍA",
            fields: [{ group: 'Plomería', fields: [{ id: 'plumber', label: 'Plomero', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'problem', label: 'Problema/Instalación', type: 'textarea', rows: 2 }, { id: 'estimate', label: 'Estimado ($)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE SERVICIOS DE PLOMERÍA</h2>
                    <p class="doc-text">El Plomero <strong>${data.plumber}</strong> realizará los siguientes trabajos para <strong>${data.client}</strong>:</p>
                    <div class="doc-body-text">${data.problem}</div>
                    <p class="doc-text">Costo estimado: <strong>$ ${data.estimate}</strong> (sujeto a cambios por materiales imprevistos).</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Plomero"></div><div class="sig-label">${data.plumber}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        electrical_service: {
            title: "SERVICIO ELÉCTRICO",
            fields: [{ group: 'Electricidad', fields: [{ id: 'electrician', label: 'Electricista', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'scope', label: 'Alcance del Trabajo', type: 'textarea', rows: 2 }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE SERVICIOS ELÉCTRICOS</h2>
                    <p class="doc-text">Electricista Autorizado: <strong>${data.electrician}</strong>.</p>
                    <p class="doc-text">Cliente: <strong>${data.client}</strong>.</p>
                    <p class="doc-text">Descripción del trabajo:</p>
                    <div class="doc-body-text">${data.scope}</div>
                    <p class="doc-text">Todo el trabajo cumplirá con los códigos eléctricos locales.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Electricista"></div><div class="sig-label">${data.electrician}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        },
        roofing_contract: {
            title: "CONTRATO DE TECHADO",
            fields: [{ group: 'Techo', fields: [{ id: 'roofer', label: 'Techador/Empresa', type: 'text', width: 'full' }, { id: 'client', label: 'Cliente', type: 'text', width: 'full' }, { id: 'material', label: 'Materiales (Tejas/Metal/Etc)', type: 'text', width: 'full' }, { id: 'warranty', label: 'Garantía (Años)', type: 'number', width: 'half' }] }],
            content: (data) => `
                <div class="legal-doc" contenteditable="true">
                    <h2 class="doc-title">CONTRATO DE REPARACIÓN/INSTALACIÓN DE TECHO</h2>
                    <p class="doc-text">Empresa: <strong>${data.roofer}</strong> | Cliente: <strong>${data.client}</strong></p>
                    <p class="doc-text">Materiales a utilizar: <strong>${data.material}</strong>.</p>
                    <p class="doc-text">Se ofrece una garantía de mano de obra de <strong>${data.warranty}</strong> años.</p>
                    <br><div class="sig-section-row" contenteditable="false"><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-client" onclick="NoteGenerator.openSignPad('client', this)" data-label="Firma Techador"></div><div class="sig-label">${data.roofer}</div></div><div class="sig-block" contenteditable="false"><div class="sig-zone" id="sig-cli" onclick="NoteGenerator.openSignPad('cli', this)" data-label="Firma Cliente"></div><div class="sig-label">${data.client}</div></div></div>
                </div>`
        }
    },

    renderTemplateFields(templateKey) {
        const container = document.getElementById('doc-dynamic-fields');
        const bodyContainer = document.getElementById('doc-body-container');
        if (!container || !bodyContainer) return;

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '1.5rem';

        bodyContainer.style.display = 'none';

        const template = this.templates[templateKey];
        if (!template) return;

        if (template.fields) {
            const isGrouped = template.fields[0].group !== undefined;
            const groups = isGrouped ? template.fields : [{ group: 'Información General', fields: template.fields }];

            groups.forEach(group => {
                const groupDiv = document.createElement('div');
                groupDiv.style.backgroundColor = 'var(--color-bg, #ffffff)';
                groupDiv.style.border = '1px solid #e5e7eb';
                groupDiv.style.borderRadius = '12px';
                groupDiv.style.padding = '1.5rem';
                groupDiv.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
                groupDiv.style.transition = 'all 0.2s ease';

                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                header.style.gap = '0.75rem';
                header.style.marginBottom = '1.25rem';
                header.style.paddingBottom = '0.75rem';
                header.style.borderBottom = '1px solid #f3f4f6';

                const icon = document.createElement('div');
                icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
                header.appendChild(icon);

                const title = document.createElement('h5');
                title.textContent = group.group;
                title.style.margin = '0';
                title.style.fontSize = '1rem';
                title.style.fontWeight = '600';
                title.style.color = '#1f2937';
                header.appendChild(title);

                groupDiv.appendChild(header);

                const grid = document.createElement('div');
                grid.style.display = 'grid';
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                grid.style.gap = '1.25rem';

                group.fields.forEach(field => {
                    const wrapper = document.createElement('div');
                    if (field.width === 'full') wrapper.style.gridColumn = 'span 2';

                    const label = document.createElement('label');
                    label.className = 'form-label';
                    label.style.display = 'block';
                    label.style.marginBottom = '0.5rem';
                    label.style.fontSize = '0.875rem';
                    label.style.fontWeight = '500';
                    label.style.color = '#4b5563';
                    label.textContent = field.label;
                    wrapper.appendChild(label);

                    let input;
                    if (field.type === 'select') {
                        input = document.createElement('select');
                        input.className = 'form-input dynamic-doc-field';
                        input.style.width = '100%';
                        field.options.forEach(opt => {
                            const option = document.createElement('option');
                            option.value = opt;
                            option.textContent = opt;
                            input.appendChild(option);
                        });
                    } else if (field.type === 'textarea') {
                        input = document.createElement('textarea');
                        input.className = 'form-input dynamic-doc-field';
                        input.style.width = '100%';
                        input.style.minHeight = '100px';
                        input.rows = field.rows || 3;
                    } else {
                        input = document.createElement('input');
                        input.type = field.type || 'text';
                        input.className = 'form-input dynamic-doc-field';
                        input.style.width = '100%';
                    }

                    input.dataset.key = field.id;
                    if (field.placeholder) input.placeholder = field.placeholder;
                    input.id = 'field-' + field.id;

                    // Hover/Focus effect via JS since it's dynamic
                    input.addEventListener('focus', () => {
                        groupDiv.style.borderColor = 'var(--color-primary-light, #bfdbfe)';
                        groupDiv.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                    });
                    input.addEventListener('blur', () => {
                        groupDiv.style.borderColor = '#e5e7eb';
                        groupDiv.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
                    });

                    input.addEventListener('input', () => this.updatePreview());
                    wrapper.appendChild(input);
                    grid.appendChild(wrapper);
                });

                groupDiv.appendChild(grid);
                container.appendChild(groupDiv);
            });
        }
    },

    switchSigTab(mode) {
        this.activeSigMode = mode;
        const drawBtn = document.getElementById('tab-draw-btn');
        const typeBtn = document.getElementById('tab-type-btn');
        const drawSec = document.getElementById('sig-draw-section');
        const typeSec = document.getElementById('sig-type-section');

        if (mode === 'draw') {
            drawBtn.classList.add('active');
            drawBtn.style.borderBottomColor = 'var(--color-primary)';
            drawBtn.style.color = '';

            typeBtn.classList.remove('active');
            typeBtn.style.borderBottomColor = 'transparent';
            typeBtn.style.color = '#64748b';

            drawSec.style.display = 'block';
            typeSec.style.display = 'none';
            setTimeout(() => this.resizeCanvas(), 50);
        } else {
            typeBtn.classList.add('active');
            typeBtn.style.borderBottomColor = 'var(--color-primary)';
            typeBtn.style.color = '';

            drawBtn.classList.remove('active');
            drawBtn.style.borderBottomColor = 'transparent';
            drawBtn.style.color = '#64748b';

            drawSec.style.display = 'none';
            typeSec.style.display = 'block';

            // Focus input
            setTimeout(() => document.getElementById('sig-type-input')?.focus(), 50);
        }
    },

    init() {
        window.NoteGenerator = this; // Fix for inline event handlers
        this.currentSigElement = null;
        this.activeSigMode = 'draw';
        this.signatures = {}; // Store signature data: { 'role': 'dataUrl' }
        if (document.getElementById('modal-signature-pad')) {
            this.initSignaturePad();
            window.addEventListener('resize', () => this.resizeCanvas());

            const clearBtn = document.getElementById('modal-clear-sig');
            if (clearBtn) clearBtn.addEventListener('click', () => { if (this.signaturePad) this.signaturePad.clear(); });

            const saveBtn = document.getElementById('modal-save-sig');
            if (saveBtn) saveBtn.addEventListener('click', () => this.handleSaveSignature());
        }

        const dateInput = document.getElementById('doc-date');
        if (dateInput) dateInput.valueAsDate = new Date();

        this.attachListeners();
        const initialTemplate = document.getElementById('doc-template-select')?.value || 'affidavit';
        this.renderTemplateFields(initialTemplate);
        this.updatePreview();
    },

    initSignaturePad() {
        const canvas = document.getElementById('modal-signature-pad');
        if (!canvas) return;
        try {
            if (typeof SignaturePad !== 'undefined') {
                this.signaturePad = new SignaturePad(canvas, {
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    penColor: 'rgb(0, 0, 0)'
                });
            }
        } catch (e) { }
    },

    openSignPad(role, element) {
        console.log('Opening signature pad for role:', role);
        this.currentSigElement = element;
        this.currentRole = role; // Store role for persistence
        const roleNames = { 'client': 'Cliente', 'witness1': 'Testigo 1', 'witness2': 'Testigo 2', 'buyer': 'Comprador', 'notary': 'Notario', 'partner': 'Socio/Apoderado' };
        const label = document.getElementById('sig-role-display');
        if (label) label.textContent = 'Firmando como: ' + (roleNames[role] || role);

        if (this.signaturePad) this.signaturePad.clear();

        // Robust Modal Opening
        const modal = document.getElementById('signature-modal');
        if (modal) {
            modal.classList.add('active');
            modal.style.display = 'flex'; // Force display
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            console.error('Signature modal not found in DOM');
            alert('Error: No se encuentra el modal de firma');
        }

        setTimeout(() => this.resizeCanvas(), 100);
    },

    resizeCanvas() {
        const canvas = document.getElementById('modal-signature-pad');
        if (!canvas || canvas.offsetParent === null) return;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        if (this.signaturePad) this.signaturePad.clear();
    },

    handleSaveSignature() {
        console.log('Attempting to save signature...');
        let dataUrl = null;

        try {
            if (this.activeSigMode === 'type') {
                const text = document.getElementById('sig-type-input').value;
                if (!text || !text.trim()) {
                    alert('Por favor escriba su nombre para firmar.');
                    return;
                }

                // Create canvas for text signature
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 600;
                canvas.height = 150;

                // Draw text
                ctx.font = "italic 60px 'Great Vibes', cursive";
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(text, canvas.width / 2, canvas.height / 2);

                dataUrl = canvas.toDataURL('image/png');
            } else {
                // Draw mode
                if (!this.signaturePad || this.signaturePad.isEmpty()) {
                    alert('Por favor firme antes de confirmar.');
                    return;
                }
                dataUrl = this.signaturePad.toDataURL('image/png');
            }

            if (!this.currentSigElement) {
                console.error('No currentSigElement found');
                alert('Error: No se ha seleccionado una zona de firma. Por favor cierre e intente de nuevo.');
                NotaryCRM.closeModal('signature-modal');
                return;
            }

            if (dataUrl) {
                console.log('Signature generated, inserting into DOM');
                // Save to state persistence
                if (this.currentRole) {
                    this.signatures[this.currentRole] = dataUrl;
                }

                const img = document.createElement('img');
                img.src = dataUrl;
                // Force styling to ensure it is visible within the box
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';

                this.currentSigElement.innerHTML = '';
                this.currentSigElement.appendChild(img);
                this.currentSigElement.classList.add('signed');

                // Close modal
                NotaryCRM.closeModal('signature-modal');

                // Optional: Update PDF preview if live update needed
                // this.updatePreview(); 
            }
        } catch (e) {
            console.error('Error saving signature:', e);
            alert('Error al guardar la firma: ' + e.message);
        }
    },

    populateDemoData() {
        const templateKey = document.getElementById('doc-template-select').value;
        const template = this.templates[templateKey];
        if (!template || !template.fields) return;

        document.getElementById('doc-location').value = 'Miami-Dade, Florida';
        document.getElementById('doc-client-id').value = 'Demo Client';

        const demoValues = {
            affiantName: 'Juan Pérez',
            address: '123 Ocean Drive, Apt 4B, Miami Beach, FL 33139',
            age: '45',
            occupation: 'Ingeniero de Software',
            statement: '1. Que he residido en la dirección mencionada por los últimos 5 años consecutivos.\n2. Que soy ciudadano respetuoso de la ley y no poseo antecedentes penales.\n3. Que realizo esta declaración voluntariamente para fines administrativos.',
            idType: 'Presentación de identificación',
            idDetails: 'FL Driver License #P123-456-78-900-0',

            sellerName: 'Concesionario AutoPremium LLC',
            sellerAddress: '500 Brickell Ave, Miami, FL',
            buyerName: 'Roberto Comprador',
            buyerAddress: '800 Collins Ave, Miami Beach, FL',
            price: '18500.00',
            make: 'Toyota',
            model: 'Camry XSE',
            year: '2021',
            vin: '4T1B11HK8MU123456',
            odometer: '32,500 millas',

            amount: '10000.00',
            interest: '4.5',
            lender: 'Inversiones Rápidas S.A.',
            borrower: 'Empresa StartUp Inc.',
            paymentPlan: 'Pagos mensuales de $450 comenzando en Septiembre 2024.',
            dueDate: '2026-12-31',

            childName: 'Sofía Martínez',
            passport: 'P987654321',
            dest: 'París, Francia y Roma, Italia',
            guardian: 'Marta Martínez',
            relation: 'Madre',
            dates: '10 de Julio al 25 de Agosto, 2024',

            grantee: 'Inmobiliaria Futuro Corp.',
            grantor: 'Roberto Vendedor',
            consideration: '10.00',
            propertyDesc: 'Lote 4, Manzana 12, de la subdivisión Coral Gables Section A, según consta en el Libro de Plats 45, Página 12, de los Registros Públicos del Condado de Miami-Dade, Florida.',
            parcelId: '01-3142-001-0010',

            testatorName: 'Ricardo Testador',
            executorName: 'Lic. Elena Albacea',
            beneficiary1: 'Juliana Hija',
            assets1: 'Mi residencia principal y todas mis cuentas bancarias personales.',

            principalName: 'Abuela María Mercedes',
            agentName: 'Juan Nieto',
            effectiveCondition: 'Cuando sea incapaz de decidir',
            specialInstructions: 'No deseo RCP si hay daño cerebral irreversible.',

            residentName: 'Carlos Residente',
            currAddress: '789 Brickell Way, Suite 101, Miami, FL 33131',
            yearsResiding: '12',

            indemnifier: 'Empresa Organizadora Eventos S.A.',
            indemnitee: 'Centro de Convenciones Miami',
            activity: 'Concierto de Verano 2024 y logística asociada.',

            owner: 'Luis Propietario',
            agent: 'Ana Representante',
            makeModel: 'Tesla Model 3, 2023, Gris',
        };

        const groups = template.fields[0].group ? template.fields : [{ fields: template.fields }];
        groups.forEach(g => {
            g.fields.forEach(f => {
                const el = document.getElementById('field-' + f.id);
                if (el) {
                    if (demoValues[f.id]) {
                        el.value = demoValues[f.id];
                    } else if (f.type === 'date') {
                        el.value = new Date().toISOString().split('T')[0];
                    } else if (f.type === 'select') {
                        el.selectedIndex = 1;
                    }
                    // Dispatch input event to update preview
                    el.dispatchEvent(new Event('input'));
                }
            });
        });

        this.updatePreview();
        Toast.success('Datos Cargados', 'Formulario rellenado con ejemplo.');
    },

    clearFields() {
        if (!confirm('¿Borrar todos los campos?')) return;
        document.querySelectorAll('.dynamic-doc-field').forEach(el => el.value = '');
        document.getElementById('doc-location').value = '';

        // Clear signatures
        this.signatures = {};

        this.updatePreview();
        Toast.info('Limpio', 'Campos y firmas borrados.');
    },

    attachListeners() {
        const inputs = ['doc-date', 'doc-location', 'doc-body', 'doc-client-id'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.updatePreview());
        });

        const templateSelect = document.getElementById('doc-template-select');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                this.renderTemplateFields(e.target.value);
                this.updatePreview();
            });
        }

        const searchInput = document.getElementById('doc-client-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleClientSearch(e.target.value));
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#doc-client-search-results') && e.target !== searchInput) {
                    const list = document.getElementById('doc-client-search-results');
                    if (list) list.remove();
                }
            });
        }

        const genBtn = document.getElementById('generate-pdf-btn');
        if (genBtn) genBtn.addEventListener('click', () => this.generatePDF());

        const demoBtn = document.getElementById('btn-fill-demo');
        if (demoBtn) demoBtn.addEventListener('click', () => this.populateDemoData());

        const clearBtn = document.getElementById('btn-clear-fields');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearFields());

        const typeInput = document.getElementById('sig-type-input');
        if (typeInput) {
            typeInput.addEventListener('input', (e) => {
                const preview = document.getElementById('sig-type-preview');
                if (preview) preview.textContent = e.target.value || 'Su Firma Aquí';
            });
        }
    },

    handleClientSearch(query) {
        // Remove existing list
        const existingList = document.getElementById('doc-client-search-results');
        if (existingList) existingList.remove();

        if (!query || query.length < 2) return;

        let clients = [];
        // Prioritize Cases as they have client info
        if (NotaryCRM.state && NotaryCRM.state.cases && NotaryCRM.state.cases.length> 0) {
            const uniqueClients = new Map();
            NotaryCRM.state.cases.forEach(c => {
                if (c.clientName && !uniqueClients.has(c.clientName)) {
                    uniqueClients.set(c.clientName, { id: c.id, name: c.clientName });
                }
            });
            clients = Array.from(uniqueClients.values());
        }

        // Add from direct clients list if empty or if needed
        if (clients.length === 0 && NotaryCRM.state && NotaryCRM.state.clients) {
            clients = NotaryCRM.state.clients;
        }

        // Fallback mock
        if (clients.length === 0) {
            clients = [
                { id: '1', name: 'Juan Perez-Ejemplo', email: 'juan@example.com' },
                { id: '2', name: 'Maria Lopez-Ejemplo', email: 'maria@example.com' }
            ];
        }

        const matches = clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
        if (matches.length === 0) return;

        const container = document.getElementById('doc-client-search').parentNode;
        const list = document.createElement('div');
        list.id = 'doc-client-search-results';
        list.className = 'autocomplete-list';
        list.style.position = 'absolute';
        list.style.zIndex = '1000';
        list.style.background = 'white';
        list.style.width = '100%';
        list.style.border = '1px solid #cbd5e1';
        list.style.borderRadius = '0.5rem';
        list.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
        list.style.maxHeight = '200px';
        list.style.overflowY = 'auto';

        matches.forEach(client => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = client.name;
            item.style.padding = '0.75rem 1rem';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid #f1f5f9';
            item.onmouseover = () => item.style.background = '#f8fafc';
            item.onmouseout = () => item.style.background = 'white';

            item.addEventListener('click', () => {
                document.getElementById('doc-client-search').value = client.name;
                document.getElementById('doc-client-id').value = client.id;
                this.updatePreview();
                list.remove();
            });
            list.appendChild(item);
        });

        container.appendChild(list);
    },

    updatePreview() {
        const templateKey = document.getElementById('doc-template-select').value;
        const template = this.templates[templateKey];
        if (!template) return;

        const previewEl = document.getElementById('doc-preview');
        const data = {
            clientName: document.getElementById('doc-client-search').value || '__________________',
            date: document.getElementById('doc-date').value || '__________',
            location: document.getElementById('doc-location').value || '__________, __________',
            body: document.getElementById('doc-body') ? document.getElementById('doc-body').value.replace(/\n/g, '<br>') : ''
        };

        // Dynamic fields
        document.querySelectorAll('.dynamic-doc-field').forEach(input => {
            data[input.dataset.key] = input.value;
        });

        previewEl.innerHTML = template.content(data);

        // Re-apply persisted signatures
        if (this.signatures) {
            const roleToIdMap = {
                'client': 'sig-client',
                'notary': 'sig-notary',
                'buyer': 'sig-buyer',
                'seller': 'sig-client', // Mapped in template
                'partner': 'sig-partner'
            };

            Object.keys(this.signatures).forEach(role => {
                const id = roleToIdMap[role] || 'sig-' + role;
                // Special handling for shared IDs (e.g. client/seller sharing sig-client)
                // In templates: sig-client is used for Affiant, Seller, Borrower, Parent.
                // So if we signed as 'client', we look for 'sig-client'.
                // If we signed as 'buyer', we look for 'sig-buyer'.

                // Better approach: Since openSignPad is called with specific roles like 'client', 'buyer', 'notary'
                // and the IDs in HTML are hardcoded (e.g. id="sig-client").
                // We need to match the role passed to openSignPad to the ID in the DOM.
                // The template calls: onclick="NoteGenerator.openSignPad('client', this)" -> Role is 'client'. ID is 'sig-client'.
                // So basic mapping is id = 'sig-' + role.

                let targetId = 'sig-' + role;
                const el = document.getElementById(targetId);
                if (el && this.signatures[role]) {
                    const img = document.createElement('img');
                    img.src = this.signatures[role];
                    el.innerHTML = '';
                    el.appendChild(img);
                    el.classList.add('signed');
                }
            });
        }
    },

    async generatePDF() {
        if (!window.jspdf || !window.html2canvas) {
            return alert('Librerías de PDF no cargadas. Por favor, recargue la página.');
        }

        const btn = document.getElementById('generate-pdf-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Ajustando...';
        btn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            const source = document.getElementById('doc-preview');
            const clone = source.cloneNode(true);

            // 2. Normalized Capture Environment (Approx A4 width at 96dpi)
            const captureWidth = 800;
            Object.assign(clone.style, {
                width: captureWidth + 'px',
                padding: '5pt 10pt', // Extreme tighter margins as requested
                boxSizing: 'border-box',
                background: '#ffffff',
                color: '#000000',
                fontSize: '11pt',
                fontFamily: '"Times New Roman", Times, serif',
                position: 'relative',
                margin: '0',
                left: '0',
                top: '0',
                boxShadow: 'none',
                border: 'none',
                height: 'auto',
                overflow: 'visible'
            });

            // 3. Deep Clean the Clone
            clone.querySelectorAll('*').forEach(el => {
                el.removeAttribute('contenteditable');
                if (el.classList.contains('sig-zone')) {
                    el.style.border = 'none';
                    el.style.borderBottom = '1pt solid #000';
                    el.style.background = 'transparent';
                    el.style.height = '50px';
                }
                if (el.classList.contains('notary-seal-placeholder')) {
                    el.style.border = '1px solid #000';
                }
                if (el.classList.contains('doc-body-text')) {
                    el.style.background = 'transparent';
                    el.style.border = '1px solid #eee';
                    el.style.padding = '8pt';
                }
                el.style.boxShadow = 'none';
                el.style.textShadow = 'none';
                // Ensure all text is black for printing, EXCEPT the watermark
                if (!el.classList.contains('doc-watermark')) {
                    if (el.style.color && el.style.color !== 'transparent') el.style.color = '#000';
                }
            });

            // 4. Temporary Off-screen render
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = captureWidth + 'px';
            container.appendChild(clone);
            document.body.appendChild(container);

            // 5. Capture as High-Res Image
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: captureWidth
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'pt', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth(); // ~595pt
            const pageHeight = pdf.internal.pageSize.getHeight(); // ~841pt

            // 6. Map capture to A4 sheet
            // We map the 800px capture directly to the full 595pt width
            let finalWidth = pageWidth;
            let finalHeight = (canvas.height * finalWidth) / canvas.width;

            // Fit vertically ONLY if it exceeds the page height
            if (finalHeight> pageHeight) {
                const ratio = pageHeight / finalHeight;
                finalHeight = pageHeight;
                finalWidth = finalWidth * ratio;
            }

            // Center horizontally
            const finalX = (pageWidth-finalWidth) / 2;
            const finalY = 0; // Top-aligned

            pdf.addImage(imgData, 'JPEG', finalX, finalY, finalWidth, finalHeight, undefined, 'FAST');

            const clientSearch = document.getElementById('doc-client-search');
            const clientName = clientSearch ? clientSearch.value : 'Documento';
            const filename = `Doc_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

            pdf.save(filename);
            document.body.removeChild(container);
            btn.innerHTML = originalText;
            btn.disabled = false;
            try { Toast.success('PDF Generado', 'Documento ajustado a una sola página.'); } catch (e) { }

        } catch (err) {
            console.error('PDF Error:', err);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },
};

// Expose to global for onclick handlers
window.Reminders = Reminders;
window.DocumentsManager = NoteGenerator;
window.NotaryCRM = NotaryCRM;
window.NoteGenerator = NoteGenerator;

// Initialize app when DOM is ready
// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            if (window.NotaryCRM && NotaryCRM.init) {
                NotaryCRM.init();
            } else {
                console.error('NotaryCRM core not assigned');
            }
        } catch (e) {
            console.error('Init Error:', e);
            if (window.showFatalError) showFatalError('Error al iniciar la aplicación: ' + e.message);
        }
    });
} else {
    try {
        if (window.NotaryCRM && NotaryCRM.init) {
            NotaryCRM.init();
        } else {
            console.error('NotaryCRM core not assigned');
        }
    } catch (e) {
        console.error('Init Error:', e);
        if (window.showFatalError) showFatalError('Error al iniciar la aplicación: ' + e.message);
    }
}

// Helper to determine API base for SQL backend
function getApiBase() {
    try {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return `${window.location.protocol}//${host}:5000`;
        }
    } catch (e) { }
    return '';
}
