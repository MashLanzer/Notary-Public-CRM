// ============================================
// SCREEN READER SUPPORT MANAGER
// ============================================

const ScreenReaderManager = {
    announcer: null,

    init() {
        this.createAnnouncer();
        this.enhanceButtons();
        this.enhanceModals();
        this.enhanceForms();
        this.enhanceTables();
        this.monitorDynamicContent();
    },

    createAnnouncer() {
        // Create live region for announcements
        if (!document.getElementById('sr-announcements')) {
            this.announcer = document.createElement('div');
            this.announcer.id = 'sr-announcements';
            this.announcer.className = 'live-region';
            this.announcer.setAttribute('role', 'status');
            this.announcer.setAttribute('aria-live', 'polite');
            this.announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.announcer);
        } else {
            this.announcer = document.getElementById('sr-announcements');
        }
    },

    announce(message, priority = 'polite') {
        if (!this.announcer) return;

        // Clear previous announcement
        this.announcer.textContent = '';

        // Set priority
        this.announcer.setAttribute('aria-live', priority);

        // Announce after a brief delay to ensure screen reader picks it up
        setTimeout(() => {
            this.announcer.textContent = message;
        }, 100);

        // Clear after announcement
        setTimeout(() => {
            this.announcer.textContent = '';
        }, 3000);
    },

    enhanceButtons() {
        // Add descriptive labels to icon-only buttons
        document.querySelectorAll('button').forEach(button => {
            if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
                const icon = button.querySelector('svg, .icon');
                if (icon) {
                    // Try to infer label from context
                    const label = this.inferButtonLabel(button);
                    if (label) {
                        button.setAttribute('aria-label', label);
                    }
                }
            }

            // Add pressed state for toggle buttons
            if (button.classList.contains('btn-icon') || button.id.includes('toggle')) {
                if (!button.hasAttribute('aria-pressed')) {
                    button.setAttribute('aria-pressed', 'false');
                }
            }
        });
    },

    inferButtonLabel(button) {
        const id = button.id;
        const classes = button.className;

        // Common patterns
        if (id.includes('theme')) return 'Toggle dark mode';
        if (id.includes('lang')) return 'Change language';
        if (id.includes('add')) return 'Add new item';
        if (id.includes('edit')) return 'Edit item';
        if (id.includes('delete')) return 'Delete item';
        if (id.includes('close')) return 'Close';
        if (id.includes('save')) return 'Save';
        if (id.includes('cancel')) return 'Cancel';
        if (classes.includes('modal-close')) return 'Close dialog';

        return null;
    },

    enhanceModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            // Add dialog role
            if (!modal.getAttribute('role')) {
                modal.setAttribute('role', 'dialog');
            }

            // Add aria-modal
            if (!modal.hasAttribute('aria-modal')) {
                modal.setAttribute('aria-modal', 'true');
            }

            // Add aria-labelledby from modal title
            const title = modal.querySelector('.modal-title');
            if (title && !modal.hasAttribute('aria-labelledby')) {
                if (!title.id) {
                    title.id = `modal-title-${Date.now()}`;
                }
                modal.setAttribute('aria-labelledby', title.id);
            }

            // Add aria-describedby if there's a description
            const description = modal.querySelector('.modal-description');
            if (description && !modal.hasAttribute('aria-describedby')) {
                if (!description.id) {
                    description.id = `modal-desc-${Date.now()}`;
                }
                modal.setAttribute('aria-describedby', description.id);
            }
        });
    },

    enhanceForms() {
        document.querySelectorAll('form').forEach(form => {
            // Add aria-label if not present
            if (!form.getAttribute('aria-label') && !form.getAttribute('aria-labelledby')) {
                const formId = String(form.id);
                if (formId) {
                    if (formId.includes('client')) {
                        form.setAttribute('aria-label', 'Client information form');
                    } else if (formId.includes('case')) {
                        form.setAttribute('aria-label', 'Case information form');
                    } else if (formId.includes('calendar')) {
                        form.setAttribute('aria-label', 'Appointment form');
                    }
                }
            }

            // Enhance form fields
            form.querySelectorAll('input, select, textarea').forEach(field => {
                const label = form.querySelector(`label[for="${field.id}"]`) ||
                    field.closest('.form-group')?.querySelector('label');

                if (label && !field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby')) {
                    if (!label.id) {
                        label.id = `label-${field.name || Date.now()}`;
                    }
                    field.setAttribute('aria-labelledby', label.id);
                }

                // Add required indicator
                if (field.hasAttribute('required') && !field.getAttribute('aria-required')) {
                    field.setAttribute('aria-required', 'true');
                }

                // Add invalid state
                if (field.classList.contains('invalid') && !field.getAttribute('aria-invalid')) {
                    field.setAttribute('aria-invalid', 'true');
                }
            });
        });
    },

    enhanceTables() {
        document.querySelectorAll('table').forEach(table => {
            // Add caption if missing
            if (!table.querySelector('caption') && !table.getAttribute('aria-label')) {
                const heading = table.closest('.card')?.querySelector('.card-title');
                if (heading) {
                    table.setAttribute('aria-label', heading.textContent);
                }
            }

            // Ensure headers have scope
            table.querySelectorAll('th').forEach(th => {
                if (!th.hasAttribute('scope')) {
                    th.setAttribute('scope', 'col');
                }
            });
        });
    },

    monitorDynamicContent() {
        // Announce when new content is loaded
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check for new cards or list items
                            if (node.classList?.contains('card') ||
                                node.classList?.contains('client-card') ||
                                node.classList?.contains('case-card')) {
                                const title = node.querySelector('h3, h4, .card-title');
                                if (title) {
                                    this.announce(`New item added: ${title.textContent}`);
                                }
                            }
                        }
                    });
                }
            });
        });

        // Observe main content area
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            observer.observe(mainContent, {
                childList: true,
                subtree: true
            });
        }
    },

    announcePageChange(pageName) {
        this.announce(`Navigated to ${pageName} page`);
    },

    announceFormError(fieldName, error) {
        this.announce(`Error in ${fieldName}: ${error}`, 'assertive');
    },

    announceSuccess(message) {
        this.announce(`Success: ${message}`);
    },

    announceLoading(isLoading) {
        if (isLoading) {
            this.announce('Loading content, please wait');
        } else {
            this.announce('Content loaded');
        }
    }
};

// Integrate with existing Toast system
if (typeof window !== 'undefined') {
    window.ScreenReaderManager = ScreenReaderManager;

    // Enhance Toast notifications for screen readers
    const originalToast = window.Toast;
    if (originalToast) {
        ['success', 'error', 'warning', 'info'].forEach(type => {
            const original = originalToast[type];
            if (original) {
                originalToast[type] = function (title, message) {
                    original.call(this, title, message);
                    if (window.ScreenReaderManager) {
                        const priority = type === 'error' ? 'assertive' : 'polite';
                        ScreenReaderManager.announce(`${title}: ${message}`, priority);
                    }
                };
            }
        });
    }
}
