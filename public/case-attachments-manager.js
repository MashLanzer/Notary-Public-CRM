// ============================================
// CASE ATTACHMENTS MANAGER
// ============================================

const CaseAttachmentsManager = {
    attachments: new Map(), // caseId -> [files]

    init() {
        this.loadAttachments();
        this.setupUI();
    },

    loadAttachments() {
        const stored = localStorage.getItem('case_attachments');
        if (stored) {
            const data = JSON.parse(stored);
            this.attachments = new Map(Object.entries(data));
        }
    },

    save() {
        const data = Object.fromEntries(this.attachments);
        localStorage.setItem('case_attachments', JSON.stringify(data));
    },

    setupUI() {
        // Add attachments section to case details
        this.enhanceCaseCards();
    },

    enhanceCaseCards() {
        // Wait for cases to be rendered
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.case-card').forEach(card => {
                if (!card.querySelector('.attachments-section')) {
                    this.addAttachmentsSection(card);
                }
            });
        });

        const casesContainer = document.getElementById('cases-list');
        if (casesContainer) {
            observer.observe(casesContainer, { childList: true, subtree: true });
        }
    },

    addAttachmentsSection(caseCard) {
        const caseId = caseCard.dataset.caseId;
        if (!caseId) return;

        const attachmentsSection = document.createElement('div');
        attachmentsSection.className = 'attachments-section';
        attachmentsSection.style.cssText = `
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--color-gray-100);
        `;

        const attachments = this.getAttachments(caseId);
        const count = attachments.length;

        attachmentsSection.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h5 style="font-size: 0.85rem; font-weight: 600; margin: 0;">
                    📎 Adjuntos (${count})
                </h5>
                <button 
                    class="btn btn-sm btn-secondary" 
                    onclick="CaseAttachmentsManager.openAttachmentModal('${caseId}')"
                    aria-label="Manage attachments">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Gestionar
                </button>
            </div>
            <div id="attachments-list-${caseId}" class="attachments-list">
                ${this.renderAttachmentsList(attachments, caseId)}
            </div>
        `;

        caseCard.appendChild(attachmentsSection);
    },

    renderAttachmentsList(attachments, caseId) {
        if (attachments.length === 0) {
            return '<p style="font-size: 0.75rem; color: var(--text-light); margin: 0;">No hay archivos adjuntos</p>';
        }

        return attachments.slice(0, 3).map(att => `
            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <span style="font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${att.name}
                </span>
            </div>
        `).join('') + (attachments.length> 3 ? `<p style="font-size: 0.7rem; color: var(--text-light); margin-top: 0.25rem;">+${attachments.length - 3} más...</p>` : '');
    },

    openAttachmentModal(caseId) {
        // Create modal if it doesn't exist
        if (!document.getElementById('attachments-modal')) {
            this.createAttachmentModal();
        }

        // Populate modal
        const modal = document.getElementById('attachments-modal');
        const title = modal.querySelector('.modal-title');
        const content = modal.querySelector('#attachments-modal-content');

        const caseData = window.NotaryCRM?.state.cases.find(c => c.id === caseId);
        title.textContent = `Adjuntos - ${caseData?.caseNumber || 'Caso'}`;

        const attachments = this.getAttachments(caseId);
        content.innerHTML = `
            <div class="form-group">
                <label class="form-label">Agregar Archivos</label>
                <input 
                    type="file" 
                    id="case-attachment-input-${caseId}" 
                    multiple 
                    accept="*/*"
                    style="display: none;">
                <button 
                    type="button" 
                    class="btn btn-primary btn-block"
                    onclick="document.getElementById('case-attachment-input-${caseId}').click()">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Seleccionar Archivos
                </button>
            </div>
            <div id="current-attachments-${caseId}" style="margin-top: 1.5rem;">
                <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem;">
                    Archivos Adjuntos (${attachments.length})
                </h5>
                ${this.renderFullAttachmentsList(attachments, caseId)}
            </div>
        `;

        // Attach file input listener
        setTimeout(() => {
            const input = document.getElementById(`case-attachment-input-${caseId}`);
            if (input) {
                input.addEventListener('change', (e) => this.handleAttachmentUpload(e, caseId));
            }
        }, 100);

        if (window.NotaryCRM) {
            window.NotaryCRM.openModal('attachments-modal');
        }
    },

    createAttachmentModal() {
        const modal = document.createElement('div');
        modal.id = 'attachments-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Gestión de Adjuntos</h3>
                    <button class="modal-close" onclick="NotaryCRM.closeModal('attachments-modal')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" id="attachments-modal-content">
                    <!-- Content will be populated dynamically -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    renderFullAttachmentsList(attachments, caseId) {
        if (attachments.length === 0) {
            return '<p class="empty-state">No hay archivos adjuntos</p>';
        }

        return attachments.map((att, index) => `
            <div class="attachment-item" style="
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem;
                background: var(--bg-card);
                border: 1px solid var(--color-gray-200);
                border-radius: 8px;
                margin-bottom: 0.5rem;
            ">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${att.name}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-light);">
                        ${att.size} • ${att.type} • ${att.uploadedAt}
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button 
                        class="btn btn-sm btn-icon"
                        onclick="CaseAttachmentsManager.downloadAttachment('${caseId}', ${index})"
                        aria-label="Download attachment">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                    <button 
                        class="btn btn-sm btn-icon btn-danger"
                        onclick="CaseAttachmentsManager.removeAttachment('${caseId}', ${index})"
                        aria-label="Remove attachment">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    },

    handleAttachmentUpload(event, caseId) {
        const files = Array.from(event.target.files);

        files.forEach(file => {
            const attachment = {
                name: file.name,
                size: this.formatFileSize(file.size),
                type: file.type || 'unknown',
                uploadedAt: new Date().toLocaleDateString('es-ES'),
                data: null // In production, this would be uploaded to server
            };

            // Store file data as base64 (for demo purposes)
            const reader = new FileReader();
            reader.onload = (e) => {
                attachment.data = e.target.result;
                this.addAttachment(caseId, attachment);
                this.refreshAttachmentsList(caseId);

                Toast.success('Archivo Adjuntado', `${file.name} agregado exitosamente`);
            };
            reader.readAsDataURL(file);
        });
    },

    addAttachment(caseId, attachment) {
        const current = this.attachments.get(caseId) || [];
        current.push(attachment);
        this.attachments.set(caseId, current);
        this.save();
    },

    removeAttachment(caseId, index) {
        const current = this.attachments.get(caseId) || [];
        const removed = current.splice(index, 1);
        this.attachments.set(caseId, current);
        this.save();
        this.refreshAttachmentsList(caseId);

        Toast.info('Archivo Eliminado', `${removed[0]?.name || 'Archivo'} eliminado`);
    },

    downloadAttachment(caseId, index) {
        const attachments = this.attachments.get(caseId) || [];
        const attachment = attachments[index];

        if (!attachment || !attachment.data) {
            Toast.error('Error', 'No se pudo descargar el archivo');
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = attachment.name;
        link.click();

        Toast.success('Descarga Iniciada', attachment.name);
    },

    refreshAttachmentsList(caseId) {
        const container = document.getElementById(`current-attachments-${caseId}`);
        if (container) {
            const attachments = this.getAttachments(caseId);
            container.innerHTML = `
                <h5 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem;">
                    Archivos Adjuntos (${attachments.length})
                </h5>
                ${this.renderFullAttachmentsList(attachments, caseId)}
            `;
        }

        // Update case card
        const listContainer = document.getElementById(`attachments-list-${caseId}`);
        if (listContainer) {
            const attachments = this.getAttachments(caseId);
            listContainer.innerHTML = this.renderAttachmentsList(attachments, caseId);

            // Update count
            const section = listContainer.closest('.attachments-section');
            const countElement = section?.querySelector('h5');
            if (countElement) {
                countElement.textContent = `📎 Adjuntos (${attachments.length})`;
            }
        }
    },

    getAttachments(caseId) {
        return this.attachments.get(caseId) || [];
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
};

if (typeof window !== 'undefined') {
    window.CaseAttachmentsManager = CaseAttachmentsManager;
}
