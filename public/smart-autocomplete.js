// ============================================
// SMART AUTOCOMPLETE SYSTEM
// ============================================

const SmartAutocomplete = {
    instances: new Map(),

    init() {
        // Initialize autocomplete for common fields
        this.setupClientNameAutocomplete();
        this.setupAddressAutocomplete();
        this.setupEmailAutocomplete();
    },

    setupClientNameAutocomplete() {
        const nameInputs = document.querySelectorAll('input[name="name"]');
        nameInputs.forEach(input => {
            if (input.closest('#client-form')) {
                this.createAutocomplete(input, {
                    source: () => this.getClientNames(),
                    minChars: 2,
                    onSelect: (value, data) => {
                        if (data) {
                            this.fillClientForm(data);
                        }
                    }
                });
            }
        });
    },

    setupAddressAutocomplete() {
        const addressInputs = document.querySelectorAll('input[name="address"]');
        addressInputs.forEach(input => {
            this.createAutocomplete(input, {
                source: () => this.getRecentAddresses(),
                minChars: 3,
                placeholder: 'Direcciones recientes...'
            });
        });
    },

    setupEmailAutocomplete() {
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            this.createAutocomplete(input, {
                source: () => this.getRecentEmails(),
                minChars: 2,
                placeholder: 'Emails recientes...'
            });
        });
    },

    createAutocomplete(input, options) {
        if (input.dataset.autocompleteEnabled) return;

        const config = {
            minChars: options.minChars || 2,
            source: options.source || (() => []),
            onSelect: options.onSelect || ((value) => { input.value = value; }),
            placeholder: options.placeholder || 'Sugerencias...'
        };

        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-card);
            border: 1px solid var(--color-gray-200);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            margin-top: 4px;
        `;

        // Position input container
        const parent = input.parentElement;
        if (parent && getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        parent.appendChild(dropdown);

        // Store instance
        this.instances.set(input, { dropdown, config });

        // Event listeners
        input.addEventListener('input', (e) => this.handleInput(input, e));
        input.addEventListener('focus', (e) => this.handleInput(input, e));
        input.addEventListener('blur', () => {
            setTimeout(() => dropdown.style.display = 'none', 200);
        });

        input.dataset.autocompleteEnabled = 'true';
    },

    async handleInput(input, event) {
        const instance = this.instances.get(input);
        if (!instance) return;

        const { dropdown, config } = instance;
        const value = input.value.trim();

        if (value.length < config.minChars) {
            dropdown.style.display = 'none';
            return;
        }

        // Get suggestions
        const suggestions = await config.source(value);

        if (!suggestions || suggestions.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        // Render suggestions
        this.renderSuggestions(input, dropdown, suggestions, config);
    },

    renderSuggestions(input, dropdown, suggestions, config) {
        dropdown.innerHTML = '';

        suggestions.forEach((item, index) => {
            const option = document.createElement('div');
            option.className = 'autocomplete-option';
            option.style.cssText = `
                padding: 10px 12px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid var(--color-gray-100);
            `;

            if (typeof item === 'string') {
                option.textContent = item;
                option.dataset.value = item;
            } else {
                option.innerHTML = this.formatSuggestion(item);
                option.dataset.value = item.name || item.value;
                option.dataset.data = JSON.stringify(item);
            }

            // Hover effect
            option.addEventListener('mouseenter', () => {
                option.style.background = 'var(--color-gray-50)';
            });
            option.addEventListener('mouseleave', () => {
                option.style.background = 'transparent';
            });

            // Click handler
            option.addEventListener('click', () => {
                const data = option.dataset.data ? JSON.parse(option.dataset.data) : null;
                config.onSelect(option.dataset.value, data);
                dropdown.style.display = 'none';
            });

            dropdown.appendChild(option);
        });

        dropdown.style.display = 'block';
    },

    formatSuggestion(item) {
        if (item.name && item.email) {
            return `
                <div style="display: flex; flex-direction: column; gap: 2px;">
                    <strong style="font-size: 0.9rem;">${item.name}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-light);">${item.email}</span>
                </div>
            `;
        }
        return item.name || item.value || String(item);
    },

    getClientNames() {
        if (!window.NotaryCRM || !window.NotaryCRM.state) return [];

        const clients = window.NotaryCRM.state.clients || [];
        return clients.map(client => ({
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            id: client.id
        }));
    },

    getRecentAddresses() {
        if (!window.NotaryCRM || !window.NotaryCRM.state) return [];

        const clients = window.NotaryCRM.state.clients || [];
        const addresses = [...new Set(clients.map(c => c.address).filter(Boolean))];
        return addresses.slice(0, 10);
    },

    getRecentEmails() {
        if (!window.NotaryCRM || !window.NotaryCRM.state) return [];

        const clients = window.NotaryCRM.state.clients || [];
        const emails = [...new Set(clients.map(c => c.email).filter(Boolean))];
        return emails.slice(0, 10);
    },

    fillClientForm(clientData) {
        const form = document.getElementById('client-form');
        if (!form) return;

        // Fill form fields with client data
        const fields = ['email', 'phone', 'address'];
        fields.forEach(field => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input && clientData[field]) {
                input.value = clientData[field];

                // Trigger input event for validation
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        Toast.info('Auto-completado', 'Datos del cliente cargados automáticamente.');
    },

    destroy(input) {
        const instance = this.instances.get(input);
        if (instance && instance.dropdown) {
            instance.dropdown.remove();
        }
        this.instances.delete(input);
        delete input.dataset.autocompleteEnabled;
    }
};

if (typeof window !== 'undefined') {
    window.SmartAutocomplete = SmartAutocomplete;
}
