// ============================================
// NOTARY CRM - VANILLA JAVASCRIPT APPLICATION
// ============================================

// Application State
const NotaryCRM = {
    state: {
        clients: [],
        cases: [],
        activeTab: 'dashboard',
        searchClientQuery: '',
        searchCaseQuery: ''
    },

    // Initialize application
    init() {
        this.loadData();
        this.attachEventListeners();
        this.render();
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

    // Attach event listeners
    attachEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Modal controls
        document.getElementById('add-client-btn').addEventListener('click', () => {
            this.openModal('client-modal');
        });

        document.getElementById('add-case-btn').addEventListener('click', () => {
            this.openModal('case-modal');
        });

        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Form submissions
        document.getElementById('client-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addClient(e.target);
        });

        document.getElementById('case-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCase(e.target);
        });

        // Search functionality
        document.getElementById('search-clients').addEventListener('input', (e) => {
            this.state.searchClientQuery = e.target.value.toLowerCase();
            this.renderClients();
        });

        document.getElementById('search-cases').addEventListener('input', (e) => {
            this.state.searchCaseQuery = e.target.value.toLowerCase();
            this.renderCases();
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
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
    },

    // Modal controls
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    },

    // Add client
    addClient(form) {
        const formData = new FormData(form);
        const client = {
            id: Date.now().toString(),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            joinDate: new Date().toISOString().split('T')[0]
        };

        this.state.clients.push(client);
        this.saveData();
        this.closeModal('client-modal');
        this.render();
    },

    // Delete client
    deleteClient(id) {
        if (confirm('Are you sure you want to delete this client?')) {
            this.state.clients = this.state.clients.filter(c => c.id !== id);
            this.saveData();
            this.render();
        }
    },

    // Add case
    addCase(form) {
        const formData = new FormData(form);
        const caseItem = {
            id: Date.now().toString(),
            caseNumber: formData.get('caseNumber'),
            clientName: formData.get('clientName'),
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            dueDate: formData.get('dueDate'),
            description: formData.get('description'),
            status: 'pending'
        };

        this.state.cases.push(caseItem);
        this.saveData();
        this.closeModal('case-modal');
        this.render();
    },

    // Delete case
    deleteCase(id) {
        if (confirm('Are you sure you want to delete this case?')) {
            this.state.cases = this.state.cases.filter(c => c.id !== id);
            this.saveData();
            this.render();
        }
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
        
        // Filter clients based on search
        const filteredClients = this.state.clients.filter(client => 
            client.name.toLowerCase().includes(this.state.searchClientQuery)
        );

        if (filteredClients.length === 0) {
            container.innerHTML = '<p class="empty-state">No clients found.</p>';
            return;
        }

        container.innerHTML = filteredClients.map(client => `
            <div class="client-card">
                <div class="client-header">
                    <div class="client-info">
                        <div class="client-avatar">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="client-name">${client.name}</h3>
                            <p class="client-id">ID: ${client.id}</p>
                        </div>
                    </div>
                    <button class="btn-danger" onclick="NotaryCRM.deleteClient('${client.id}')">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <div class="client-details">
                    <div class="client-detail">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        ${client.email}
                    </div>
                    <div class="client-detail">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        ${client.phone}
                    </div>
                    <div class="client-detail">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ${client.address}
                    </div>
                    <div class="client-footer">
                        Joined: ${this.formatDate(client.joinDate)}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Render cases
    renderCases() {
        const container = document.getElementById('cases-list');
        
        // Filter cases based on search
        const filteredCases = this.state.cases.filter(c => 
            c.caseNumber.toLowerCase().includes(this.state.searchCaseQuery) ||
            c.clientName.toLowerCase().includes(this.state.searchCaseQuery)
        );

        if (filteredCases.length === 0) {
            container.innerHTML = '<p class="empty-state">No cases found.</p>';
            return;
        }

        container.innerHTML = filteredCases.map(caseItem => `
            <div class="case-card">
                <div class="case-header">
                    <div>
                        <div class="case-title-row">
                            <h3 class="case-number">${caseItem.caseNumber}</h3>
                            ${this.renderStatusBadge(caseItem.status)}
                        </div>
                        <p class="case-description">${caseItem.description}</p>
                    </div>
                    <button class="btn-danger" onclick="NotaryCRM.deleteCase('${caseItem.id}')">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <div class="case-details-grid">
                    <div class="case-detail-item">
                        <p class="case-detail-label">Client</p>
                        <p class="case-detail-value">${caseItem.clientName}</p>
                    </div>
                    <div class="case-detail-item">
                        <p class="case-detail-label">Type</p>
                        <p class="case-detail-value">${caseItem.type}</p>
                    </div>
                    <div class="case-detail-item">
                        <p class="case-detail-label">Amount</p>
                        <p class="case-detail-value amount">$${caseItem.amount}</p>
                    </div>
                    <div class="case-detail-item">
                        <p class="case-detail-label">Due Date</p>
                        <p class="case-detail-value">${this.formatDate(caseItem.dueDate)}</p>
                    </div>
                </div>
            </div>
        `).join('');
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

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotaryCRM.init());
} else {
    NotaryCRM.init();
}
