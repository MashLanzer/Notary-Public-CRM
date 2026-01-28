// ============================================
// AUTO-SAVE DRAFTS MANAGER
// ============================================

const DraftManager = {
    STORAGE_KEY: 'notary_drafts',
    AUTO_SAVE_INTERVAL: 3000, // 3 seconds
    timers: {},

    init() {
        this.loadDrafts();
        this.attachListeners();
    },

    attachListeners() {
        // Auto-save for client form
        const clientForm = document.getElementById('client-form');
        if (clientForm) {
            this.enableAutoSave('client-form', clientForm);
        }

        // Auto-save for case form
        const caseForm = document.getElementById('case-form');
        if (caseForm) {
            this.enableAutoSave('case-form', caseForm);
        }
    },

    enableAutoSave(formId, form) {
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            // Skip hidden inputs and IDs
            if (input.type === 'hidden' || input.name === 'id') return;

            input.addEventListener('input', () => {
                this.scheduleSave(formId, form);
            });

            input.addEventListener('change', () => {
                this.scheduleSave(formId, form);
            });
        });

        // Load existing draft if available
        this.loadDraft(formId, form);
    },

    scheduleSave(formId, form) {
        // Clear existing timer
        if (this.timers[formId]) {
            clearTimeout(this.timers[formId]);
        }

        // Schedule new save
        this.timers[formId] = setTimeout(() => {
            this.saveDraft(formId, form);
        }, this.AUTO_SAVE_INTERVAL);
    },

    saveDraft(formId, form) {
        const formData = new FormData(form);
        const draft = {};
        let hasData = false;

        for (let [key, value] of formData.entries()) {
            if (key !== 'id' && value) {
                draft[key] = value;
                hasData = true;
            }
        }

        if (hasData) {
            const drafts = this.getDrafts();
            drafts[formId] = {
                data: draft,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));

            // Show subtle indicator
            this.showDraftIndicator(formId, 'saved');
        }
    },

    loadDraft(formId, form) {
        const drafts = this.getDrafts();
        const draft = drafts[formId];

        if (draft && draft.data) {
            // Ask user if they want to restore
            const timestamp = new Date(draft.timestamp);
            const timeAgo = this.getTimeAgo(timestamp);

            if (confirm(`Se encontró un borrador guardado hace ${timeAgo}. ¿Deseas restaurarlo?`)) {
                Object.keys(draft.data).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = draft.data[key];
                    }
                });

                Toast.info('Borrador Restaurado', 'Se ha cargado el borrador guardado.');
            }
        }
    },

    clearDraft(formId) {
        const drafts = this.getDrafts();
        delete drafts[formId];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
        this.showDraftIndicator(formId, 'cleared');
    },

    getDrafts() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    },

    loadDrafts() {
        // Called on init to clean old drafts (older than 7 days)
        const drafts = this.getDrafts();
        const now = new Date();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        Object.keys(drafts).forEach(key => {
            const draft = drafts[key];
            const draftDate = new Date(draft.timestamp);
            if (now - draftDate> SEVEN_DAYS) {
                delete drafts[key];
            }
        });

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    },

    showDraftIndicator(formId, status) {
        // Create or update indicator
        let indicator = document.getElementById(`draft-indicator-${formId}`);

        if (!indicator) {
            const form = document.getElementById(formId);
            if (!form) return;

            indicator = document.createElement('div');
            indicator.id = `draft-indicator-${formId}`;
            indicator.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 600;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                z-index: 10;
            `;
            form.style.position = 'relative';
            form.appendChild(indicator);
        }

        if (status === 'saved') {
            indicator.textContent = '✓ Borrador guardado';
            indicator.style.background = 'var(--color-success)';
            indicator.style.color = 'white';
        } else if (status === 'cleared') {
            indicator.textContent = 'Borrador eliminado';
            indicator.style.background = 'var(--color-gray-300)';
            indicator.style.color = 'var(--text-primary)';
        }

        // Show and hide
        indicator.style.opacity = '1';
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    },

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'menos de un minuto';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} horas`;
        return `${Math.floor(seconds / 86400)} días`;
    }
};

if (typeof window !== 'undefined') {
    window.DraftManager = DraftManager;
}
