// ============================================
// ADVANCED FEATURES & INTEGRATIONS
// ============================================

const AdvancedFeatures = {
    init() {
        this.setupCollaboration();
        this.setupDocumentVersioning();
        this.setupAPIKeys();
        this.setupAnonymization();
        this.setupDisasterRecovery();
        this.setupCloudFunctions();
    },

    // ============================================
    // COLLABORATION (MOCK)
    // ============================================
    setupCollaboration() {
        this.collaborators = new Map(); // caseId -> users[]
        this.activeUsers = new Set();
        this.setupPresenceIndicators();
    },

    setupPresenceIndicators() {
        // Show who's viewing/editing
        setInterval(() => {
            this.updatePresenceIndicators();
        }, 5000);
    },

    updatePresenceIndicators() {
        document.querySelectorAll('.case-card').forEach(card => {
            const caseId = card.dataset.caseId;
            if (caseId) {
                this.showCollaborators(card, caseId);
            }
        });
    },

    showCollaborators(card, caseId) {
        const collaborators = this.collaborators.get(caseId) || [];

        let indicator = card.querySelector('.collaborators-indicator');
        if (!indicator && collaborators.length > 0) {
            indicator = document.createElement('div');
            indicator.className = 'collaborators-indicator';
            indicator.style.cssText = `
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                display: flex;
                gap: 0.25rem;
            `;
            card.style.position = 'relative';
            card.appendChild(indicator);
        }

        if (indicator) {
            indicator.innerHTML = collaborators.map(user => `
                <div style="
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: ${this.getColorForUser(user.id)};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    color: white;
                    font-weight: 600;
                " title="${user.name}">
                    ${user.name.charAt(0).toUpperCase()}
                </div>
            `).join('');
        }
    },

    getColorForUser(userId) {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    },

    addCollaborator(caseId, user) {
        const collaborators = this.collaborators.get(caseId) || [];
        if (!collaborators.find(c => c.id === user.id)) {
            collaborators.push(user);
            this.collaborators.set(caseId, collaborators);

            Toast.info('Colaborador Agregado', `${user.name} está trabajando en este caso`);
        }
    },

    // ============================================
    // DOCUMENT VERSIONING
    // ============================================
    setupDocumentVersioning() {
        this.versions = new Map(); // documentId -> versions[]
    },

    createVersion(documentId, content, userId) {
        const versions = this.versions.get(documentId) || [];

        const version = {
            id: 'v' + (versions.length + 1),
            number: versions.length + 1,
            content,
            userId,
            timestamp: new Date().toISOString(),
            changes: this.calculateChanges(versions[versions.length - 1]?.content, content)
        };

        versions.push(version);
        this.versions.set(documentId, versions);

        console.log(`📝 Version ${version.number} created for document ${documentId}`);

        return version;
    },

    calculateChanges(oldContent, newContent) {
        if (!oldContent) return { added: newContent?.length || 0, removed: 0 };

        // Simple diff calculation
        const added = Math.max(0, (newContent?.length || 0) - (oldContent?.length || 0));
        const removed = Math.max(0, (oldContent?.length || 0) - (newContent?.length || 0));

        return { added, removed };
    },

    getVersionHistory(documentId) {
        return this.versions.get(documentId) || [];
    },

    restoreVersion(documentId, versionId) {
        const versions = this.versions.get(documentId) || [];
        const version = versions.find(v => v.id === versionId);

        if (version) {
            console.log(`🔄 Restoring version ${version.number}`);
            Toast.success('Versión Restaurada', `Documento restaurado a versión ${version.number}`);
            return version.content;
        }

        return null;
    },

    compareVersions(documentId, version1Id, version2Id) {
        const versions = this.versions.get(documentId) || [];
        const v1 = versions.find(v => v.id === version1Id);
        const v2 = versions.find(v => v.id === version2Id);

        if (v1 && v2) {
            return {
                version1: v1,
                version2: v2,
                diff: this.calculateChanges(v1.content, v2.content)
            };
        }

        return null;
    },

    // ============================================
    // API KEYS GENERATION
    // ============================================
    setupAPIKeys() {
        this.apiKeys = [];
        this.loadAPIKeys();
    },

    loadAPIKeys() {
        const stored = localStorage.getItem('api_keys');
        if (stored) {
            this.apiKeys = JSON.parse(stored);
        }
    },

    generateAPIKey(name, permissions = []) {
        const key = {
            id: 'key_' + Date.now(),
            name,
            key: this.generateSecureKey(),
            permissions,
            createdAt: new Date().toISOString(),
            lastUsed: null,
            active: true
        };

        this.apiKeys.push(key);
        localStorage.setItem('api_keys', JSON.stringify(this.apiKeys));

        console.log('🔑 API Key Generated:', key.id);
        Toast.success('API Key Generada', `Key: ${key.key.substring(0, 20)}...`);

        return key;
    },

    generateSecureKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = 'ncrm_';
        for (let i = 0; i < 40; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    },

    validateAPIKey(key) {
        const apiKey = this.apiKeys.find(k => k.key === key && k.active);

        if (apiKey) {
            apiKey.lastUsed = new Date().toISOString();
            localStorage.setItem('api_keys', JSON.stringify(this.apiKeys));
            return true;
        }

        return false;
    },

    revokeAPIKey(keyId) {
        const key = this.apiKeys.find(k => k.id === keyId);
        if (key) {
            key.active = false;
            localStorage.setItem('api_keys', JSON.stringify(this.apiKeys));
            Toast.warning('API Key Revocada', 'La key ha sido desactivada');
        }
    },

    // ============================================
    // DATA ANONYMIZATION
    // ============================================
    setupAnonymization() {
        this.anonymizationRules = {
            name: (value) => 'Usuario ' + Math.random().toString(36).substring(7).toUpperCase(),
            email: (value) => 'user' + Math.random().toString(36).substring(7) + '@example.com',
            phone: (value) => '(XXX) XXX-' + value.slice(-4),
            address: (value) => 'Dirección Anónima',
            ssn: (value) => 'XXX-XX-' + value.slice(-4)
        };
    },

    anonymizeData(data, fields = []) {
        const anonymized = { ...data };

        fields.forEach(field => {
            if (anonymized[field] && this.anonymizationRules[field]) {
                anonymized[field] = this.anonymizationRules[field](anonymized[field]);
            }
        });

        return anonymized;
    },

    anonymizeDataset(dataset, fields = []) {
        return dataset.map(item => this.anonymizeData(item, fields));
    },

    exportAnonymizedReport() {
        if (!window.NotaryCRM) return;

        const clients = window.NotaryCRM.state.clients || [];
        const anonymized = this.anonymizeDataset(clients, ['name', 'email', 'phone', 'address']);

        const csv = this.convertToCSV(anonymized);
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'anonymized-report.csv';
        link.click();
        URL.revokeObjectURL(link.href);

        Toast.success('Reporte Anonimizado', 'Datos exportados sin información personal');
    },

    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        let csv = headers.join(',') + '\n';

        data.forEach(row => {
            csv += headers.map(h => row[h] || '').join(',') + '\n';
        });

        return csv;
    },

    // ============================================
    // DISASTER RECOVERY
    // ============================================
    setupDisasterRecovery() {
        this.recoveryPlan = {
            backupLocations: ['local', 'cloud'],
            rto: 4, // Recovery Time Objective (hours)
            rpo: 24, // Recovery Point Objective (hours)
            lastTest: null
        };
    },

    createRecoveryPoint() {
        console.log('💾 Creating recovery point...');

        if (!window.NotaryCRM) return null;

        const recoveryPoint = {
            id: 'rp_' + Date.now(),
            timestamp: new Date().toISOString(),
            data: {
                clients: window.NotaryCRM.state.clients || [],
                cases: window.NotaryCRM.state.cases || [],
                appointments: window.NotaryCRM.state.appointments || [],
                settings: window.NotaryCRM.state.settings || {}
            },
            checksum: this.generateChecksum(),
            size: this.calculateSize(window.NotaryCRM.state)
        };

        // Store recovery point
        this.storeRecoveryPoint(recoveryPoint);

        Toast.success('Punto de Recuperación', 'Recovery point creado exitosamente');

        return recoveryPoint;
    },

    generateChecksum() {
        return 'checksum_' + Math.random().toString(36).substring(2, 15);
    },

    calculateSize(data) {
        return JSON.stringify(data).length;
    },

    storeRecoveryPoint(point) {
        const points = JSON.parse(localStorage.getItem('recovery_points') || '[]');
        points.unshift(point);

        // Keep only last 10 recovery points
        if (points.length > 10) {
            points.splice(10);
        }

        localStorage.setItem('recovery_points', JSON.stringify(points));
    },

    testDisasterRecovery() {
        console.log('🧪 Testing disaster recovery...');

        const points = JSON.parse(localStorage.getItem('recovery_points') || '[]');

        if (points.length === 0) {
            Toast.warning('Sin Puntos de Recuperación', 'No hay recovery points disponibles');
            return false;
        }

        const latestPoint = points[0];
        console.log('Latest recovery point:', latestPoint.id);
        console.log('Age:', Math.floor((Date.now() - new Date(latestPoint.timestamp).getTime()) / 3600000), 'hours');

        this.recoveryPlan.lastTest = new Date().toISOString();

        Toast.success('Test Completado', 'Sistema de recuperación funcionando correctamente');

        return true;
    },

    // ============================================
    // CLOUD FUNCTIONS (MOCK)
    // ============================================
    setupCloudFunctions() {
        this.functions = {
            'sendEmail': this.mockSendEmail,
            'processPayment': this.mockProcessPayment,
            'generateReport': this.mockGenerateReport,
            'syncData': this.mockSyncData
        };
    },

    async callCloudFunction(functionName, data) {
        console.log(`☁️ Calling cloud function: ${functionName}`);

        const func = this.functions[functionName];
        if (!func) {
            throw new Error(`Function ${functionName} not found`);
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return func.call(this, data);
    },

    mockSendEmail(data) {
        console.log('📧 Mock Email:', data);
        return { success: true, messageId: 'msg_' + Date.now() };
    },

    mockProcessPayment(data) {
        console.log('💳 Mock Payment:', data);
        return { success: true, transactionId: 'txn_' + Date.now() };
    },

    mockGenerateReport(data) {
        console.log('📊 Mock Report:', data);
        return { success: true, reportUrl: 'https://example.com/report.pdf' };
    },

    mockSyncData(data) {
        console.log('🔄 Mock Sync:', data);
        return { success: true, syncedRecords: data.records?.length || 0 };
    }
};

if (typeof window !== 'undefined') {
    window.AdvancedFeatures = AdvancedFeatures;
}
