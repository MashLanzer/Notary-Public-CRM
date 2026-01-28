// ============================================
// FILE UPLOAD PREVIEW MANAGER
// ============================================

const FileUploadManager = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: {
        images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    },

    init() {
        this.setupFileInputs();
        this.createPreviewModal();
    },

    setupFileInputs() {
        // Create file input for cases
        const caseForm = document.getElementById('case-form');
        if (caseForm && !document.getElementById('case-file-input')) {
            this.addFileInputToForm(caseForm, 'case-file-input', 'Adjuntar Documentos');
        }

        // Create file input for clients - specifically in Step 3
        const clientForm = document.getElementById('client-form');
        if (clientForm && !document.getElementById('client-file-input')) {
            // Target step 3 specifically
            const step3 = clientForm.querySelector('.form-step[data-step="3"]');
            if (step3) {
                this.addFileInputToForm(step3, 'client-file-input', 'Adjuntar Documentos (Identificación, Poderes, etc.)');
            } else {
                this.addFileInputToForm(clientForm, 'client-file-input', 'Adjuntar Documentos');
            }
        }
    },

    addFileInputToForm(parent, inputId, label) {
        const fileGroup = document.createElement('div');
        fileGroup.className = 'form-group';
        fileGroup.innerHTML = `
            <label class="form-label">${label}</label>
            <div class="file-upload-area" id="${inputId}-area">
                <input 
                    type="file" 
                    id="${inputId}" 
                    class="file-input" 
                    multiple 
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    style="display: none;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('${inputId}').click()">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    Seleccionar Archivos
                </button>
                <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">
                    Máximo 10MB por archivo. Formatos: JPG, PNG, PDF, DOC, XLS
                </p>
                <div id="${inputId}-previews" class="file-previews"></div>
            </div>
        `;

        // Insert before submit button or at the end
        const submitBtn = parent.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.parentElement.insertBefore(fileGroup, submitBtn);
        } else {
            parent.appendChild(fileGroup);
        }

        // Attach event listener
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', (e) => this.handleFileSelect(e, inputId));
        }
    },

    handleFileSelect(event, inputId) {
        const files = Array.from(event.target.files);
        const previewContainer = document.getElementById(`${inputId}-previews`);

        if (!previewContainer) return;

        // Clear previous previews
        previewContainer.innerHTML = '';

        files.forEach((file, index) => {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                Toast.error('Archivo Inválido', validation.error);
                return;
            }

            // Create preview
            this.createFilePreview(file, index, previewContainer, inputId);
        });

        // Announce for screen readers
        if (window.ScreenReaderManager) {
            ScreenReaderManager.announce(`${files.length} archivo(s) seleccionado(s)`);
        }
    },

    validateFile(file) {
        // Check file size
        if (file.size> this.maxFileSize) {
            return {
                valid: false,
                error: `El archivo ${file.name} excede el tamaño máximo de 10MB`
            };
        }

        // Check file type
        const allAllowedTypes = [
            ...this.allowedTypes.images,
            ...this.allowedTypes.documents,
            ...this.allowedTypes.spreadsheets
        ];

        if (!allAllowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `Tipo de archivo no permitido: ${file.type}`
            };
        }

        return { valid: true };
    },

    createFilePreview(file, index, container, inputId) {
        const preview = document.createElement('div');
        preview.className = 'file-preview-item';
        preview.style.cssText = `
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            background: var(--bg-card);
            border: 1px solid var(--color-gray-200);
            border-radius: 8px;
            margin-top: 0.5rem;
        `;

        // Create thumbnail
        const thumbnail = document.createElement('div');
        thumbnail.className = 'file-thumbnail';
        thumbnail.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 4px;
            overflow: hidden;
            background: var(--color-gray-100);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        `;

        if (this.allowedTypes.images.includes(file.type)) {
            // Image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                thumbnail.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;" alt="${file.name}">`;
            };
            reader.readAsDataURL(file);
        } else {
            // Icon for documents
            const icon = this.getFileIcon(file.type);
            thumbnail.innerHTML = icon;
        }

        // File info
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1; min-width: 0;';
        info.innerHTML = `
            <div style="font-weight: 600; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${file.name}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-light);">
                ${this.formatFileSize(file.size)} • ${file.type.split('/')[1].toUpperCase()}
            </div>
        `;

        // Actions
        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 0.5rem;';

        // Preview button
        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'btn btn-sm btn-icon';
        previewBtn.setAttribute('aria-label', 'Preview file');
        previewBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
        previewBtn.onclick = () => this.showFilePreview(file);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-sm btn-icon btn-danger';
        removeBtn.setAttribute('aria-label', 'Remove file');
        removeBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;
        removeBtn.onclick = () => {
            preview.remove();
            this.removeFileFromInput(inputId, index);
        };

        actions.appendChild(previewBtn);
        actions.appendChild(removeBtn);

        preview.appendChild(thumbnail);
        preview.appendChild(info);
        preview.appendChild(actions);

        container.appendChild(preview);
    },

    getFileIcon(type) {
        if (type.includes('pdf')) {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="width: 32px; height: 32px;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <text x="12" y="16" text-anchor="middle" fill="#dc2626" font-size="6" font-weight="bold">PDF</text>
            </svg>`;
        } else if (type.includes('word')) {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" style="width: 32px; height: 32px;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <text x="12" y="16" text-anchor="middle" fill="#2563eb" font-size="6" font-weight="bold">DOC</text>
            </svg>`;
        } else if (type.includes('sheet') || type.includes('excel')) {
            return `<svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="width: 32px; height: 32px;">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <text x="12" y="16" text-anchor="middle" fill="#16a34a" font-size="6" font-weight="bold">XLS</text>
            </svg>`;
        }
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 32px; height: 32px;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
        </svg>`;
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    removeFileFromInput(inputId, index) {
        const input = document.getElementById(inputId);
        if (!input || !input.files) return;

        const dt = new DataTransfer();
        const files = Array.from(input.files);

        files.forEach((file, i) => {
            if (i !== index) {
                dt.items.add(file);
            }
        });

        input.files = dt.files;

        if (window.ScreenReaderManager) {
            ScreenReaderManager.announce('Archivo eliminado');
        }
    },

    createPreviewModal() {
        if (document.getElementById('file-preview-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'file-preview-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
                <div class="modal-header">
                    <h3 class="modal-title">Vista Previa</h3>
                    <button class="modal-close" onclick="NotaryCRM.closeModal('file-preview-modal')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body" id="file-preview-content" style="max-height: 70vh; overflow: auto;">
                    <!-- Preview content will be inserted here -->
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    showFilePreview(file) {
        const content = document.getElementById('file-preview-content');
        if (!content) return;

        content.innerHTML = '';

        if (this.allowedTypes.images.includes(file.type)) {
            // Image preview
            const reader = new FileReader();
            reader.onload = (e) => {
                content.innerHTML = `
                    <img src="${e.target.result}" 
                         style="max-width: 100%; height: auto; display: block; margin: 0 auto;" 
                         alt="${file.name}">
                `;
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            // PDF preview
            const reader = new FileReader();
            reader.onload = (e) => {
                content.innerHTML = `
                    <embed src="${e.target.result}" 
                           type="application/pdf" 
                           style="width: 100%; height: 600px;">
                `;
            };
            reader.readAsDataURL(file);
        } else {
            // Document info
            content.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    ${this.getFileIcon(file.type)}
                    <h4 style="margin-top: 1rem;">${file.name}</h4>
                    <p style="color: var(--text-light);">
                        ${this.formatFileSize(file.size)} • ${file.type}
                    </p>
                    <p style="margin-top: 1rem;">
                        La vista previa no está disponible para este tipo de archivo.
                    </p>
                </div>
            `;
        }

        if (window.NotaryCRM) {
            window.NotaryCRM.openModal('file-preview-modal');
        }
    },

    getFiles(inputId) {
        const input = document.getElementById(inputId);
        return input ? Array.from(input.files) : [];
    }
};

if (typeof window !== 'undefined') {
    window.FileUploadManager = FileUploadManager;
}
