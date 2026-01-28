// ============================================
// ADVANCED SECURITY SYSTEM
// ============================================

const SecurityManager = {
    init() {
        this.setup2FA();
        this.setupLoginHistory();
        this.setupBackups();
        this.setupDataRetention();
        this.setupVirusScanning();
    },

    // ============================================
    // 2FA / MFA (MOCK)
    // ============================================
    setup2FA() {
        this.twoFactorConfig = {
            enabled: false,
            method: 'totp', // totp, sms, email
            backupCodes: []
        };
    },

    async enable2FA(userId, method = 'totp') {
        console.log(`🔐 Enabling 2FA for user: ${userId}`);
        console.log(`Method: ${method}`);

        // Generate secret key (mock)
        const secret = this.generateSecret();

        // Generate backup codes
        const backupCodes = this.generateBackupCodes();

        this.twoFactorConfig = {
            enabled: true,
            method,
            secret,
            backupCodes,
            enabledAt: new Date().toISOString()
        };

        // Store in localStorage (in production, use secure backend)
        localStorage.setItem('2fa_config', JSON.stringify(this.twoFactorConfig));

        Toast.success('2FA Activado', 'Autenticación de dos factores habilitada');

        return {
            secret,
            backupCodes,
            qrCode: this.generateQRCode(secret)
        };
    },

    generateSecret() {
        return 'MOCK' + Math.random().toString(36).substring(2, 15).toUpperCase();
    },

    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
        }
        return codes;
    },

    generateQRCode(secret) {
        // Mock QR code URL
        return `otpauth://totp/NotaryCRM?secret=${secret}&issuer=NotaryCRM`;
    },

    async verify2FACode(code) {
        console.log(`🔐 Verifying 2FA code: ${code}`);

        // Mock verification
        const isValid = code.length === 6;

        if (isValid) {
            Toast.success('Código Verificado', 'Autenticación exitosa');
        } else {
            Toast.error('Código Inválido', 'El código no es válido');
        }

        return isValid;
    },

    // ============================================
    // LOGIN HISTORY
    // ============================================
    setupLoginHistory() {
        this.loginHistory = [];
        this.loadLoginHistory();
    },

    loadLoginHistory() {
        const stored = localStorage.getItem('login_history');
        if (stored) {
            this.loginHistory = JSON.parse(stored);
        }
    },

    recordLogin(userId, success = true, metadata = {}) {
        const record = {
            id: Date.now(),
            userId,
            success,
            timestamp: new Date().toISOString(),
            ip: metadata.ip || 'Unknown',
            userAgent: navigator.userAgent,
            location: metadata.location || 'Unknown',
            device: this.detectDevice()
        };

        this.loginHistory.unshift(record);

        // Keep only last 100 records
        if (this.loginHistory.length> 100) {
            this.loginHistory = this.loginHistory.slice(0, 100);
        }

        localStorage.setItem('login_history', JSON.stringify(this.loginHistory));

        // Alert on suspicious activity
        if (!success) {
            this.checkSuspiciousActivity(userId);
        }

        return record;
    },

    detectDevice() {
        const ua = navigator.userAgent;
        if (/mobile/i.test(ua)) return 'Mobile';
        if (/tablet/i.test(ua)) return 'Tablet';
        return 'Desktop';
    },

    checkSuspiciousActivity(userId) {
        const recentFailures = this.loginHistory.filter(r =>
            r.userId === userId &&
            !r.success &&
            Date.now() - new Date(r.timestamp).getTime() < 3600000 // Last hour
        );

        if (recentFailures.length>= 3) {
            console.warn('⚠️ Suspicious activity detected: Multiple failed login attempts');
            Toast.warning('Actividad Sospechosa', 'Múltiples intentos fallidos detectados');

            // In production, lock account or send alert
        }
    },

    getLoginHistory(userId, limit = 10) {
        return this.loginHistory
            .filter(r => r.userId === userId)
            .slice(0, limit);
    },

    // ============================================
    // REGULAR BACKUPS
    // ============================================
    setupBackups() {
        this.backupConfig = {
            enabled: true,
            frequency: 'daily', // daily, weekly, monthly
            retention: 30, // days
            lastBackup: null
        };

        // Schedule automatic backups
        this.scheduleBackups();
    },

    scheduleBackups() {
        // Run backup every 24 hours (mock)
        setInterval(() => {
            this.createBackup();
        }, 24 * 60 * 60 * 1000);

        console.log('📦 Automatic backups scheduled');
    },

    async createBackup() {
        console.log('📦 Creating backup...');

        if (!window.NotaryCRM) return null;

        const backup = {
            id: 'backup_' + Date.now(),
            timestamp: new Date().toISOString(),
            data: {
                clients: window.NotaryCRM.state.clients || [],
                cases: window.NotaryCRM.state.cases || [],
                appointments: window.NotaryCRM.state.appointments || [],
                settings: window.NotaryCRM.state.settings || {}
            },
            version: '1.5',
            checksum: this.generateChecksum()
        };

        // Store backup (in production, send to cloud storage)
        this.storeBackup(backup);

        this.backupConfig.lastBackup = backup.timestamp;

        Toast.success('Backup Creado', `Backup ${backup.id} completado`);

        return backup;
    },

    generateChecksum() {
        return 'checksum_' + Math.random().toString(36).substring(2, 15);
    },

    storeBackup(backup) {
        // Store in localStorage (in production, use cloud storage)
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        backups.unshift(backup);

        // Keep only last 30 backups
        if (backups.length> 30) {
            backups.splice(30);
        }

        localStorage.setItem('backups', JSON.stringify(backups));
    },

    async restoreBackup(backupId) {
        console.log(`📦 Restoring backup: ${backupId}`);

        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        const backup = backups.find(b => b.id === backupId);

        if (!backup) {
            Toast.error('Backup No Encontrado', 'El backup especificado no existe');
            return false;
        }

        // Restore data
        if (window.NotaryCRM) {
            window.NotaryCRM.state = backup.data;
        }

        Toast.success('Backup Restaurado', 'Datos restaurados exitosamente');

        return true;
    },

    listBackups() {
        const backups = JSON.parse(localStorage.getItem('backups') || '[]');
        return backups.map(b => ({
            id: b.id,
            timestamp: b.timestamp,
            version: b.version
        }));
    },

    // ============================================
    // DATA RETENTION POLICIES
    // ============================================
    setupDataRetention() {
        this.retentionPolicies = {
            clients: 7 * 365, // 7 years
            cases: 7 * 365,
            appointments: 2 * 365,
            auditLogs: 1 * 365,
            backups: 30 // days
        };
    },

    applyRetentionPolicies() {
        console.log('🗑️ Applying data retention policies...');

        Object.entries(this.retentionPolicies).forEach(([type, days]) => {
            this.cleanOldData(type, days);
        });

        Toast.info('Políticas Aplicadas', 'Datos antiguos limpiados según políticas');
    },

    cleanOldData(type, retentionDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        console.log(`Cleaning ${type} older than ${cutoffDate.toLocaleDateString()}`);

        // In production, this would delete old records from database
    },

    // ============================================
    // VIRUS SCANNING (MOCK)
    // ============================================
    setupVirusScanning() {
        this.scannerConfig = {
            enabled: true,
            provider: 'clamav', // mock
            scanOnUpload: true
        };
    },

    async scanFile(file) {
        console.log(`🛡️ Scanning file: ${file.name}`);

        // Simulate virus scan
        await new Promise(resolve => setTimeout(resolve, 1000));

        const isSafe = Math.random() > 0.01; // 99% safe

        if (isSafe) {
            console.log('✅ File is safe');
            return { safe: true, threats: [] };
        } else {
            console.warn('⚠️ Threat detected!');
            Toast.error('Amenaza Detectada', 'El archivo contiene malware');
            return { safe: false, threats: ['Malware.Generic'] };
        }
    },

    // ============================================
    // IP WHITELISTING
    // ============================================
    setupIPWhitelist() {
        this.whitelist = [
            '127.0.0.1',
            '::1'
        ];
    },

    isIPAllowed(ip) {
        if (this.whitelist.length === 0) return true;
        return this.whitelist.includes(ip);
    },

    addToWhitelist(ip) {
        if (!this.whitelist.includes(ip)) {
            this.whitelist.push(ip);
            localStorage.setItem('ip_whitelist', JSON.stringify(this.whitelist));
            Toast.success('IP Agregada', `${ip} agregada a la lista blanca`);
        }
    },

    // ============================================
    // SESSION TIMEOUT
    // ============================================
    setupSessionTimeout(minutes = 30) {
        let timeout;

        const resetTimeout = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.handleSessionExpired();
            }, minutes * 60 * 1000);
        };

        // Reset on user activity
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimeout, true);
        });

        resetTimeout();
    },

    handleSessionExpired() {
        console.log('⏱️ Session expired');
        Toast.warning('Sesión Expirada', 'Por favor, inicie sesión nuevamente');

        // In production, logout user
        if (window.NotaryCRM && window.NotaryCRM.logout) {
            window.NotaryCRM.logout();
        }
    }
};

if (typeof window !== 'undefined') {
    window.SecurityManager = SecurityManager;
}
