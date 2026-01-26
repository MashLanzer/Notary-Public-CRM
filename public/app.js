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
                const dots = value.split('.').length - 1;
                if (dots > 1) value = value.substring(0, value.lastIndexOf('.'));
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
        const sortedIds = Object.keys(this.config).sort((a, b) => this.config[a].order - this.config[b].order);

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
        const sortedIds = Object.keys(this.config).sort((a, b) => this.config[a].order - this.config[b].order);

        container.innerHTML = sortedIds.map((id, index) => {
            const widget = this.config[id];
            const isFirst = index === 0;
            const isLast = index === sortedIds.length - 1;

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
        const sortedIds = Object.keys(this.config).sort((a, b) => this.config[a].order - this.config[b].order);
        const currentIndex = sortedIds.indexOf(id);
        if (currentIndex === -1) return;

        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= sortedIds.length) return;

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
                subject: 'Confirmación de su servicio notarial - {case_number}',
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
                company_name: 'Notaría Publica - CRM'
            };
        } else if (this.currentTarget.type === 'case') {
            const caseObj = NotaryCRM.state.cases.find(c => c.id === this.currentTarget.id);
            data = {
                client_name: caseObj ? caseObj.clientName : 'Cliente',
                case_number: caseObj ? caseObj.caseNumber : 'N/A',
                service_type: caseObj ? caseObj.type : 'Servicio',
                due_date: caseObj ? NotaryCRM.formatDate(caseObj.dueDate) : 'N/A',
                amount: caseObj ? `$${caseObj.amount}` : '$0.00',
                company_name: 'Notaría Publica - CRM'
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
                        company_name: 'Notaría Publica - CRM'
                    };
                } else if (this.currentTarget.type === 'case') {
                    const caseObj = NotaryCRM.state.cases.find(c => c.id === this.currentTarget.id);
                    data = {
                        client_name: caseObj ? caseObj.clientName : 'Cliente',
                        case_number: caseObj ? caseObj.caseNumber : 'N/A',
                        service_type: caseObj ? caseObj.type : 'Servicio',
                        due_date: caseObj ? NotaryCRM.formatDate(caseObj.dueDate) : 'N/A',
                        amount: caseObj ? `$${caseObj.amount}` : '$0.00',
                        company_name: 'Notaría Publica - CRM'
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

    attachListeners() {
        const refreshBtn = document.getElementById('refresh-logs-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                Toast.info('Actualizando...', 'Recuperando los registros de auditoría.');
            });
        }
    }
};

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
        return events.sort((a, b) => new Date(b.date) - new Date(a.date));
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

        // ALWAYS USE LIGHT MODE - Force light theme
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
}

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
        currentClientStep: 1
    },
    currentUser: null,

    // Initialize application
    init() {
        this.useFirestore = !!window.firebaseDB && !!window.dbFuncs;

        // Initialize Theme Mode
        ThemeManager.init();

        // Initialize Language
        I18nManager.init();

        this.attachEventListeners();

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
        console.log(`%c Notary CRM v1.5 %c Loaded in ${performance.now().toFixed(0)}ms`,
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

        // Log performance metrics after initialization
        setTimeout(() => {
            if (window.PerformanceOptimizer) {
                PerformanceOptimizer.logPerformanceMetrics();
            }
        }, 2000);
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
            AuditManager.logAction('Cambio de Rol', `Usuario: ${uid}`, `Nuevo rol: ${role}`);
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
                if (pass.length > 6) strength += 25;
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
            if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
                const tabs = ['dashboard', 'clients', 'cases', 'reminders', 'calendar', 'reports'];
                if (tabs[e.key - 1]) { e.preventDefault(); this.switchTab(tabs[e.key - 1]); }
            }
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(m => this.closeModal(m.id));
            }
        });

        // Pagination controls
        const addL = (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn);
        addL('clients-prev', 'click', () => { if (this.state.clientsPage > 1) { this.state.clientsPage--; this.renderClients(); } });
        addL('clients-next', 'click', () => { this.state.clientsPage++; this.renderClients(); });
        addL('clients-page-size', 'change', (e) => { this.state.clientsPageSize = parseInt(e.target.value, 10); this.state.clientsPage = 1; this.renderClients(); });
        addL('cases-prev', 'click', () => { if (this.state.casesPage > 1) { this.state.casesPage--; this.renderCases(); } });
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

        // Modals & Forms
        addL('calendar-form', 'submit', (e) => { e.preventDefault(); this.addAppointment(e.target); });
        addL('client-form', 'submit', (e) => { e.preventDefault(); this.addClient(e.target); });
        addL('case-form', 'submit', (e) => { e.preventDefault(); this.addCase(e.target); });
        addL('add-client-btn', 'click', () => this.openModal('client-modal'));
        addL('add-case-btn', 'click', () => this.openModal('case-modal'));
        addL('open-reminders-panel', 'click', () => this.switchTab('reminders'));

        // Client Multi-step Navigation
        addL('next-client-step', 'click', () => {
            if (this.state.currentClientStep < 3) this.setClientStep(this.state.currentClientStep + 1);
        });
        addL('prev-client-step', 'click', () => {
            if (this.state.currentClientStep > 1) this.setClientStep(this.state.currentClientStep - 1);
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

        // Auth
        addL('sign-in-btn', 'click', () => this.openModal('auth-modal'));
        addL('email-login-btn', 'click', () => this.openModal('auth-modal')); // Nuevo botón en landing
        addL('google-login-btn', 'click', () => this.googleLogin());
        addL('register-btn', 'click', () => this.registerFromForm());
        addL('auth-form', 'submit', (e) => { e.preventDefault(); this.signIn(e.target); });

        // Calendar View
        document.querySelectorAll('.cal-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.getAttribute('data-view');
                if (this.calendar) this.calendar.changeView(view);
            });
        });
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
                    // Force admin false for UI purposes unless explicitly super admin (which is disabled)
                    this.isAdmin = false;

                    // Update role display
                    const roleDisplay = document.getElementById('current-user-role-display');
                    if (roleDisplay) {
                        const roleNames = { 'admin': 'Propietario', 'editor': 'Editor', 'viewer': 'Lector' };
                        roleDisplay.textContent = roleNames[this.currentUserRole] || this.currentUserRole;
                        roleDisplay.className = `user-role-tag role-${this.currentUserRole}`;
                    }

                    // Strict Isolation: Always hide sensitive sidebar items for standard users
                    const usersBtn = document.getElementById('users-tab-btn');
                    const auditBtn = document.getElementById('audit-tab-btn'); // Assuming ID, check HTML if needed
                    if (usersBtn) usersBtn.style.display = 'none';
                    // if (auditBtn) auditBtn.style.display = 'none'; // Audit might be useful for personal actions? Keep it if relevant. 
                    // Actually, AuditManager logs "System" events. If it logs their own events, fine. 
                    // But usually "Audit" implies seeing what OTHERS did. 
                    // Let's hide it to be safe as requested "oculta la seccion usuarios y auditoria".
                    const auditLink = document.querySelector('button[onclick*="audit"]'); // finding by handler or ID
                    // The sidebar buttons usually have IDs like 'dashboard-tab-btn'.
                    // I will search for them in next step if I can't find ID.

                    // Apply permissions to UI immediately
                    this.applyUIPermissions();

                    if (this.isAdmin) {
                        // this.startUsersListener(); // Disabled for independent accounts
                        AuditManager.startListener();
                    }

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
            if (authArea) authArea.innerHTML = `<button class="btn" id="sign-in-btn">Iniciar sesión</button>`;
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
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) targetTab.classList.add('active');

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
        if (tabName === 'reports') this.renderReports();
        if (tabName === 'calendar') this.renderCalendar();
        if (tabName === 'emails') EmailManager.renderTemplates();
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
                select.innerHTML = `<option value="">${isEs ? 'Selecciona un cliente' : 'Select a client'}</option>` +
                    this.state.clients.map(c => `<option value="${c.id}" ${c.id === currentVal ? 'selected' : ''}>${c.name}</option>`).join('');
            }
        });

        // Init FAQs if opening help center
        if (modalId === 'help-center-modal') {
            this.filterFAQs('all');
        }
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

        const activeContent = document.getElementById(`help-tab-${tabName}`);
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
            el.classList.toggle('completed', s < step);
        });

        // Update Buttons
        const prevBtn = document.getElementById('prev-client-step');
        const nextBtn = document.getElementById('next-client-step');
        const submitBtn = document.getElementById('submit-client-form');

        if (prevBtn) prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';

        if (step === 3) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'block';
        } else {
            if (nextBtn) nextBtn.style.display = 'block';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    },

    // Add client
    addClient(form) {
        const formData = new FormData(form);
        const id = formData.get('id');
        const tags = formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim().toLowerCase()).filter(t => t) : [];

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
            relatedId: formData.get('relatedId') || null,
            tags: tags,
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
                    AuditManager.logAction('Creación de Cliente', client.name, `ID: ${docRef.id}`);
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
                            AuditManager.logAction('Eliminación de Cliente', client ? client.name : 'Unknown', `ID: ${id}`);
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
                    AuditManager.logAction('Creación de Caso', caseItem.caseNumber, `DocID: ${docRef.id}`);
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
                            AuditManager.logAction('Eliminación de Caso', caseItem ? caseItem.caseNumber : 'Unknown', `ID: ${id}`);
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
        if (form.querySelector('select[name="relatedId"]')) form.querySelector('select[name="relatedId"]').value = client.relatedId || '';
        if (form.querySelector('input[name="tags"]')) form.querySelector('input[name="tags"]').value = (client.tags || []).join(', ');

        this.openModal('client-modal');
    },

    async updateClient(id, updates) {
        if (this.useFirestore) {
            if (!this.currentUser) return alert('Debes iniciar sesión para editar clientes.');
            const { doc, updateDoc } = window.dbFuncs;
            const ref = doc(window.firebaseDB, 'clients', id);
            try {
                await updateDoc(ref, updates);
                AuditManager.logAction('Actualización de Cliente', updates.name || id, `ID: ${id}`);
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
                AuditManager.logAction('Actualización de Caso', updates.caseNumber || id, `ID: ${id}`);
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
        if (window.lucide) window.lucide.createIcons();
    },

    // Render entire UI
    render() {
        this.applyUIPermissions();
        this.renderDashboard();
        this.renderClients();
        this.renderCases();
        this.renderReports();
        if (window.lucide) window.lucide.createIcons();
    },

    // Render dashboard
    renderDashboard() {
        // Update statistics
        const clientsList = this.state.clients || [];
        const totalClientsEl = document.getElementById('total-clients');
        if (totalClientsEl) {
            totalClientsEl.textContent = clientsList.length;
        }

        const totalCases = this.state.cases.length;
        document.getElementById('total-cases').textContent = totalCases;

        const completedCases = this.state.cases.filter(c => c.status === 'completed').length;
        document.getElementById('completed-cases').textContent = completedCases;

        const totalRevenue = this.state.cases.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        document.getElementById('total-revenue').textContent = this.formatCurrency(totalRevenue);

        // Advanced KPIs
        const avgTicket = totalCases > 0 ? (totalRevenue / totalCases) : 0;
        const successRate = totalCases > 0 ? (completedCases / totalCases) * 100 : 0;

        const avgEl = document.getElementById('avg-ticket');
        if (avgEl) avgEl.textContent = this.formatCurrency(avgTicket);

        const rateEl = document.getElementById('success-rate');
        if (rateEl) rateEl.textContent = Math.round(successRate);

        // Vital Stats: Today's Appointments
        const todayStr = new Date().toISOString().split('T')[0];
        const todayApps = this.state.appointments.filter(a => a.date === todayStr).length;
        const todayAppsEl = document.getElementById('today-appointments-count');
        if (todayAppsEl) todayAppsEl.textContent = todayApps;

        // Vital Stats: Pending Payments
        // Pending payments for all active or completed cases
        const pendingValue = this.state.cases
            .filter(c => (c.paymentStatus || '').toLowerCase() !== 'paid')
            .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

        const pendingEl = document.getElementById('pending-payments-amount');
        if (pendingEl) pendingEl.textContent = this.formatCurrency(pendingValue);

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
                <td>${this.renderStatusBadge(c.status, c.dueDate)}</td>
                <td style="font-weight: 600; color: var(--color-gray-900);">${this.formatCurrency(c.amount)}</td>
            </tr>
        `).join('');
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
                this.state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
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
        if (this.state.clientsPage > totalPages) this.state.clientsPage = totalPages;
        if (this.state.clientsPage < 1) this.state.clientsPage = 1;
        const start = (this.state.clientsPage - 1) * pageSize;
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
        if (nextBtn) nextBtn.disabled = this.state.clientsPage >= totalPages;
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
                                ${this.renderStatusBadge(caseItem.status, caseItem.dueDate)}
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
                        <p class="case-detail-value amount">${this.formatCurrency(caseItem.amount)}</p>
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
    renderStatusBadge(status, dueDate = null) {
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
            const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= 3) {
                const color = diffDays < 0 ? '#b91c1c' : '#d97706';
                slaWarning = `<svg class="icon" style="color:${color}; margin-left: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
            }
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

    // Format date (handles ISO strings and Firestore Timestamps)
    formatDate(value, showTime = false) {
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
        return `${symbol}${(parseFloat(amount) || 0).toFixed(2)}`;
    },

    setCurrency(cur) {
        this.state.currency = cur;
        this.saveData();
        this.render();
        Toast.success('Moneda Cambiada', `Ahora usando ${cur}`);
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
        for (let i = 0; i < count; i++) {
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

        // Update Total Revenue Stat - ONLY PAID CASES
        const totalFilteredRevenue = filteredCases.reduce((sum, c) => {
            if (c.paymentStatus !== 'paid') return sum;
            return sum + (parseFloat(c.amount) || 0);
        }, 0);
        const revenueEl = document.getElementById('report-total-revenue');
        if (revenueEl) revenueEl.textContent = this.formatCurrency(totalFilteredRevenue);

        // Revenue Projection (Based on PAID history)
        const months = {};
        this.state.cases.forEach(c => {
            if (c.paymentStatus !== 'paid') return; // Skip unpaid for projection
            const d = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt || Date.now());
            const m = d.getMonth() + '-' + d.getFullYear();
            months[m] = (months[m] || 0) + (parseFloat(c.amount) || 0);
        });
        const avgMonthly = Object.values(months).length > 0 ? (Object.values(months).reduce((a, b) => a + b, 0) / Object.values(months).length) : 0;
        const projectedEl = document.getElementById('report-projected-revenue');
        if (projectedEl) projectedEl.textContent = this.formatCurrency(avgMonthly);

        // Cleanup existing charts if any
        if (this.revenueChart) this.revenueChart.destroy();
        if (this.servicesChart) this.servicesChart.destroy();
        if (this.statusChart) this.statusChart.destroy();
        if (this.locationChart) this.locationChart.destroy();

        // 1. Revenue by Month - ONLY PAID
        const monthlyRevenue = {};
        filteredCases.forEach(c => {
            if (c.paymentStatus !== 'paid') return; // Skip unpaid
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
                    label: 'Ingresos Efectivos ($)',
                    data: Object.values(monthlyRevenue),
                    borderColor: '#10b981', // Green for real money
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });

        // 2. Most Requested Services (All cases counts)
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

        // 3. Case Status Distribution (All cases counts)
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

        // 4. Revenue by Location - ONLY PAID
        const locationRevenue = { 'Oficina': 0, 'Casa': 0, 'Online': 0 };
        filteredCases.forEach(c => {
            if (c.paymentStatus !== 'paid') return; // Skip unpaid
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
                    backgroundColor: ['#10b981', '#34d399', '#6ee7b7'] // Green theme
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });

        // 5. Render Transaction History Table
        const paymentsTable = document.getElementById('payments-history-table');
        if (paymentsTable) {
            const allPayments = [];

            this.state.cases.forEach(c => {
                if (c.paymentData) {
                    // Modern format
                    allPayments.push({
                        date: c.paymentData.timestamp || c.lastUpdated || new Date().toISOString(),
                        txId: c.paymentData.transactionId || c.paymentData.id || 'N/A',
                        caseNum: c.caseNumber,
                        payer: c.paymentData.payerName || c.clientName || 'Desconocido',
                        method: c.paymentData.method || 'PayPal',
                        status: 'Completado', // If paymentData exists, it is likely paid
                        amount: parseFloat(c.paymentData.amount || c.amount || 0)
                    });
                } else if (c.paymentStatus && (c.paymentStatus.toLowerCase() === 'paid')) {
                    // Legacy/Manual format
                    allPayments.push({
                        date: c.lastUpdated || c.createdAt || new Date().toISOString(),
                        txId: 'MANUAL-' + c.id.substring(0, 6),
                        caseNum: c.caseNumber,
                        payer: c.clientName,
                        method: 'Manual',
                        status: 'Completado',
                        amount: parseFloat(c.amount || 0)
                    });
                }
            });

            // Sort by date desc
            allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (allPayments.length === 0) {
                paymentsTable.innerHTML = '<tr><td colspan="7" class="empty-state">No hay pagos registrados aún</td></tr>';
            } else {
                paymentsTable.innerHTML = allPayments.map(p => {
                    let dateStr;
                    try { dateStr = new Date(p.date).toLocaleDateString() + ' ' + new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
                    catch (e) { dateStr = 'Fecha inválida'; }

                    return `
                    <tr>
                        <td>${dateStr}</td>
                        <td style="font-family:monospace; font-size:0.9em;">${p.txId}</td>
                        <td style="font-weight:500;">${p.caseNum}</td>
                        <td>${p.payer}</td>
                        <td><span class="tag tag-blue">${p.method}</span></td>
                        <td><span class="tag tag-green">${p.status}</span></td>
                        <td style="text-align:right; font-weight:bold;">${this.formatCurrency(p.amount)}</td>
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
            title: `${app.clientName} - ${app.type}`,
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

                Toast.success('Agenda Actualizada', `Cita reprogramada al ${dateStr} - ${timeStr}`);
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
        titleEl.textContent = `Agenda: ${formattedDate}`;

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
                <div class="timeline-item" style="padding-left: 0; margin-bottom: 1rem;">
                    <div class="timeline-card" style="margin-left: 0; border-left: 4px solid var(--color-primary); padding: 1rem;">
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

    async blockDay(dateStr) {
        if (!this.currentUser) return alert('Debes iniciar sesión.');

        const dateObj = new Date(dateStr + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

        const existingBlock = this.state.blockedDates?.find(b => b.date === dateStr);

        if (existingBlock) {
            this.confirmAction(
                'Reactivar Agenda',
                `¿Deseas volver a habilitar el día ${formattedDate} para que los clientes puedan agendar citas?`,
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
        const relatedClient = client.relatedId ? this.state.clients.find(c => c.id === client.relatedId) : null;

        const content = document.getElementById('client-details-content');
        content.innerHTML = `
            <div class="case-details-grid" style="margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
                <div class="case-detail-item"><p class="case-detail-label">Nombre</p><p class="case-detail-value">${client.name}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">DNI/ID</p><p class="case-detail-value">${client.idType}: ${client.idNumber}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Email</p><p class="case-detail-value">${client.email}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Teléfono</p><p class="case-detail-value">${client.phone}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Ocupación</p><p class="case-detail-value">${client.occupation || 'N/A'}</p></div>
                <div class="case-detail-item"><p class="case-detail-label">Vínculo Familiar</p><p class="case-detail-value">${relatedClient ? `<a href="#" onclick="NotaryCRM.showClientDetails('${relatedClient.id}')" style="color: var(--color-primary); font-weight: 600;">${relatedClient.name}</a>` : 'N/A'}</p></div>
            </div>
            
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
                                <td>${this.renderStatusBadge(c.status, c.dueDate)}</td>
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
                                    <strong>${a.date} a las ${a.time}</strong> - ${a.type}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
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
                            <span class="info-value amount">${this.formatCurrency(caseItem.amount)}</span>
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

                    ${TaskManager.renderTaskList(caseItem.id, caseItem.tasks)}
                    ${NoteManager.renderNotes(caseItem.id, caseItem.internalNotes)}
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
                        <button class="btn btn-block" style="background: #25d366; color: white;" onclick="NotaryCRM.sendReminder('${caseItem.id}', 'whatsapp')">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            Enviar Recordatorio (WA)
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.openModal('case-details-modal');
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
        for (let i = 0; i < count; i++) {
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
            for (let i = 1; i < lines.length; i++) {
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
        doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.text('NOTARY CRM - ANALYTICS', 20, 25);
        doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.text(`Generado: ${new Date().toLocaleString()}`, 20, 50);
        doc.setFontSize(16); doc.text('Executive Summary', 20, 65);
        doc.setFontSize(12);
        doc.text(`Total Clients: ${this.state.clients.length}`, 30, 75);
        doc.text(`Total Cases: ${this.state.cases.length}`, 30, 82);
        const totalRev = this.state.cases.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        doc.text(`Total Revenue: $${totalRev.toFixed(2)}`, 30, 89);
        const revenueCanvas = document.getElementById('revenueChart');
        if (revenueCanvas) {
            try { doc.addImage(revenueCanvas.toDataURL('image/png'), 'PNG', 20, 110, 170, 70); } catch (e) { }
        }
        doc.save(`Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        Toast.success('PDF Guardado', 'El reporte se ha descargado.');
    },

    // --- Automations ---
    checkAutomations() {
        const now = new Date();
        const overdue = this.state.cases.filter(c => (c.status === 'pending' || c.status === 'in-progress') && new Date(c.dueDate) < now);
        if (overdue.length > 0) console.log(`[Automation] ${overdue.length} overdue cases found.`);
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
            if (list.length > 1) {
                duplicates.push({ key, clients: list });
            }
        });

        if (duplicates.length === 0) {
            Toast.success('Limpieza Completa', 'No se encontraron clientes duplicados.');
            return;
        }

        this.renderDuplicates(duplicates);
        this.openModal('duplicates-modal');
    },

    renderDuplicates(duplicates) {
        const listEl = document.getElementById('duplicates-list');
        listEl.innerHTML = duplicates.map(dup => `
            <div class="duplicate-group" style="background: var(--color-gray-50); border: 1px solid var(--color-gray-200); border-radius: 12px; padding: 1rem;">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; margin-bottom: 0.75rem;">
                    Grupo de Coincidencia: ${dup.key}
                </div>
                <div style="display: grid; gap: 0.5rem;">
                    ${dup.clients.map(c => `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 0.75rem; border-radius: 8px; border: 1px solid var(--color-gray-100);">
                            <div>
                                <div style="font-weight: 600;">${c.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-light);">${c.email} | ${c.idNumber}</div>
                            </div>
                            <div style="font-size: 0.7rem; color: var(--color-success); font-weight: 600;">VERIFICADO</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm btn-block" style="margin-top: 1rem; background: var(--color-primary-light); color: var(--color-primary);" onclick="Toast.info('Fusión en Desarrollo', 'La fusión masiva estará disponible en la próxima actualización.')">
                    Fusionar Registros
                </button>
            </div>
        `).join('');
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
        console.info('Reminders initialized');
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
            ownerId: NotaryCRM.currentUser.uid,
            createdAt: new Date().toISOString()
        };

        // Guardar en Firestore si está disponible
        if (NotaryCRM.useFirestore) {
            try {
                const { collection, addDoc } = window.dbFuncs;
                const db = window.firebaseDB;
                const docRef = await addDoc(collection(db, 'reminders'), item);
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
    async delete(id) {
        if (!confirm('¿Estás seguro de eliminar este recordatorio?')) return;

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

// Ensure escapeHtml exists (safety patch)
if (window.NotaryCRM && !window.NotaryCRM.escapeHtml) {
    window.NotaryCRM.escapeHtml = function (text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
}

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
